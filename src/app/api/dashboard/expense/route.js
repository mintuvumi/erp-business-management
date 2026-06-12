import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

const EXPENSE_CATEGORIES = [
  "expense",
  "salary_payment",
  "refund_paid",
  "bank_charge",
  "marketing_officer_expense",
  "marketing_officer_salary",
  "marketing_officer_commission",
];

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function isSameDate(date, target) {
  return normalizeDate(date) === target;
}

function isSameMonth(dateString, now) {
  if (!dateString) return false;
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isSameYear(dateString, now) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date.getFullYear() === now.getFullYear();
}

function expenseDTO(e, source = "cash") {
  const bank = e.bankId || null;

  return {
    _id: String(e._id),
    source,
    sourceName: source === "bank" ? bank?.bankName || "Bank" : "Cash",
    bankId: source === "bank" ? bank?._id || bank || null : null,

    date: normalizeDate(e.date || e.createdAt),
    title: e.title || `${source === "bank" ? "Bank" : "Cash"} Expense`,
    category: e.category || "",
    head: e.head || e.category || "others",

    employeeId: e.employeeId || null,
    employeeName: e.employeeName || "",

    customerId: e.customerId || null,
    customerName: e.customerName || "",

    supplierId: e.supplierId || null,
    supplierName: e.supplierName || "",

    marketingOfficerId: e.marketingOfficerId || null,
    marketingOfficerName: e.marketingOfficerName || "",

    paymentType: source === "bank" ? e.paymentMethod || "Bank" : e.paymentType || "Cash",

    amount: Number(e.amount || 0),
    note: e.note || "",
    comment: e.comment || "",

    refType: e.refType || "",
    refId: e.refId || "",
    voucherNo: source === "bank" ? e.transactionNo || e.voucherNo || "" : e.voucherNo || "",

    createdAt: e.createdAt,
  };
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

    try {
  await requirePermission(tenant, "accounts");
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      message: error.message || "Access denied",
    },
    { status: 403 }
  );
}

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const dateFilter = searchParams.get("date") || "";
    const sourceFilter = searchParams.get("source") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const now = new Date();
    const today = new Date().toISOString().slice(0, 10);

    const baseQuery = {
      companyId: tenant.companyId,
      type: "out",
      category: { $in: EXPENSE_CATEGORIES },
      status: { $ne: "cancelled" },
    };

    if (fromDate || toDate) {
      baseQuery.date = {};
      if (fromDate) baseQuery.date.$gte = fromDate;
      if (toDate) baseQuery.date.$lte = toDate;
    }

    const [cashExpenses, bankExpenses] = await Promise.all([
      CashTransaction.find(baseQuery).sort({ createdAt: -1 }).lean(),

      BankTransaction.find(baseQuery)
        .populate("bankId")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const allExpenses = [
      ...cashExpenses.map((e) => expenseDTO(e, "cash")),
      ...bankExpenses.map((e) => expenseDTO(e, "bank")),
    ].sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime()
    );

    let rows = allExpenses;

    if (sourceFilter) {
      rows = rows.filter((r) => r.source === sourceFilter);
    }

    if (search) {
      const q = search.toLowerCase();

      rows = rows.filter(
        (r) =>
          String(r.title || "").toLowerCase().includes(q) ||
          String(r.category || "").toLowerCase().includes(q) ||
          String(r.note || "").toLowerCase().includes(q) ||
          String(r.comment || "").toLowerCase().includes(q) ||
          String(r.source || "").toLowerCase().includes(q) ||
          String(r.sourceName || "").toLowerCase().includes(q) ||
          String(r.head || "").toLowerCase().includes(q) ||
          String(r.employeeName || "").toLowerCase().includes(q) ||
          String(r.customerName || "").toLowerCase().includes(q) ||
          String(r.supplierName || "").toLowerCase().includes(q) ||
          String(r.marketingOfficerName || "").toLowerCase().includes(q) ||
          String(r.paymentType || "").toLowerCase().includes(q) ||
          String(r.refType || "").toLowerCase().includes(q) ||
          String(r.refId || "").toLowerCase().includes(q) ||
          String(r.voucherNo || "").toLowerCase().includes(q)
      );
    }

    if (dateFilter) {
      rows = rows.filter((r) => normalizeDate(r.date) === dateFilter);
    }

    const todayExpense = allExpenses
      .filter((e) => isSameDate(e.date, today))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const monthlyExpense = allExpenses
      .filter((e) => isSameMonth(e.date, now))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const yearlyExpense = allExpenses
      .filter((e) => isSameYear(e.date, now))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalExpense = allExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    const categoryMap = {};
    const sourceMap = {};

    allExpenses.forEach((e) => {
      const categoryKey = e.head || e.category || "others";

      if (!categoryMap[categoryKey]) {
        categoryMap[categoryKey] = {
          category: categoryKey,
          amount: 0,
          count: 0,
        };
      }

      categoryMap[categoryKey].amount += Number(e.amount || 0);
      categoryMap[categoryKey].count += 1;

      const sourceKey = e.sourceName || e.source || "Other";

      if (!sourceMap[sourceKey]) {
        sourceMap[sourceKey] = {
          source: sourceKey,
          amount: 0,
          count: 0,
        };
      }

      sourceMap[sourceKey].amount += Number(e.amount || 0);
      sourceMap[sourceKey].count += 1;
    });

    const categoryWise = Object.values(categoryMap).sort(
      (a, b) => b.amount - a.amount
    );

    const sourceWise = Object.values(sourceMap).sort(
      (a, b) => b.amount - a.amount
    );

    return NextResponse.json({
      success: true,
      data: {
        cardTitle: "Expense",
        cardValue: `৳ ${Number(totalExpense || 0).toFixed(2)}`,

        todayExpense,
        monthlyExpense,
        yearlyExpense,
        totalExpense,

        categoryWise,
        sourceWise,
        rows,
      },
    });
  } catch (error) {
    console.error("EXPENSE_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load expense data",
      },
      { status: 500 }
    );
  }
}