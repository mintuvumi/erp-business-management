import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";

function getPaymentType({ paidAmount, targetAmount }) {
  const paid = Number(paidAmount || 0);
  const target = Number(targetAmount || 0);

  if (paid <= 0) return "credit";
  if (paid >= target) return "cash";
  return "partial";
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const saleId = body.saleId;
    const amount = Number(body.amount || 0);
    const paymentDate = body.date || new Date().toISOString().slice(0, 10);
    const note = body.note || "";

    if (!saleId) {
      return NextResponse.json(
        { success: false, message: "Sale ID required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Sale ID" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid payment amount required" },
        { status: 400 }
      );
    }

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 }
      );
    }

    if (sale.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "Cancelled sale payment not allowed" },
        { status: 400 }
      );
    }

    const previousPaidAmount = Number(sale.paidAmount || 0);

    const invoiceTotal = Number(
      sale.invoiceTotal || sale.grossAmount || sale.netTotal || 0
    );

    const netReceivable = Number(sale.netReceivable || 0);

    const currentStatementDue = Math.max(
      netReceivable - previousPaidAmount,
      0
    );

    if (currentStatementDue <= 0) {
      return NextResponse.json(
        { success: false, message: "This invoice is already fully paid" },
        { status: 400 }
      );
    }

    if (amount > currentStatementDue) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment amount cannot be greater than current due ৳ ${currentStatementDue.toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    const newPaidAmount = previousPaidAmount + amount;

    const invoiceDueAmount = Math.max(invoiceTotal - newPaidAmount, 0);
    const statementDueAmount = Math.max(netReceivable - newPaidAmount, 0);

    sale.paidAmount = newPaidAmount;
    sale.invoiceDueAmount = invoiceDueAmount;
    sale.statementDueAmount = statementDueAmount;

    // old compatible field
    sale.dueAmount = statementDueAmount;

    sale.paymentType = getPaymentType({
      paidAmount: newPaidAmount,
      targetAmount: invoiceTotal,
    });

    await sale.save();

    await CashTransaction.create({
      type: "in",
      category: "due_collection",
      title: `Due collection from ${sale.customerName}`,
      amount,
      date: paymentDate,
      note,
      refType: "sale",
      refId: sale._id.toString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment added successfully",
        data: {
          saleId: sale._id,
          customerName: sale.customerName,
          billNo: sale.billNo,

          receivedAmount: amount,
          paidAmount: newPaidAmount,

          invoiceTotal,
          invoiceDueAmount,

          netReceivable,
          statementDueAmount,

          paymentType: sale.paymentType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CUSTOMER_PAYMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to add payment",
      },
      { status: 500 }
    );
  }
}