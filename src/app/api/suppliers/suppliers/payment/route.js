import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import CashTransaction from "@/models/CashTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { purchaseId, amount, date, note } = body;

    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return NextResponse.json(
        { success: false, message: "Purchase not found" },
        { status: 404 }
      );
    }

    const newPaidAmount =
      Number(purchase.paidAmount || 0) + Number(amount || 0);

    const newDueAmount = Math.max(Number(purchase.total || 0) - newPaidAmount, 0);

    const paymentType =
      newPaidAmount <= 0
        ? "credit"
        : newPaidAmount >= Number(purchase.total || 0)
        ? "cash"
        : "partial";

    purchase.paidAmount = newPaidAmount;
    purchase.dueAmount = newDueAmount;
    purchase.paymentType = paymentType;

    await purchase.save();

    await CashTransaction.create({
      type: "out",
      category: "supplier_payment",
      title: `Supplier payment to ${purchase.supplierName || "Supplier"}`,
      amount: Number(amount || 0),
      date: date || new Date().toISOString().slice(0, 10),
      note: note || "",
      refType: "purchase",
      refId: purchase._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "Supplier payment saved",
      data: purchase,
    });
  } catch (error) {
    console.error("SUPPLIER_PAYMENT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save supplier payment" },
      { status: 500 }
    );
  }
}