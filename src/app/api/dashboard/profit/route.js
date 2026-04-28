import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";

function isSameDate(date, target) {
  return date === target;
}

function isSameMonth(dateString, now) {
  const date = new Date(dateString);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isSameYear(dateString, now) {
  const date = new Date(dateString);
  return date.getFullYear() === now.getFullYear();
}

function getMonthName(date) {
  return date.toLocaleString("en-US", { month: "long" });
}

function isLastDayOfMonth(date) {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay.getDate() === 1;
}

function getDaysAfterMonthEnd(now) {
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diff = now.setHours(0, 0, 0, 0) - monthEnd.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDaysAfterYearEnd(now) {
  const yearEnd = new Date(now.getFullYear() - 1, 11, 31);
  const diff = now.setHours(0, 0, 0, 0) - yearEnd.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date") || "";

    const now = new Date();
    const today = new Date().toISOString().slice(0, 10);

    const sales = await Sale.find().sort({ createdAt: -1 });
    const cashTransactions = await CashTransaction.find();

    const expenses = cashTransactions.filter(
      (t) =>
        t.type === "out" &&
        ["expense", "salary_payment", "refund_paid"].includes(t.category)
    );

    const salesProfit = sales.reduce(
      (sum, s) => sum + Number(s.totalProfit || 0),
      0
    );

    const totalExpense = expenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    const netProfit = salesProfit - totalExpense;

    const todaySalesProfit = sales
      .filter((s) => isSameDate(s.date, today))
      .reduce((sum, s) => sum + Number(s.totalProfit || 0), 0);

    const todayExpense = expenses
      .filter((e) => isSameDate(e.date, today))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const todayProfit = todaySalesProfit - todayExpense;

    const monthlySalesProfit = sales
      .filter((s) => isSameMonth(s.date, now))
      .reduce((sum, s) => sum + Number(s.totalProfit || 0), 0);

    const monthlyExpense = expenses
      .filter((e) => isSameMonth(e.date, now))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const monthlyProfit = monthlySalesProfit - monthlyExpense;

    const yearlySalesProfit = sales
      .filter((s) => isSameYear(s.date, now))
      .reduce((sum, s) => sum + Number(s.totalProfit || 0), 0);

    const yearlyExpense = expenses
      .filter((e) => isSameYear(e.date, now))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const yearlyProfit = yearlySalesProfit - yearlyExpense;

    const productProfitMap = {};

    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        if (!productProfitMap[item.name]) {
          productProfitMap[item.name] = {
            name: item.name,
            qty: 0,
            sales: 0,
            cost: 0,
            profit: 0,
          };
        }

        productProfitMap[item.name].qty += Number(item.qty || 0);
        productProfitMap[item.name].sales += Number(item.total || 0);
        productProfitMap[item.name].cost += Number(item.costTotal || 0);
        productProfitMap[item.name].profit += Number(item.profit || 0);
      });
    });

    let filteredSales = sales;

    if (dateFilter) {
      filteredSales = sales.filter((s) => s.date === dateFilter);
    }

    const productWiseProfit = Object.values(productProfitMap).sort(
      (a, b) => b.profit - a.profit
    );

    let profitCardTitle = "Total Profit";
    let profitCardValue = `৳ ${Number(netProfit || 0).toFixed(2)}`;
    let celebrationType = "normal";
    let message = "";

    const daysAfterYearEnd = getDaysAfterYearEnd(new Date());
    const daysAfterMonthEnd = getDaysAfterMonthEnd(new Date());

    if (daysAfterYearEnd >= 1 && daysAfterYearEnd <= 7) {
      celebrationType = yearlyProfit >= 0 ? "yearly_profit" : "yearly_loss";
      profitCardTitle = yearlyProfit >= 0 ? "🎉 অভিনন্দন!" : "💙 সাহস রাখুন";
      profitCardValue =
        yearlyProfit >= 0
          ? `${now.getFullYear() - 1} সালে মোট লাভ হয়েছে ৳ ${Number(
              yearlyProfit
            ).toFixed(2)}`
          : `${now.getFullYear() - 1} সালে লস হয়েছে ৳ ${Math.abs(
              yearlyProfit
            ).toFixed(2)}`;
      message =
        yearlyProfit >= 0
          ? "চমৎকার কাজ করেছেন। এই ধারাবাহিকতা ধরে রাখুন।"
          : "ব্যবসায় ওঠানামা থাকে। খরচ নিয়ন্ত্রণ, স্টক পরিকল্পনা ও নিয়মিত ফলোআপ করলে সামনে ভালো ফল আসবে।";
    } else if (isLastDayOfMonth(new Date()) || (daysAfterMonthEnd >= 1 && daysAfterMonthEnd <= 3)) {
      const monthName = getMonthName(new Date());
      celebrationType = monthlyProfit >= 0 ? "monthly_profit" : "monthly_loss";
      profitCardTitle = monthlyProfit >= 0 ? "🎉 অভিনন্দন!" : "💙 সাহস রাখুন";
      profitCardValue =
        monthlyProfit >= 0
          ? `${monthName} মাসে লাভ হয়েছে ৳ ${Number(monthlyProfit).toFixed(2)}`
          : `${monthName} মাসে লস হয়েছে ৳ ${Math.abs(monthlyProfit).toFixed(2)}`;
      message =
        monthlyProfit >= 0
          ? "এই মাসের সাফল্য ধরে রেখে পরের মাসে আরও ভালো করার পরিকল্পনা করুন।"
          : "এই মাসে লস হলেও হতাশ হওয়ার কিছু নেই। বিক্রি, খরচ ও স্টক ভালোভাবে বিশ্লেষণ করলে সামনে ঘুরে দাঁড়ানো সম্ভব।";
    } else if (netProfit < 0) {
      celebrationType = "loss";
      profitCardTitle = "💙 সাহস রাখুন";
      profitCardValue = `বর্তমান লস ৳ ${Math.abs(netProfit).toFixed(2)}`;
      message =
        "ব্যবসায় সাময়িক লস স্বাভাবিক। খরচ কমান, লাভজনক পণ্য চিহ্নিত করুন, বাকি আদায় বাড়ান—আপনি এগিয়ে যাবেন।";
    }

    return NextResponse.json({
      success: true,
      data: {
        profitCardTitle,
        profitCardValue,
        celebrationType,
        message,

        netProfit,
        salesProfit,
        totalExpense,

        todayProfit,
        monthlyProfit,
        yearlyProfit,

        monthlySalesProfit,
        monthlyExpense,
        yearlySalesProfit,
        yearlyExpense,

        productWiseProfit,
        sales: filteredSales,
      },
    });
  } catch (error) {
    console.error("PROFIT_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load profit data" },
      { status: 500 }
    );
  }
}