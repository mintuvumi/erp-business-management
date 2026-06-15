import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import AdvanceSalary from "@/models/AdvanceSalary";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import BankAccount from "@/models/BankAccount";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
import { requireActiveSubscription } from "@/lib/subscription";

function toNumber(value) {
  return Number(value || 0) || 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function checkAccess(tenant) {
  try {
    await requirePermission(tenant, "employees");
    return null;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Access denied" },
      { status: 403 }
    );
  }
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

    const denied = await checkAccess(tenant);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);

    const q = String(searchParams.get("q") || "").trim();
    const status = searchParams.get("status") || "";
    const employeeId = searchParams.get("employeeId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const outstandingOnly = searchParams.get("outstandingOnly") || "";

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;

    if (outstandingOnly === "true") {
      query.remainingAmount = { $gt: 0 };
      query.status = "open";
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    if (q) {
      query.$or = [
        { employeeName: { $regex: q, $options: "i" } },
        { employeeCode: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { voucherNo: { $regex: q, $options: "i" } },
        { receiptNo: { $regex: q, $options: "i" } },
        { note: { $regex: q, $options: "i" } },
      ];
    }

    const advances = await AdvanceSalary.find(query)
      .populate("employeeId", "name phone employeeCode designation department photo basicSalary")
      .populate("bankId", "bankName accountNo accountNumber")
      .sort({ date: -1, createdAt: -1 });

    const allAdvances = await AdvanceSalary.find({
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    });

    const employeesWithAdvance = new Set(
      allAdvances
        .filter((a) => toNumber(a.remainingAmount) > 0)
        .map((a) => String(a.employeeId))
    ).size;

    const summary = {
      totalAdvance: allAdvances.reduce((s, a) => s + toNumber(a.amount), 0),
      adjustedAdvance: allAdvances.reduce(
        (s, a) => s + toNumber(a.adjustedAmount),
        0
      ),
      outstandingAdvance: allAdvances.reduce(
        (s, a) => s + toNumber(a.remainingAmount),
        0
      ),
      employeesWithAdvance,
      todayAdvance: allAdvances
        .filter((a) => a.date === today())
        .reduce((s, a) => s + toNumber(a.amount), 0),
      thisMonthAdvance: allAdvances
        .filter((a) => String(a.date || "").slice(0, 7) === today().slice(0, 7))
        .reduce((s, a) => s + toNumber(a.amount), 0),
      totalRecords: advances.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        advances,
        summary,
      },
    });
  } catch (error) {
    console.error("ADVANCE_SALARY_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load advance salary",
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

    const denied = await checkAccess(tenant);
    if (denied) return denied;

    const body = await req.json();

    const employeeId = body.employeeId;
    const amount = toNumber(body.amount);
    const paymentTo = body.paymentTo || body.paidBy || "cash";
    const bankId = body.bankId || null;
    const date = body.date || today();

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid advance amount required" },
        { status: 400 }
      );
    }

    if (paymentTo === "bank" && !bankId) {
      return NextResponse.json(
        { success: false, message: "Bank account required" },
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

    let bank = null;
    let balanceBefore = 0;
    let balanceAfter = 0;

    if (paymentTo === "bank") {
      bank = await BankAccount.findOne({
        _id: bankId,
        companyId: tenant.companyId,
        status: { $ne: "inactive" },
      });

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      balanceBefore = toNumber(bank.currentBalance);

      if (balanceBefore < amount) {
        return NextResponse.json(
          { success: false, message: "Insufficient bank balance" },
          { status: 400 }
        );
      }

      balanceAfter = balanceBefore - amount;
      bank.currentBalance = balanceAfter;
      await bank.save();
    }

    const advance = await AdvanceSalary.create({
      companyId: tenant.companyId,

      employeeId: employee._id,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || "",
      phone: employee.phone || "",
      designation: employee.designation || "",
      department: employee.department || "",
      salaryAmount: toNumber(employee.basicSalary),

      amount,
      adjustedAmount: 0,
      remainingAmount: amount,

      paidBy: paymentTo,
      paymentTo,
      bankId: paymentTo === "bank" ? bankId : null,
      bankName: bank?.bankName || "",
      paymentMethod: body.paymentMethod || paymentTo,

      mobileBankingType: body.mobileBankingType || "",
      mobileBankingNo: body.mobileBankingNo || "",
      transactionNo: body.transactionNo || "",
      transactionId: body.transactionId || "",
      chequeNo: body.chequeNo || "",

      date,
      month: String(date).slice(0, 7),
      adjustmentMonth: body.adjustmentMonth || "",

      reason: body.reason || "",
      note: body.note || "",

      status: "open",

      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    let cashTxn = null;
    let bankTxn = null;

    if (paymentTo === "bank") {
      bankTxn = await BankTransaction.create({
        companyId: tenant.companyId,
        bankId,
        type: "out",
        category: "advance_salary",
        title: `Advance salary paid to ${employee.name}`,
        amount,
        balanceBefore,
        balanceAfter,

        paymentMethod: body.paymentMethod || "bank",
        chequeNo: body.chequeNo || "",
        transactionId: body.transactionId || body.transactionNo || "",

        personName: employee.name,
        personType: "employee",

        employeeId: employee._id,
        employeeName: employee.name,

        date,
        note: body.note || "",
        comment: body.reason || "",

        refType: "advance_salary",
        refId: advance._id.toString(),

        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });

      advance.bankTransactionId = bankTxn._id;
    } else {
      cashTxn = await CashTransaction.create({
        companyId: tenant.companyId,
        type: "out",
        category: "advance_salary",
        title: `Advance salary paid to ${employee.name}`,
        amount,

        date,
        note: body.note || "",
        comment: body.reason || "",

        employeeId: employee._id,
        employeeName: employee.name,

        paymentType:
          paymentTo === "mobile_banking" ? "Mobile Banking" : "Cash",
        paymentFrom: "cash",

        refType: "advance_salary",
        refId: advance._id.toString(),

        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });

      advance.cashTransactionId = cashTxn._id;
    }

    await advance.save();

    return NextResponse.json(
      {
        success: true,
        message: "Advance salary saved",
        data: advance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADVANCE_SALARY_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save advance salary",
      },
      { status: 500 }
    );
  }
}