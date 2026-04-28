import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Loan from "@/models/Loan";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const amount = Number(body.amount) || 0;
    const paidAmount = Number(body.paidAmount) || 0;
    const dueAmount = Math.max(amount - paidAmount, 0);

    if (!body.lenderName || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Lender name and valid amount required" },
        { status: 400 }
      );
    }

    const loan = await Loan.create({
      loanType: body.loanType || "personal",
      lenderName: body.lenderName,
      amount,
      paidAmount,
      dueAmount,
      date: body.date || new Date().toISOString().slice(0, 10),
      note: body.note || "",
    });

    // loan received: cash/bank increase
    if (body.receiveTo === "cash") {
      await CashTransaction.create({
        type: "in",
        category: "other_income",
        title: `Loan received from ${body.lenderName}`,
        amount,
        date: loan.date,
        note: body.note || "",
        refType: "loan",
        refId: loan._id.toString(),
      });
    }

    if (body.receiveTo === "bank" && body.bankId) {
      const bank = await BankAccount.findById(body.bankId);

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      bank.currentBalance = Number(bank.currentBalance || 0) + amount;
      await bank.save();

      await BankTransaction.create({
        bankId: bank._id,
        type: "in",
        category: "bank_receive",
        title: `Loan received from ${body.lenderName}`,
        amount,
        date: loan.date,
        note: body.note || "",
        refType: "loan",
        refId: loan._id.toString(),
      });
    }

    return NextResponse.json(
      { success: true, message: "Loan saved", data: loan },
      { status: 201 }
    );
  } catch (error) {
    console.error("LOAN_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to save loan" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const loans = await Loan.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: loans,
    });
  } catch (error) {
    console.error("LOAN_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load loans" },
      { status: 500 }
    );
  }
}