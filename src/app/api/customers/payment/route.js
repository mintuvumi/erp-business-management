import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import { getTenant } from "@/lib/tenant";

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

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const sale = await Sale.findOne({
      _id: saleId,
      companyId: tenant.companyId,
    });

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

    let marketingOfficerId = body.marketingOfficerId || sale.marketingOfficerId;
    let marketingOfficerName = sale.marketingOfficerName || "";

    if (!marketingOfficerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Marketing Officer is required for due collection",
        },
        { status: 400 }
      );
    }

    const officer = await MarketingOfficer.findOne({
      _id: marketingOfficerId,
      companyId: tenant.companyId,
      status: "active",
    });

    if (!officer) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid Marketing Officer required",
        },
        { status: 400 }
      );
    }

    marketingOfficerId = officer._id;
    marketingOfficerName = officer.name;

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
    sale.dueAmount = statementDueAmount;

    sale.paymentType = getPaymentType({
      paidAmount: newPaidAmount,
      targetAmount: invoiceTotal,
    });

    if (!sale.marketingOfficerId) {
      sale.marketingOfficerId = marketingOfficerId;
      sale.marketingOfficerName = marketingOfficerName;
    }

    await sale.save();

    await CashTransaction.create({
      companyId: tenant.companyId,
      type: "in",
      category: "due_collection",
      title: `Due collection from ${sale.customerName}`,
      amount,
      date: paymentDate,
      note,
      refType: "sale",
      refId: sale._id.toString(),
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    await MarketingOfficerLedger.create({
      companyId: tenant.companyId,

      marketingOfficerId,
      marketingOfficerName,

      date: paymentDate,
      type: "collection",

      referenceType: "sale_due_collection",
      referenceId: sale._id,

      invoiceNo: sale.billNo || "",
      customerId: sale.customerId || null,
      customerName: sale.customerName || "",

      totalSales: 0,
      cashSales: 0,
      dueSales: 0,
      collectionAmount: amount,
      dueAmount: statementDueAmount,
      profitAmount: 0,

      note: note || `Due collection for invoice ${sale.billNo || ""}`,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment added successfully",
        data: {
          saleId: sale._id,
          customerName: sale.customerName,
          billNo: sale.billNo,

          marketingOfficerId,
          marketingOfficerName,

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