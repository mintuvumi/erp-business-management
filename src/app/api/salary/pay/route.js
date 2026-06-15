import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function checkSubscription(req) {
  const tenant = getTenant(req);

  if (!tenant.companyId) {
    return {
      ok: false,
      tenant,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const sub = await requireActiveSubscription(tenant);

  if (!sub.ok) {
    return {
      ok: false,
      tenant,
      response: NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
      ),
    };
  }

  return { ok: true, tenant };
}

export async function POST(req) {
  try {
    await connectDB();

    const access = await checkSubscription(req);
    if (!access.ok) return access.response;

    const tenant = access.tenant;
    const body = await req.json();

    const employee = await Employee.findOne({
      _id: body.employeeId,
      companyId: tenant.companyId,
      status: "active",
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const month = body.month || new Date().toISOString().slice(0, 7);

    const alreadyPaid = await SalaryPayment.findOne({
      companyId: tenant.companyId,
      employeeId: employee._id,
      month,
      paymentStatus: "paid",
    });

    if (alreadyPaid) {
      return NextResponse.json(
        { success: false, message: "Salary already paid for this month" },
        { status: 400 }
      );
    }

    const basicSalary = Number(body.basicSalary || employee.basicSalary || 0);
    const overtimeAmount = Number(body.overtimeAmount || 0);
    const bonusAmount = Number(body.bonusAmount || 0);
    const absentDeduction = Number(body.absentDeduction || 0);
    const loanDeduction = Number(body.loanDeduction || 0);

    const openAdvances = await AdvanceSalary.find({
      companyId: tenant.companyId,
      employeeId: employee._id,
      status: "open",
    }).sort({ createdAt: 1 });

    let requestedAdvanceDeduction = Number(body.advanceDeduction || 0);

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
    const date = body.date || today();

    const salary = await SalaryPayment.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",

      employeeId: employee._id,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || "",

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
      paymentStatus: "paid",
      approvalStatus: "approved",

      bankId: paymentMethod === "bank" ? body.bankId || null : null,

      date,
      note: body.note || "",
    });

    if (paidAmount > 0 && paymentMethod === "cash") {
      await CashTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        type: "out",
        category: "salary_payment",
        title: `Salary paid to ${employee.name} - ${month}`,
        amount: paidAmount,
        date,
        note: body.note || "",
        refType: "salary",
        refId: salary._id.toString(),
        status: "active",
      });
    }

    if (paidAmount > 0 && paymentMethod === "bank") {
      const bank = await BankAccount.findOne({
        _id: body.bankId,
        companyId: tenant.companyId,
        status: { $ne: "inactive" },
      });

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

      const balanceBefore = Number(bank.currentBalance || 0);
      const balanceAfter = balanceBefore - paidAmount;

      bank.currentBalance = balanceAfter;
      await bank.save();

      await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        bankId: bank._id,
        type: "out",
        category: "salary_payment",
        title: `Salary paid to ${employee.name} - ${month}`,
        amount: paidAmount,
        date,
        note: body.note || "",
        refType: "salary",
        refId: salary._id.toString(),
        balanceBefore,
        balanceAfter,
        status: "active",
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