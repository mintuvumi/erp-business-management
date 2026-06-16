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

function money(value) {
  return Number(value || 0).toFixed(2);
}

function includesText(value, q) {
  return String(value || "").toLowerCase().includes(q);
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

    paymentType:
      source === "bank" ? e.paymentMethod || "Bank" : e.paymentType || "Cash",

    amount: Number(e.amount || 0),
    note: e.note || "",
    comment: e.comment || "",

    refType: e.refType || "",
    refId: e.refId || "",
    voucherNo:
      source === "bank" ? e.transactionNo || e.voucherNo || "" : e.voucherNo || "",

    createdAt: e.createdAt,
  };
}

function filterRows(rows, { search, dateFilter, sourceFilter }) {
  let result = rows;

  if (sourceFilter) {
    result = result.filter((r) => r.source === sourceFilter);
  }

  if (dateFilter) {
    result = result.filter((r) => normalizeDate(r.date) === dateFilter);
  }

  if (search) {
    const q = search.toLowerCase();

    result = result.filter(
      (r) =>
        includesText(r.title, q) ||
        includesText(r.category, q) ||
        includesText(r.note, q) ||
        includesText(r.comment, q) ||
        includesText(r.source, q) ||
        includesText(r.sourceName, q) ||
        includesText(r.head, q) ||
        includesText(r.employeeName, q) ||
        includesText(r.customerName, q) ||
        includesText(r.supplierName, q) ||
        includesText(r.marketingOfficerName, q) ||
        includesText(r.paymentType, q) ||
        includesText(r.refType, q) ||
        includesText(r.refId, q) ||
        includesText(r.voucherNo, q)
    );
  }

  return result;
}

function buildAnalysis(rows) {
  const categoryMap = {};
  const sourceMap = {};

  rows.forEach((e) => {
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

  return {
    categoryWise: Object.values(categoryMap).sort((a, b) => b.amount - a.amount),
    sourceWise: Object.values(sourceMap).sort((a, b) => b.amount - a.amount),
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

    const search = String(searchParams.get("search") || "").trim();
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
        .populate("bankId", "bankName accountNo accountNumber")
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

    const rows = filterRows(allExpenses, {
      search,
      dateFilter,
      sourceFilter,
    });

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

    const filteredTotalExpense = rows.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    const { categoryWise, sourceWise } = buildAnalysis(rows);

    return NextResponse.json({
      success: true,
      data: {
        cardTitle: "Expense",
        cardValue: `৳ ${money(totalExpense)}`,

        todayExpense,
        monthlyExpense,
        yearlyExpense,
        totalExpense,

        filteredTotalExpense,

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