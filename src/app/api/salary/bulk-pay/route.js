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
    const {
      employeeIds = [],
      month,
      paymentMethod,
      bankId,
      overtimeAmount = 0,
      bonusAmount = 0,
      absentDeduction = 0,
      advanceDeduction = 0,
      loanDeduction = 0,
      note = "",
    } = body;

    if (!employeeIds.length) {
      return NextResponse.json(
        { success: false, message: "Employee required" },
        { status: 400 }
      );
    }

    const salaryMonth = month || new Date().toISOString().slice(0, 7);
    const employees = await Employee.find({ _id: { $in: employeeIds } });

    let bank = null;
    if (paymentMethod === "bank") {
      bank = await BankAccount.findById(bankId);
      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account required" },
          { status: 400 }
        );
      }
    }

    const paidList = [];
    let totalPaid = 0;

    for (const employee of employees) {
      const alreadyPaid = await SalaryPayment.findOne({
        employeeId: employee._id,
        month: salaryMonth,
      });

      if (alreadyPaid) continue;

      const basicSalary = Number(employee.basicSalary || 0);
      const finalSalary =
        basicSalary +
        Number(overtimeAmount || 0) +
        Number(bonusAmount || 0) -
        Number(absentDeduction || 0) -
        Number(loanDeduction || 0) -
        Number(advanceDeduction || 0);

      const paidAmount = Math.max(finalSalary, 0);

      if (paymentMethod === "bank" && Number(bank.currentBalance || 0) < paidAmount) {
        return NextResponse.json(
          { success: false, message: `Not enough bank balance for ${employee.name}` },
          { status: 400 }
        );
      }

      const salary = await SalaryPayment.create({
        employeeId: employee._id,
        employeeName: employee.name,
        month: salaryMonth,
        basicSalary,
        overtimeAmount: Number(overtimeAmount || 0),
        bonusAmount: Number(bonusAmount || 0),
        absentDeduction: Number(absentDeduction || 0),
        advanceDeduction: Number(advanceDeduction || 0),
        loanDeduction: Number(loanDeduction || 0),
        finalSalary,
        paidAmount,
        dueAmount: 0,
        paymentMethod,
        bankId: paymentMethod === "bank" ? bankId : "",
        date: new Date().toISOString().slice(0, 10),
        note,
      });

      if (Number(advanceDeduction || 0) > 0) {
        const openAdvances = await AdvanceSalary.find({
          employeeId: employee._id,
          status: "open",
        }).sort({ createdAt: 1 });

        let remaining = Number(advanceDeduction || 0);

        for (const adv of openAdvances) {
          if (remaining <= 0) break;

          const adjust = Math.min(Number(adv.remainingAmount || 0), remaining);

          adv.adjustedAmount = Number(adv.adjustedAmount || 0) + adjust;
          adv.remainingAmount = Number(adv.remainingAmount || 0) - adjust;

          if (adv.remainingAmount <= 0) adv.status = "adjusted";

          remaining -= adjust;
          await adv.save();
        }
      }

      if (paymentMethod === "cash" && paidAmount > 0) {
        await CashTransaction.create({
          type: "out",
          category: "salary_payment",
          title: `Cash salary paid to ${employee.name} - ${salaryMonth}`,
          amount: paidAmount,
          date: salary.date,
          note,
          refType: "salary",
          refId: salary._id.toString(),
        });
      }

      if (paymentMethod === "bank" && paidAmount > 0) {
        bank.currentBalance = Number(bank.currentBalance || 0) - paidAmount;
        await bank.save();

        await BankTransaction.create({
          bankId: bank._id,
          type: "out",
          category: "salary_payment",
          title: `Bank salary paid to ${employee.name} - ${salaryMonth}`,
          amount: paidAmount,
          date: salary.date,
          note,
          refType: "salary",
          refId: salary._id.toString(),
        });
      }

      totalPaid += paidAmount;
      paidList.push(salary);
    }

    return NextResponse.json({
      success: true,
      message: "Salary sheet paid successfully",
      data: {
        totalPaid,
        paidCount: paidList.length,
        paidList,
      },
    });
  } catch (error) {
    console.error("BULK_SALARY_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Salary sheet failed" },
      { status: 500 }
    );
  }
}