import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import CashTransaction from "@/models/CashTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const qty = Number(body.qty) || 0;
    const price = Number(body.price) || 0;
    const paidAmount = Number(body.paidAmount) || 0;

    const total = qty * price;

    // 🔥 SMART DUE LOGIC (important fix)
    const dueAmount = Math.max(total - paidAmount, 0);

    // 🔥 PAYMENT TYPE AUTO
    const paymentType =
      paidAmount <= 0
        ? "credit"
        : paidAmount >= total
        ? "cash"
        : "partial";

    // 🔥 SAVE PURCHASE
    const purchase = await Purchase.create({
      ...body,
      qty,
      price,
      total,
      paidAmount,
      dueAmount,
      paymentType,
      date: body.date || new Date().toISOString().slice(0, 10),
    });

    // 🔥 STOCK UPDATE (ONLY IF STOCK PURCHASE)
    if (body.purchaseType === "stock") {
      let stock = await Stock.findOne({
        itemName: body.itemName,
      });

      if (!stock) {
        stock = await Stock.create({
          itemName: body.itemName,
          qty: qty,
          avgCost: price,
          totalValue: total,
        });
      } else {
        const newQty = stock.qty + qty;
        const newTotalValue = stock.totalValue + total;

        stock.qty = newQty;
        stock.totalValue = newTotalValue;
        stock.avgCost = newTotalValue / newQty;

        await stock.save();
      }
    }

    // 🔥 AUTO CASH OUT (MOST IMPORTANT)
    if (paidAmount > 0) {
      await CashTransaction.create({
        type: "out",
        category: "cash_purchase",
        title: `Purchase payment`,
        amount: paidAmount,
        date: body.date || new Date().toISOString().slice(0, 10),
        note: body.note || "",
        refType: "purchase",
        refId: purchase._id.toString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Purchase saved successfully",
        data: purchase,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PURCHASE_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save purchase",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const purchases = await Purchase.find().sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    console.error("PURCHASE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch purchases",
      },
      { status: 500 }
    );
  }
}