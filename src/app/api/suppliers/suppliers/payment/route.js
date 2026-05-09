import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import CashTransaction from "@/models/CashTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { purchaseId, amount, date, note } = body;

    const paymentAmount = Number(amount || 0);

    if (!purchaseId) {
      return NextResponse.json(
        { success: false, message: "Purchase id is required" },
        { status: 400 }
      );
    }

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid payment amount required" },
        { status: 400 }
      );
    }

    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return NextResponse.json(
        { success: false, message: "Purchase not found" },
        { status: 404 }
      );
    }

    if (purchase.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "Cancelled purchase cannot be paid" },
        { status: 400 }
      );
    }

    const grandTotal = Number(purchase.grandTotal || purchase.total || 0);
    const oldPaidAmount = Number(purchase.paidAmount || 0);
    const oldDueAmount = Math.max(grandTotal - oldPaidAmount, 0);

    if (paymentAmount > oldDueAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment cannot be greater than due amount ৳ ${oldDueAmount.toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    const newPaidAmount = oldPaidAmount + paymentAmount;
    const newDueAmount = Math.max(grandTotal - newPaidAmount, 0);

    const paymentType =
      newPaidAmount <= 0
        ? "credit"
        : newPaidAmount >= grandTotal
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
      amount: paymentAmount,
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
      {
        success: false,
        message: error.message || "Failed to save supplier payment",
      },
      { status: 500 }
    );
  }
}