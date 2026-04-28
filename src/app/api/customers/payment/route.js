import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { saleId, amount, date } = body;

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 }
      );
    }

    const paidAmount = Number(sale.paidAmount || 0) + Number(amount || 0);
    const dueAmount = Math.max(sale.netReceivable - paidAmount, 0);

    const paymentType =
      paidAmount <= 0
        ? "credit"
        : paidAmount >= sale.netReceivable
        ? "cash"
        : "partial";

    sale.paidAmount = paidAmount;
    sale.dueAmount = dueAmount;
    sale.paymentType = paymentType;

    await sale.save();

    // 🔥 CASH ENTRY
    await CashTransaction.create({
      type: "in",
      category: "due_collection",
      title: `Due collection from ${sale.customerName}`,
      amount: Number(amount),
      date: date || new Date().toISOString().slice(0, 10),
      refType: "sale",
      refId: sale._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "Payment added",
    });
  } catch (error) {
    console.error("CUSTOMER_PAYMENT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add payment" },
      { status: 500 }
    );
  }
}