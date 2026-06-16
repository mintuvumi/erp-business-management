import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import CompanySetting from "@/models/CompanySetting";
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

function money(value) {
  return Number(value || 0).toFixed(2);
}

function n(value) {
  return Number(value || 0) || 0;
}

function inText(value, keyword) {
  return String(value || "").toLowerCase().includes(keyword);
}

function isSameMonth(dateString, now) {
  if (!dateString) return false;
  const d = new Date(dateString);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isSameYear(dateString, now) {
  if (!dateString) return false;
  const d = new Date(dateString);
  return d.getFullYear() === now.getFullYear();
}

function calculateSaleAmount(sale) {
  return (
    n(sale.netSalesAmount) ||
    n(sale.afterDiscount) ||
    n(sale.salesAmount) ||
    n(sale.subTotal)
  );
}

function calculateSaleCost(sale) {
  const savedCost = n(sale.totalCost);

  if (savedCost > 0) {
    return savedCost;
  }

  return (sale.items || []).reduce((sum, item) => {
    const qty = n(item.qty || item.quantity);

    const itemCost =
      n(item.costTotal) > 0
        ? n(item.costTotal)
        : qty * n(item.avgCostUsed || item.purchasePrice || item.purchasePriceAtSale);

    return sum + itemCost;
  }, 0);
}

function calculateSaleProfit(sale) {
  return calculateSaleAmount(sale) - calculateSaleCost(sale);
}

function buildProfitMessage({ netProfit }) {
  if (netProfit < 0) {
    return {
      profitCardTitle: "💙 সাহস রাখুন",
      profitCardValue: `বর্তমান লস ৳ ${money(Math.abs(netProfit))}`,
      celebrationType: "loss",
      message:
        "ব্যবসায় সাময়িক লস স্বাভাবিক। খরচ কমান, লাভজনক পণ্য চিহ্নিত করুন, বাকি আদায় বাড়ান।",
    };
  }

  return {
    profitCardTitle: "Total Profit",
    profitCardValue: `৳ ${money(netProfit)}`,
    celebrationType: "normal",
    message:
      "Profit positive আছে। Regular sales, expense এবং stock profit analysis করলে business decision আরও ভালো হবে।",
  };
}

function getSaleItemName(item) {
  return item.name || item.itemName || item.productName || "Unknown Item";
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      await requirePermission(tenant, "accounts");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date") || "";
    const search = String(searchParams.get("search") || "").trim().toLowerCase();

    const now = new Date();
    const today = new Date().toISOString().slice(0, 10);

    const [settings, sales, cashTransactions, bankTransactions] =
      await Promise.all([
        CompanySetting.findOne({ companyId: tenant.companyId }).lean(),

        Sale.find({
          companyId: tenant.companyId,
          status: { $ne: "cancelled" },
        })
          .sort({ date: -1, createdAt: -1 })
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

    const expenses = [
      ...cashTransactions
        .filter((t) => t.type === "out" && EXPENSE_CATEGORIES.includes(t.category))
        .map((e) => ({
          source: "cash",
          date: e.date || e.createdAt,
          amount: n(e.amount),
          category: e.category,
          title: e.title,
          personName: e.employeeName || e.supplierName || e.customerName || "",
          note: e.note || e.comment || "",
        })),

      ...bankTransactions
        .filter((t) => t.type === "out" && EXPENSE_CATEGORIES.includes(t.category))
        .map((e) => ({
          source: "bank",
          date: e.date || e.createdAt,
          amount: n(e.amount),
          category: e.category,
          title: e.title,
          personName:
            e.personName || e.employeeName || e.supplierName || e.customerName || "",
          note: e.note || e.comment || "",
        })),
    ];

    let reportSales = sales;
    let reportExpenses = expenses;

    if (dateFilter) {
      reportSales = reportSales.filter(
        (s) => normalizeDate(s.date || s.createdAt) === dateFilter
      );

      reportExpenses = reportExpenses.filter(
        (e) => normalizeDate(e.date || e.createdAt) === dateFilter
      );
    }

    if (search) {
      reportSales = reportSales.filter((s) => {
        const itemsText = (s.items || []).map(getSaleItemName).join(" ");

        return (
          inText(s.billNo, search) ||
          inText(s.invoiceNo, search) ||
          inText(s.manualBillNo, search) ||
          inText(s.customerName, search) ||
          inText(s.customerPhone, search) ||
          inText(s.marketingOfficerName, search) ||
          inText(itemsText, search)
        );
      });

      reportExpenses = reportExpenses.filter(
        (e) =>
          inText(e.title, search) ||
          inText(e.category, search) ||
          inText(e.personName, search) ||
          inText(e.note, search)
      );
    }

    const calcSummary = (saleList, expenseList) => {
      const grossSales = saleList.reduce(
        (sum, sale) => sum + calculateSaleAmount(sale),
        0
      );

      const totalCost = saleList.reduce(
        (sum, sale) => sum + calculateSaleCost(sale),
        0
      );

      const salesProfit = saleList.reduce(
        (sum, sale) => sum + calculateSaleProfit(sale),
        0
      );

      const totalExpense = expenseList.reduce(
        (sum, e) => sum + n(e.amount),
        0
      );

      return {
        grossSales,
        totalCost,
        salesProfit,
        totalExpense,
        netProfit: salesProfit - totalExpense,
      };
    };

    const allSummary = calcSummary(sales, expenses);
    const reportSummary = calcSummary(reportSales, reportExpenses);

    const todaySummary = calcSummary(
      sales.filter((s) => normalizeDate(s.date || s.createdAt) === today),
      expenses.filter((e) => normalizeDate(e.date || e.createdAt) === today)
    );

    const monthlySummary = calcSummary(
      sales.filter((s) => isSameMonth(s.date || s.createdAt, now)),
      expenses.filter((e) => isSameMonth(e.date || e.createdAt, now))
    );

    const yearlySummary = calcSummary(
      sales.filter((s) => isSameYear(s.date || s.createdAt, now)),
      expenses.filter((e) => isSameYear(e.date || e.createdAt, now))
    );

    const productProfitMap = {};

    reportSales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const name = getSaleItemName(item);
        const qty = n(item.qty || item.quantity);
        const salesAmount =
          n(item.total || item.amount) || qty * n(item.price || item.rate);

        const costAmount =
          n(item.costTotal) > 0
            ? n(item.costTotal)
            : qty * n(item.avgCostUsed || item.purchasePrice || item.purchasePriceAtSale);

        const profit = salesAmount - costAmount;

        if (!productProfitMap[name]) {
          productProfitMap[name] = {
            name,
            qty: 0,
            sales: 0,
            cost: 0,
            profit: 0,
          };
        }

        productProfitMap[name].qty += qty;
        productProfitMap[name].sales += salesAmount;
        productProfitMap[name].cost += costAmount;
        productProfitMap[name].profit += profit;
      });
    });

    const productWiseProfit = Object.values(productProfitMap).sort(
      (a, b) => b.profit - a.profit
    );

    const topProfitProducts = productWiseProfit
      .filter((p) => p.profit > 0)
      .slice(0, 10);

    const topLossProducts = productWiseProfit
      .filter((p) => p.profit < 0)
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 10);

    const expenseCategoryMap = {};

    reportExpenses.forEach((e) => {
      const key = e.category || "others";
      expenseCategoryMap[key] = (expenseCategoryMap[key] || 0) + n(e.amount);
    });

    const expenseCategoryAnalysis = Object.entries(expenseCategoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const card = buildProfitMessage({
      netProfit: allSummary.netProfit,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...card,

        companyName: settings?.companyName || "Company Name",
        companyAddress: settings?.companyAddress || "Company Address",
        companyPhone: settings?.companyPhone || "Phone Number",

        grossSales: reportSummary.grossSales,
        totalCost: reportSummary.totalCost,
        grossProfit: reportSummary.salesProfit,
        salesProfit: reportSummary.salesProfit,
        totalExpense: reportSummary.totalExpense,
        netProfit: reportSummary.netProfit,
        netLoss: reportSummary.netProfit < 0 ? Math.abs(reportSummary.netProfit) : 0,
        profitMargin:
          reportSummary.grossSales > 0
            ? (reportSummary.netProfit / reportSummary.grossSales) * 100
            : 0,

        todayProfit: todaySummary.netProfit,
        monthlyProfit: monthlySummary.netProfit,
        yearlyProfit: yearlySummary.netProfit,

        todaySalesProfit: todaySummary.salesProfit,
        todayExpense: todaySummary.totalExpense,

        monthlySalesProfit: monthlySummary.salesProfit,
        monthlyExpense: monthlySummary.totalExpense,

        yearlySalesProfit: yearlySummary.salesProfit,
        yearlyExpense: yearlySummary.totalExpense,

        productWiseProfit,
        topProfitProducts,
        topLossProducts,
        expenseCategoryAnalysis,

        debug: {
          grossSales: allSummary.grossSales,
          totalCost: allSummary.totalCost,
          totalExpense: allSummary.totalExpense,
          netProfit: allSummary.netProfit,
        },

        sales: reportSales,
        expenses: reportExpenses,
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