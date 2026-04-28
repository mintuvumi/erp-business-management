import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";

const EXPENSE_CATEGORIES = ["expense", "salary_payment", "refund_paid"];

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

function isLastDayOfMonth(date) {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay.getDate() === 1;
}

function getDaysAfterMonthEnd(now) {
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  monthEnd.setHours(0, 0, 0, 0);

  return Math.floor((today - monthEnd) / (1000 * 60 * 60 * 24));
}

function getDaysAfterYearEnd(now) {
  const yearEnd = new Date(now.getFullYear() - 1, 11, 31);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  yearEnd.setHours(0, 0, 0, 0);

  return Math.floor((today - yearEnd) / (1000 * 60 * 60 * 24));
}

function getMonthName(date) {
  return date.toLocaleString("en-US", { month: "long" });
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const dateFilter = searchParams.get("date") || "";

    const now = new Date();
    const today = new Date().toISOString().slice(0, 10);

    const cashExpenses = await CashTransaction.find({
      type: "out",
      category: { $in: EXPENSE_CATEGORIES },
    }).sort({ createdAt: -1 });

    const bankExpenses = await BankTransaction.find({
      type: "out",
      category: { $in: EXPENSE_CATEGORIES },
    })
      .populate("bankId")
      .sort({ createdAt: -1 });

    const allExpenses = [
      ...cashExpenses.map((e) => ({
        _id: e._id,
        source: "cash",
        date: e.date,
        title: e.title,
        category: e.category,
        amount: Number(e.amount || 0),
        note: e.note || "",
      })),
      ...bankExpenses.map((e) => ({
        _id: e._id,
        source: e.bankId?.bankName || "bank",
        date: e.date,
        title: e.title,
        category: e.category,
        amount: Number(e.amount || 0),
        note: e.note || "",
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    let rows = allExpenses;

    if (search) {
      rows = rows.filter(
        (r) =>
          r.title?.toLowerCase().includes(search.toLowerCase()) ||
          r.category?.toLowerCase().includes(search.toLowerCase()) ||
          r.note?.toLowerCase().includes(search.toLowerCase()) ||
          r.source?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateFilter) {
      rows = rows.filter((r) => r.date === dateFilter);
    }

    const todayExpense = allExpenses
      .filter((e) => isSameDate(e.date, today))
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpense = allExpenses
      .filter((e) => isSameMonth(e.date, now))
      .reduce((sum, e) => sum + e.amount, 0);

    const yearlyExpense = allExpenses
      .filter((e) => isSameYear(e.date, now))
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryMap = {};

    allExpenses.forEach((e) => {
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = {
          category: e.category,
          amount: 0,
          count: 0,
        };
      }

      categoryMap[e.category].amount += e.amount;
      categoryMap[e.category].count += 1;
    });

    const categoryWise = Object.values(categoryMap).sort(
      (a, b) => b.amount - a.amount
    );

    let cardTitle = "Expense";
    let cardValue = `৳ ${Number(totalExpense || 0).toFixed(2)}`;
    let message = "";
    let celebrationType = "normal";

    const daysAfterYearEnd = getDaysAfterYearEnd(new Date());
    const daysAfterMonthEnd = getDaysAfterMonthEnd(new Date());

    if (daysAfterYearEnd >= 1 && daysAfterYearEnd <= 7) {
      cardTitle = "Yearly Expense";
      cardValue = `${now.getFullYear() - 1} সালের খরচ ৳ ${Number(
        yearlyExpense
      ).toFixed(2)}`;
      message =
        "বছরের খরচ বিশ্লেষণ করে আগামী বছরের জন্য আরও ভালো বাজেট পরিকল্পনা করুন।";
      celebrationType = "yearly";
    } else if (
      isLastDayOfMonth(new Date()) ||
      (daysAfterMonthEnd >= 1 && daysAfterMonthEnd <= 3)
    ) {
      const monthName = getMonthName(new Date());

      cardTitle = "Monthly Expense";
      cardValue = `${monthName} মাসের খরচ ৳ ${Number(monthlyExpense).toFixed(
        2
      )}`;
      message =
        "মাসের খরচ দেখুন, অপ্রয়োজনীয় খরচ কমান এবং লাভ বাড়ানোর পরিকল্পনা করুন।";
      celebrationType = "monthly";
    }

    return NextResponse.json({
      success: true,
      data: {
        cardTitle,
        cardValue,
        message,
        celebrationType,

        todayExpense,
        monthlyExpense,
        yearlyExpense,
        totalExpense,

        categoryWise,
        rows,
      },
    });
  } catch (error) {
    console.error("EXPENSE_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load expense data" },
      { status: 500 }
    );
  }
}