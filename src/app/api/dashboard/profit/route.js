import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
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

function calculateSaleProfit(sale) {
  const savedProfit = Number(sale.totalProfit || 0);
  if (savedProfit !== 0) return savedProfit;

  const netSalesAmount =
    Number(sale.netSalesAmount || 0) ||
    Number(sale.afterDiscount || 0) ||
    Number(sale.subTotal || 0);

  const totalCost =
    Number(sale.totalCost || 0) ||
    (sale.items || []).reduce(
      (sum, item) => sum + Number(item.costTotal || 0),
      0
    );

  return netSalesAmount - totalCost;
}

function getMonthName(date) {
  return date.toLocaleString("en-US", { month: "long" });
}

function isLastDayOfMonth(date) {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay.getDate() === 1;
}

function getDaysAfterMonthEnd(nowDate) {
  const now = new Date(nowDate);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startEnd = new Date(
    monthEnd.getFullYear(),
    monthEnd.getMonth(),
    monthEnd.getDate()
  );

  return Math.floor(
    (startNow.getTime() - startEnd.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getDaysAfterYearEnd(nowDate) {
  const now = new Date(nowDate);
  const yearEnd = new Date(now.getFullYear() - 1, 11, 31);

  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startEnd = new Date(
    yearEnd.getFullYear(),
    yearEnd.getMonth(),
    yearEnd.getDate()
  );

  return Math.floor(
    (startNow.getTime() - startEnd.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function buildProfitMessage({ netProfit, monthlyProfit, yearlyProfit, now }) {
  let profitCardTitle = "Total Profit";
  let profitCardValue = `৳ ${money(netProfit)}`;
  let celebrationType = "normal";
  let message = "";

  const daysAfterYearEnd = getDaysAfterYearEnd(new Date());
  const daysAfterMonthEnd = getDaysAfterMonthEnd(new Date());

  if (daysAfterYearEnd >= 1 && daysAfterYearEnd <= 7) {
    celebrationType = yearlyProfit >= 0 ? "yearly_profit" : "yearly_loss";
    profitCardTitle = yearlyProfit >= 0 ? "🎉 অভিনন্দন!" : "💙 সাহস রাখুন";

    profitCardValue =
      yearlyProfit >= 0
        ? `${now.getFullYear() - 1} সালে মোট লাভ হয়েছে ৳ ${money(
            yearlyProfit
          )}`
        : `${now.getFullYear() - 1} সালে লস হয়েছে ৳ ${money(
            Math.abs(yearlyProfit)
          )}`;

    message =
      yearlyProfit >= 0
        ? "চমৎকার কাজ করেছেন। নতুন বছরের জন্য আরও শক্ত পরিকল্পনা করুন—আপনার ব্যবসা আরও বড় হবে।"
        : "গত বছরে লস হলেও হতাশ হওয়ার কিছু নেই। খরচ নিয়ন্ত্রণ, স্টক পরিকল্পনা এবং বাকি আদায় নিয়মিত করলে সামনে ভালো ফল আসবে।";

    return { profitCardTitle, profitCardValue, celebrationType, message };
  }

  if (
    isLastDayOfMonth(new Date()) ||
    (daysAfterMonthEnd >= 1 && daysAfterMonthEnd <= 3)
  ) {
    const monthName = getMonthName(new Date());

    celebrationType = monthlyProfit >= 0 ? "monthly_profit" : "monthly_loss";
    profitCardTitle = monthlyProfit >= 0 ? "🎉 অভিনন্দন!" : "💙 সাহস রাখুন";

    profitCardValue =
      monthlyProfit >= 0
        ? `${monthName} মাসে লাভ হয়েছে ৳ ${money(monthlyProfit)}`
        : `${monthName} মাসে লস হয়েছে ৳ ${money(Math.abs(monthlyProfit))}`;

    message =
      monthlyProfit >= 0
        ? "এই মাসের সাফল্য ধরে রেখে পরের মাসে আরও ভালো করার পরিকল্পনা করুন। নিয়মিত হিসাব রাখলেই ব্যবসা আরও সুন্দরভাবে এগিয়ে যাবে।"
        : "এই মাসে লস হলেও এটা শেষ নয়। বিক্রি, খরচ, স্টক ও বাকি আদায় ভালোভাবে বিশ্লেষণ করলে সামনে ঘুরে দাঁড়ানো সম্ভব।";

    return { profitCardTitle, profitCardValue, celebrationType, message };
  }

  if (netProfit < 0) {
    celebrationType = "loss";
    profitCardTitle = "💙 সাহস রাখুন";
    profitCardValue = `বর্তমান লস ৳ ${money(Math.abs(netProfit))}`;
    message =
      "ব্যবসায় সাময়িক লস স্বাভাবিক। খরচ কমান, লাভজনক পণ্য চিহ্নিত করুন, বাকি আদায় বাড়ান—আপনি এগিয়ে যাবেন।";
  }

  return { profitCardTitle, profitCardValue, celebrationType, message };
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
    const dateFilter = searchParams.get("date") || "";

    const now = new Date();
    const today = new Date().toISOString().slice(0, 10);

    const [sales, cashTransactions, bankTransactions] = await Promise.all([
      Sale.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
      })
        .sort({ createdAt: -1 })
        .lean(),

      CashTransaction.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
      }).lean(),

      BankTransaction.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
      }).lean(),
    ]);

    const cashExpenses = cashTransactions.filter(
      (t) => t.type === "out" && EXPENSE_CATEGORIES.includes(t.category)
    );

    const bankExpenses = bankTransactions.filter(
      (t) => t.type === "out" && EXPENSE_CATEGORIES.includes(t.category)
    );

    const expenses = [
      ...cashExpenses.map((e) => ({
        source: "cash",
        date: e.date || e.createdAt,
        amount: Number(e.amount || 0),
        category: e.category,
        title: e.title,
        note: e.note || "",
      })),
      ...bankExpenses.map((e) => ({
        source: "bank",
        date: e.date || e.createdAt,
        amount: Number(e.amount || 0),
        category: e.category,
        title: e.title,
        note: e.note || "",
      })),
    ];

    const salesProfit = sales.reduce(
      (sum, sale) => sum + calculateSaleProfit(sale),
      0
    );

    const totalExpense = expenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    const netProfit = salesProfit - totalExpense;

    const todaySalesProfit = sales
      .filter((s) => isSameDate(s.date || s.createdAt, today))
      .reduce((sum, sale) => sum + calculateSaleProfit(sale), 0);

    const todayExpense = expenses
      .filter((e) => isSameDate(e.date || e.createdAt, today))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const todayProfit = todaySalesProfit - todayExpense;

    const monthlySalesProfit = sales
      .filter((s) => isSameMonth(s.date || s.createdAt, now))
      .reduce((sum, sale) => sum + calculateSaleProfit(sale), 0);

    const monthlyExpense = expenses
      .filter((e) => isSameMonth(e.date || e.createdAt, now))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const monthlyProfit = monthlySalesProfit - monthlyExpense;

    const yearlySalesProfit = sales
      .filter((s) => isSameYear(s.date || s.createdAt, now))
      .reduce((sum, sale) => sum + calculateSaleProfit(sale), 0);

    const yearlyExpense = expenses
      .filter((e) => isSameYear(e.date || e.createdAt, now))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const yearlyProfit = yearlySalesProfit - yearlyExpense;

    const productProfitMap = {};

    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const itemName =
          item.name || item.itemName || item.productName || "Unknown Item";

        if (!productProfitMap[itemName]) {
          productProfitMap[itemName] = {
            name: itemName,
            qty: 0,
            sales: 0,
            cost: 0,
            profit: 0,
            rawMaterialCost: 0,
            factoryCost: 0,
            productionCost: 0,
          };
        }

        productProfitMap[itemName].qty += Number(item.qty || item.quantity || 0);
        productProfitMap[itemName].sales += Number(item.total || item.amount || 0);
        productProfitMap[itemName].cost += Number(item.costTotal || 0);
        productProfitMap[itemName].profit += Number(item.profit || 0);
      });
    });

    let filteredSales = sales;

    if (dateFilter) {
      filteredSales = sales.filter(
        (s) => normalizeDate(s.date || s.createdAt) === dateFilter
      );
    }

    const productWiseProfit = Object.values(productProfitMap).sort(
      (a, b) => b.profit - a.profit
    );

    const card = buildProfitMessage({
      netProfit,
      monthlyProfit,
      yearlyProfit,
      now,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...card,

        netProfit,
        grossProfit: salesProfit,
        salesProfit,
        totalExpense,

        todayProfit,
        monthlyProfit,
        yearlyProfit,

        todaySalesProfit,
        todayExpense,

        monthlySalesProfit,
        monthlyExpense,

        yearlySalesProfit,
        yearlyExpense,

        productWiseProfit,
        sales: filteredSales,
        expenses,
      },
    });
  } catch (error) {
    console.error("PROFIT_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load profit data",
      },
      { status: 500 }
    );
  }
}