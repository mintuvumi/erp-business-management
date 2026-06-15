import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import EmployeeLoan from "@/models/EmployeeLoan";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import AccountTransaction from "@/models/AccountTransaction";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

function makeTransactionNo(prefix = "LOAN") {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${prefix}-${y}${m}${d}-${r}`;
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const sub = await requireActiveSubscription(tenant);

if (!sub.ok) {
  return NextResponse.json(
    {
      success: false,
      subscriptionExpired: true,
      message: sub.message,
    },
    { status: sub.status }
  );
}

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();
    const status = String(searchParams.get("status") || "open").trim();

    const employeeFilter = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (q) {
      employeeFilter.$or = [
        { employeeCode: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
      ];
    }

    const employees = await Employee.find(employeeFilter)
      .sort({ name: 1 })
      .limit(q ? 20 : 100);

    const loanFilter = {
      companyId: tenant.companyId,
    };

    if (status !== "all") {
      loanFilter.status = status;
    }

    if (q) {
      loanFilter.$or = [
        { loanNo: { $regex: q, $options: "i" } },
        { employeeName: { $regex: q, $options: "i" } },
        { employeeCode: { $regex: q, $options: "i" } },
        { reason: { $regex: q, $options: "i" } },
      ];
    }

    const loans = await EmployeeLoan.find(loanFilter).sort({
      createdAt: -1,
    });

    const summary = {
      totalLoan: loans.reduce((sum, l) => sum + Number(l.loanAmount || 0), 0),
      paidAmount: loans.reduce((sum, l) => sum + Number(l.paidAmount || 0), 0),
      remainingAmount: loans.reduce(
        (sum, l) => sum + Number(l.remainingAmount || 0),
        0
      ),
      openLoan: loans.filter((l) => l.status === "open").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        employees,
        loans,
        summary,
      },
    });
  } catch (error) {
    console.error("EMPLOYEE_LOAN_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load employee loans",
      },
      { status: 500 }
    );
  }
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

    const sub = await requireActiveSubscription(tenant);

if (!sub.ok) {
  return NextResponse.json(
    {
      success: false,
      subscriptionExpired: true,
      message: sub.message,
    },
    { status: sub.status }
  );
}

    const body = await req.json();

    const employeeId = body.employeeId;
    const loanAmount = Number(body.loanAmount || 0);
    const monthlyInstallment = Number(body.monthlyInstallment || 0);
    const paymentMethod = body.paymentMethod || "cash";
    const bankId = body.bankId || null;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee required" },
        { status: 400 }
      );
    }

    if (!loanAmount || loanAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid loan amount required" },
        { status: 400 }
      );
    }

    if (!["cash", "bank", "mobile_banking"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Valid payment method required" },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId: tenant.companyId,
      status: "active",
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const transactionNo = makeTransactionNo("EMP-LOAN");
    const issueDate = body.issueDate || new Date().toISOString().slice(0, 10);

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

      if (Number(bank.currentBalance || 0) < loanAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough bank balance. Required ৳ ${loanAmount.toFixed(
              2
            )}`,
          },
          { status: 400 }
        );
      }

      bank.currentBalance = Number(bank.currentBalance || 0) - loanAmount;
      await bank.save();

      await BankTransaction.create({
        companyId: tenant.companyId,
        bankId: bank._id,
        type: "out",
        category: "salary_payment",
        title: `Employee loan paid to ${employee.name}`,
        amount: loanAmount,
        date: issueDate,
        note: body.note || body.reason || "",
        refType: "employee_loan",
        refId: transactionNo,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });
    }

    if (paymentMethod === "cash") {
      let cash = await Cash.findOne({
        companyId: tenant.companyId,
      });

      if (!cash) {
        cash = await Cash.create({
          companyId: tenant.companyId,
          currentBalance: 0,
          balance: 0,
        });
      }

      if (Number(cash.currentBalance || cash.balance || 0) < loanAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough cash balance. Required ৳ ${loanAmount.toFixed(
              2
            )}`,
          },
          { status: 400 }
        );
      }

      cash.currentBalance = Number(cash.currentBalance || cash.balance || 0) - loanAmount;
      cash.balance = cash.currentBalance;
      await cash.save();

      await CashTransaction.create({
        companyId: tenant.companyId,
        type: "out",
        category: "salary_payment",
        title: `Employee loan paid to ${employee.name}`,
        amount: loanAmount,
        date: issueDate,
        note: body.note || body.reason || "",
        refType: "employee_loan",
        refId: transactionNo,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });
    }

    const loan = await EmployeeLoan.create({
      companyId: tenant.companyId,
      employeeId: employee._id,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || "",

      loanNo: transactionNo,
      loanAmount,
      paidAmount: 0,
      remainingAmount: loanAmount,
      monthlyInstallment,

      issueDate,
      startMonth: body.startMonth || new Date().toISOString().slice(0, 7),

      paymentMethod,
      bankId: paymentMethod === "bank" ? bank?._id : null,

      reason: body.reason || "",
      note: body.note || "",

      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
      status: "open",
    });

    await AccountTransaction.create({
      companyId: tenant.companyId,
      transactionType: "employee_loan",
      categoryName: "Employee Loan",
      categoryType: "asset",
      title: `Employee loan issued to ${employee.name}`,
      amount: loanAmount,
      direction: "out",
      paymentFrom: paymentMethod,
      fromBankId: paymentMethod === "bank" ? bank?._id : null,
      receiveTo: "none",
      personType: "employee",
      personName: employee.name,
      employeeId: employee._id,
      referenceType: "employee_loan",
      referenceId: loan._id,
      paymentMethod,
      transactionDate: new Date(issueDate),
      note: body.note || body.reason || "",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Employee loan saved",
        data: loan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("EMPLOYEE_LOAN_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save employee loan",
      },
      { status: 500 }
    );
  }
}