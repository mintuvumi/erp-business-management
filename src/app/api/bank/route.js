import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import CashTransaction from "@/models/CashTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (body.action === "create_bank") {
      const openingBalance = Number(body.openingBalance) || 0;

      const bank = await BankAccount.create({
        bankName: body.bankName,
        accountName: body.accountName || "",
        accountNo: body.accountNo || "",
        openingBalance,
        currentBalance: openingBalance,
        note: body.note || "",
      });

      return NextResponse.json({ success: true, data: bank }, { status: 201 });
    }

    if (body.action === "transaction") {
      const amount = Number(body.amount) || 0;

      const bank = await BankAccount.findById(body.bankId);

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (amount <= 0) {
        return NextResponse.json(
          { success: false, message: "Valid amount required" },
          { status: 400 }
        );
      }

      const type = body.type;

      if (type === "out" && bank.currentBalance < amount) {
        return NextResponse.json(
          { success: false, message: "Not enough bank balance" },
          { status: 400 }
        );
      }

      bank.currentBalance =
        type === "in"
          ? Number(bank.currentBalance) + amount
          : Number(bank.currentBalance) - amount;

      await bank.save();

      const transaction = await BankTransaction.create({
        bankId: bank._id,
        type,
        category: body.category,
        title: body.title,
        amount,
        date: body.date || new Date().toISOString().slice(0, 10),
        note: body.note || "",
        refType: body.refType || "manual",
        refId: body.refId || "",
      });

      if (body.category === "cash_deposit") {
        await CashTransaction.create({
          type: "out",
          category: "bank_deposit",
          title: `Cash deposit to ${bank.bankName}`,
          amount,
          date: body.date || new Date().toISOString().slice(0, 10),
          note: body.note || "",
          refType: "bank",
          refId: transaction._id.toString(),
        });
      }

      if (body.category === "cash_withdraw") {
        await CashTransaction.create({
          type: "in",
          category: "bank_withdraw",
          title: `Cash withdraw from ${bank.bankName}`,
          amount,
          date: body.date || new Date().toISOString().slice(0, 10),
          note: body.note || "",
          refType: "bank",
          refId: transaction._id.toString(),
        });
      }

      return NextResponse.json(
        { success: true, data: transaction },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("BANK_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Bank action failed" },
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

    const banks = await BankAccount.find().sort({ createdAt: -1 });

    const query = {};
    if (date) query.date = date;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await BankTransaction.find(query)
      .populate("bankId")
      .sort({ createdAt: -1 });

    const totalBankBalance = banks.reduce(
      (sum, b) => sum + Number(b.currentBalance || 0),
      0
    );

    const totalIn = transactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalOut = transactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalBankBalance,
        totalIn,
        totalOut,
        banks,
        transactions,
      },
    });
  } catch (error) {
    console.error("BANK_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load bank data" },
      { status: 500 }
    );
  }
}