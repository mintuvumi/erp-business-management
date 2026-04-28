import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const supplier = searchParams.get("supplier") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const query = {};

    if (supplier) {
      query.supplierName = { $regex: supplier, $options: "i" };
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const purchases = await Purchase.find(query).sort({
      date: 1,
      createdAt: 1,
    });

    let balance = 0;

    const rows = purchases.map((purchase) => {
      const total = Number(purchase.total || 0);
      const paidAmount = Number(purchase.paidAmount || 0);
      const dueAmount = Number(purchase.dueAmount || 0);

      balance += dueAmount;

      return {
        _id: purchase._id,
        date: purchase.date,
        supplierName: purchase.supplierName || "Cash Supplier",
        itemName: purchase.itemName,
        purchaseType: purchase.purchaseType,
        paymentType: purchase.paymentType,
        total,
        paidAmount,
        dueAmount,
        balance,
        note: purchase.note || "",
      };
    });

    const summary = {
      totalPurchase: rows.reduce((s, r) => s + r.total, 0),
      paidTotal: rows.reduce((s, r) => s + r.paidAmount, 0),
      dueTotal: rows.reduce((s, r) => s + r.dueAmount, 0),
      closingBalance: balance,
    };

    return NextResponse.json({
      success: true,
      data: { rows, summary },
    });
  } catch (error) {
    console.error("SUPPLIER_LEDGER_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load supplier ledger" },
      { status: 500 }
    );
  }
}