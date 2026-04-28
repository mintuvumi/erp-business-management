import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CashTransaction from "@/models/CashTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.title || !body.amount || !body.type || !body.category) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, amount, type and category required",
        },
        { status: 400 }
      );
    }

    const transaction = await CashTransaction.create({
      ...body,
      amount: Number(body.amount) || 0,
      date: body.date || new Date().toISOString().slice(0, 10),

      // reference system
      refType: body.refType || "manual",
      refId: body.refId || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cash transaction saved",
        data: transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CASH_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save cash transaction" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
        { refType: { $regex: search, $options: "i" } },
      ];
    }

    if (date) {
      query.date = date;
    }

    const transactions = await CashTransaction.find(query).sort({
      createdAt: -1,
    });

    const allTransactions = await CashTransaction.find();

    const totalIn = allTransactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalOut = allTransactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const cashInHand = totalIn - totalOut;

    return NextResponse.json({
      success: true,
      data: {
        cashInHand,
        totalIn,
        totalOut,
        transactions,
      },
    });
  } catch (error) {
    console.error("CASH_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load cash data" },
      { status: 500 }
    );
  }
}