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

        // 🔥 NEW ERP FIELDS
        head: e.head || e.category,
        employeeId: e.employeeId || null,
        employeeName: e.employeeName || "",
        paymentType: e.paymentType || "Cash",

        amount: Number(e.amount || 0),
        note: e.note || "",
      })),

      ...bankExpenses.map((e) => ({
        _id: e._id,
        source: e.bankId?.bankName || "bank",
        date: e.date,
        title: e.title,
        category: e.category,

        // 🔥 NEW ERP FIELDS
        head: e.head || e.category,
        employeeId: e.employeeId || null,
        employeeName: e.employeeName || "",
        paymentType: e.paymentType || "Bank",

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
          r.source?.toLowerCase().includes(search.toLowerCase()) ||
          r.head?.toLowerCase().includes(search.toLowerCase()) ||
          r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
          r.paymentType?.toLowerCase().includes(search.toLowerCase())
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

    // 🔥 Head-wise grouping (updated)
    const headMap = {};

    allExpenses.forEach((e) => {
      const key = e.head || "others";

      if (!headMap[key]) {
        headMap[key] = {
          category: key,
          amount: 0,
          count: 0,
        };
      }

      headMap[key].amount += e.amount;
      headMap[key].count += 1;
    });

    const categoryWise = Object.values(headMap).sort(
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