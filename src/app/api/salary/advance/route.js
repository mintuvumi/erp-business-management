import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import AdvanceSalary from "@/models/AdvanceSalary";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const employee = await Employee.findById(body.employeeId);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const amount = Number(body.amount) || 0;

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount required" },
        { status: 400 }
      );
    }

    const paidBy = body.paidBy || employee.paymentMethod || "cash";

    const advance = await AdvanceSalary.create({
      employeeId: employee._id,
      employeeName: employee.name,
      amount,
      paidBy,
      bankId: body.bankId || "",
      date: body.date || new Date().toISOString().slice(0, 10),
      adjustedAmount: 0,
      remainingAmount: amount,
      status: "open",
      note: body.note || "",
    });

    if (paidBy === "cash") {
      await CashTransaction.create({
        type: "out",
        category: "salary_payment",
        title: `Advance salary paid to ${employee.name}`,
        amount,
        date: advance.date,
        note: body.note || "",
        refType: "advance_salary",
        refId: advance._id.toString(),
      });
    }

    if (paidBy === "bank") {
      const bank = await BankAccount.findById(body.bankId);

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (Number(bank.currentBalance || 0) < amount) {
        return NextResponse.json(
          { success: false, message: "Not enough bank balance" },
          { status: 400 }
        );
      }

      bank.currentBalance = Number(bank.currentBalance || 0) - amount;
      await bank.save();

      await BankTransaction.create({
        bankId: bank._id,
        type: "out",
        category: "salary_payment",
        title: `Advance salary paid to ${employee.name}`,
        amount,
        date: advance.date,
        note: body.note || "",
        refType: "advance_salary",
        refId: advance._id.toString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Advance salary paid",
      data: advance,
    });
  } catch (error) {
    console.error("ADVANCE_SALARY_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to pay advance" },
      { status: 500 }
    );
  }
}