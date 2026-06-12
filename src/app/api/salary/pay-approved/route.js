import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SalaryPayment from "@/models/SalaryPayment";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import AccountTransaction from "@/models/AccountTransaction";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import { getTenant } from "@/lib/tenant";

function makeBatchNo(prefix = "APP-SAL") {
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
      salaryIds = [],
      paymentMethod,
      bankId,
      note = "",
    } = body;

    if (!salaryIds.length) {
      return NextResponse.json(
        { success: false, message: "Salary records required" },
        { status: 400 }
      );
    }

    if (!["cash", "bank"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Valid payment method required" },
        { status: 400 }
      );
    }

    const salaries = await SalaryPayment.find({
      _id: { $in: salaryIds },
      companyId: tenant.companyId,
      status: "active",
      approvalStatus: "approved",
      paymentStatus: "due",
    });

    if (!salaries.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No approved unpaid salary found",
        },
        { status: 400 }
      );
    }

    const totalPayable = salaries.reduce(
      (sum, s) => sum + Number(s.dueAmount || s.finalSalary || 0),
      0
    );

    if (totalPayable <= 0) {
      return NextResponse.json(
        { success: false, message: "No payable amount found" },
        { status: 400 }
      );
    }

    let bank = null;

    if (paymentMethod === "bank") {
      if (!bankId) {
        return NextResponse.json(
          { success: false, message: "Bank account required" },
          { status: 400 }
        );
      }

      bank = await BankAccount.findOne({
        _id: bankId,
        companyId: tenant.companyId,
      });

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (Number(bank.currentBalance || 0) < totalPayable) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough bank balance. Required ৳ ${totalPayable.toFixed(
              2
            )}`,
          },
          { status: 400 }
        );
      }
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

      if (Number(cash.currentBalance || cash.balance || 0) < totalPayable) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough cash balance. Required ৳ ${totalPayable.toFixed(
              2
            )}`,
          },
          { status: 400 }
        );
      }
    }

    const batchNo = makeBatchNo("SALARY-PAY");
    const paymentDate = new Date().toISOString().slice(0, 10);

    const paidList = [];

    for (const salary of salaries) {
      const payable = Number(salary.dueAmount || salary.finalSalary || 0);

      if (payable <= 0) continue;

      if (paymentMethod === "cash") {
        cash.currentBalance =
          Number(cash.currentBalance || cash.balance || 0) - payable;
        cash.balance = cash.currentBalance;
        await cash.save();

        await CashTransaction.create({
          companyId: tenant.companyId,
          type: "out",
          category: "salary_payment",
          title: `Salary paid to ${salary.employeeName} - ${salary.month}`,
          amount: payable,
          date: paymentDate,
          note,
          refType: "salary",
          refId: salary._id.toString(),
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });
      }

      if (paymentMethod === "bank") {
        bank.currentBalance = Number(bank.currentBalance || 0) - payable;
        await bank.save();

        await BankTransaction.create({
          companyId: tenant.companyId,
          bankId: bank._id,
          type: "out",
          category: "salary_payment",
          title: `Salary paid to ${salary.employeeName} - ${salary.month}`,
          amount: payable,
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
        title: `Salary paid to ${salary.employeeName} - ${salary.month}`,
        amount: payable,
        direction: "out",
        paymentFrom: paymentMethod,
        fromBankId: paymentMethod === "bank" ? bank._id : null,
        receiveTo: "none",
        personType: "employee",
        personName: salary.employeeName,
        employeeId: salary.employeeId,
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
        name: { $regex: `^${salary.employeeName}$`, $options: "i" },
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
          salaryAmount: payable,
          note: `Salary paid for ${salary.month}`,
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });
      }

      salary.paidAmount = Number(salary.paidAmount || 0) + payable;
      salary.dueAmount = 0;
      salary.paymentMethod = paymentMethod;
      salary.paymentStatus = "paid";
      salary.approvalStatus = "paid";
      salary.bankId = paymentMethod === "bank" ? bank._id : null;
      salary.transactionNo = batchNo;
      salary.date = paymentDate;
      salary.note = note || salary.note || "";

      await salary.save();

      paidList.push(salary);
    }

    return NextResponse.json({
      success: true,
      message: "Approved salary paid successfully",
      data: {
        batchNo,
        paidCount: paidList.length,
        totalPaid: paidList.reduce(
          (sum, s) => sum + Number(s.paidAmount || 0),
          0
        ),
        paidList,
      },
    });
  } catch (error) {
    console.error("PAY_APPROVED_SALARY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Approved salary payment failed",
      },
      { status: 500 }
    );
  }
}