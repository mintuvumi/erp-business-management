import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import AccountTransaction from "@/models/AccountTransaction";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import { getTenant } from "@/lib/tenant";

function makeTransactionNo(prefix = "SAL") {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${prefix}-${y}${m}${d}-${r}`;
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

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

    if (!["cash", "bank"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Valid payment method required" },
        { status: 400 }
      );
    }

    const salaryMonth = month || new Date().toISOString().slice(0, 7);
    const paymentDate = new Date().toISOString().slice(0, 10);

    const employees = await Employee.find({
      _id: { $in: employeeIds },
      companyId: tenant.companyId,
      status: "active",
    });

    if (!employees.length) {
      return NextResponse.json(
        { success: false, message: "No active employee found" },
        { status: 404 }
      );
    }

    let bank = null;

    if (paymentMethod === "bank") {
      bank = await BankAccount.findOne({
        _id: bankId,
        companyId: tenant.companyId,
      });

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account required" },
          { status: 400 }
        );
      }
    }

    let totalRequired = 0;
    const salaryRows = [];

    for (const employee of employees) {
      const alreadyPaid = await SalaryPayment.findOne({
        companyId: tenant.companyId,
        employeeId: employee._id,
        month: salaryMonth,
        status: "active",
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

      if (paidAmount <= 0) continue;

      totalRequired += paidAmount;

      salaryRows.push({
        employee,
        basicSalary,
        finalSalary,
        paidAmount,
      });
    }

    if (!salaryRows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No payable salary found or salary already paid",
        },
        { status: 400 }
      );
    }

    if (
      paymentMethod === "bank" &&
      Number(bank.currentBalance || 0) < totalRequired
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Not enough bank balance. Required ৳ ${totalRequired.toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    let cash = null;

    if (paymentMethod === "cash") {
      cash = await Cash.findOne({ companyId: tenant.companyId });

      if (!cash) {
        cash = await Cash.create({
          companyId: tenant.companyId,
          currentBalance: 0,
          balance: 0,
        });
      }

      if (Number(cash.currentBalance || cash.balance || 0) < totalRequired) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough cash balance. Required ৳ ${totalRequired.toFixed(
              2
            )}`,
          },
          { status: 400 }
        );
      }
    }

    const batchNo = makeTransactionNo("SALARY");
    const paidList = [];
    let totalPaid = 0;

    for (const row of salaryRows) {
      const { employee, basicSalary, finalSalary, paidAmount } = row;

      const salary = await SalaryPayment.create({
        companyId: tenant.companyId,

        employeeId: employee._id,
        employeeName: employee.name,
        employeeCode: employee.employeeCode || "",

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
        paymentStatus: "paid",
        approvalStatus: "paid",

        bankId: paymentMethod === "bank" ? bank._id : null,

        transactionNo: batchNo,
        date: paymentDate,

        note,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });

      if (Number(advanceDeduction || 0) > 0) {
        const openAdvances = await AdvanceSalary.find({
          companyId: tenant.companyId,
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

      if (paymentMethod === "cash") {
        cash.currentBalance =
          Number(cash.currentBalance || cash.balance || 0) - paidAmount;
        cash.balance = cash.currentBalance;
        await cash.save();

        await CashTransaction.create({
          companyId: tenant.companyId,
          type: "out",
          category: "salary_payment",
          title: `Salary paid to ${employee.name} - ${salaryMonth}`,
          amount: paidAmount,
          date: paymentDate,
          note,
          refType: "salary",
          refId: salary._id.toString(),
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });
      }

      if (paymentMethod === "bank") {
        bank.currentBalance = Number(bank.currentBalance || 0) - paidAmount;
        await bank.save();

        await BankTransaction.create({
          companyId: tenant.companyId,
          bankId: bank._id,
          type: "out",
          category: "salary_payment",
          title: `Salary paid to ${employee.name} - ${salaryMonth}`,
          amount: paidAmount,
          date: paymentDate,
          note,
          refType: "salary",
          refId: salary._id.toString(),
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });
      }

      await AccountTransaction.create({
        companyId: tenant.companyId,
        transactionType: "salary_payment",
        categoryName: "Salary Expense",
        categoryType: "expense",
        title: `Salary paid to ${employee.name} - ${salaryMonth}`,
        amount: paidAmount,
        direction: "out",
        paymentFrom: paymentMethod,
        fromBankId: paymentMethod === "bank" ? bank._id : null,
        receiveTo: "none",
        personType: "employee",
        personName: employee.name,
        employeeId: employee._id,
        referenceType: "salary",
        referenceId: salary._id,
        paymentMethod,
        transactionDate: new Date(),
        note,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });

      const officer = await MarketingOfficer.findOne({
        companyId: tenant.companyId,
        name: { $regex: `^${employee.name}$`, $options: "i" },
      });

      if (officer) {
        await MarketingOfficerLedger.create({
          companyId: tenant.companyId,
          marketingOfficerId: officer._id,
          marketingOfficerName: officer.name,
          date: paymentDate,
          type: "salary",
          referenceType: "salary",
          referenceId: salary._id,
          salaryAmount: paidAmount,
          note: `Salary paid for ${salaryMonth}`,
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });
      }

      totalPaid += paidAmount;
      paidList.push(salary);
    }

    return NextResponse.json({
      success: true,
      message: "Salary sheet paid successfully",
      data: {
        batchNo,
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