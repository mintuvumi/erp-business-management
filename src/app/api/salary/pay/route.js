import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import SalaryPayment from "@/models/SalaryPayment";
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

    const month = body.month || new Date().toISOString().slice(0, 7);

    const alreadyPaid = await SalaryPayment.findOne({
      employeeId: employee._id,
      month,
    });

    if (alreadyPaid) {
      return NextResponse.json(
        { success: false, message: "Salary already paid for this month" },
        { status: 400 }
      );
    }

    const basicSalary = Number(body.basicSalary || employee.basicSalary || 0);
    const overtimeAmount = Number(body.overtimeAmount) || 0;
    const bonusAmount = Number(body.bonusAmount) || 0;
    const absentDeduction = Number(body.absentDeduction) || 0;
    const loanDeduction = Number(body.loanDeduction) || 0;

    const openAdvances = await AdvanceSalary.find({
      employeeId: employee._id,
      status: "open",
    }).sort({ createdAt: 1 });

    let requestedAdvanceDeduction = Number(body.advanceDeduction) || 0;

    const totalOpenAdvance = openAdvances.reduce(
      (sum, a) => sum + Number(a.remainingAmount || 0),
      0
    );

    if (requestedAdvanceDeduction > totalOpenAdvance) {
      requestedAdvanceDeduction = totalOpenAdvance;
    }

    const finalSalary =
      basicSalary +
      overtimeAmount +
      bonusAmount -
      absentDeduction -
      loanDeduction -
      requestedAdvanceDeduction;

    const paidAmount = Math.max(finalSalary, 0);
    const dueAmount = 0;

    let remainingToAdjust = requestedAdvanceDeduction;

    for (const advance of openAdvances) {
      if (remainingToAdjust <= 0) break;

      const adjust = Math.min(
        Number(advance.remainingAmount || 0),
        remainingToAdjust
      );

      advance.adjustedAmount = Number(advance.adjustedAmount || 0) + adjust;
      advance.remainingAmount = Number(advance.remainingAmount || 0) - adjust;

      if (advance.remainingAmount <= 0) {
        advance.status = "adjusted";
      }

      remainingToAdjust -= adjust;

      await advance.save();
    }

    const paymentMethod = body.paymentMethod || employee.paymentMethod || "cash";

    const salary = await SalaryPayment.create({
      employeeId: employee._id,
      employeeName: employee.name,
      month,
      basicSalary,
      overtimeAmount,
      bonusAmount,
      absentDeduction,
      advanceDeduction: requestedAdvanceDeduction,
      loanDeduction,
      finalSalary,
      paidAmount,
      dueAmount,
      paymentMethod,
      bankId: body.bankId || "",
      date: body.date || new Date().toISOString().slice(0, 10),
      note: body.note || "",
    });

    if (paidAmount > 0 && paymentMethod === "cash") {
      await CashTransaction.create({
        type: "out",
        category: "salary_payment",
        title: `Salary paid to ${employee.name} - ${month}`,
        amount: paidAmount,
        date: salary.date,
        note: body.note || "",
        refType: "salary",
        refId: salary._id.toString(),
      });
    }

    if (paidAmount > 0 && paymentMethod === "bank") {
      const bank = await BankAccount.findById(body.bankId);

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (Number(bank.currentBalance || 0) < paidAmount) {
        return NextResponse.json(
          { success: false, message: "Not enough bank balance" },
          { status: 400 }
        );
      }

      bank.currentBalance = Number(bank.currentBalance || 0) - paidAmount;
      await bank.save();

      await BankTransaction.create({
        bankId: bank._id,
        type: "out",
        category: "salary_payment",
        title: `Salary paid to ${employee.name} - ${month}`,
        amount: paidAmount,
        date: salary.date,
        note: body.note || "",
        refType: "salary",
        refId: salary._id.toString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Salary paid successfully",
      data: salary,
    });
  } catch (error) {
    console.error("SALARY_PAY_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to pay salary" },
      { status: 500 }
    );
  }
}