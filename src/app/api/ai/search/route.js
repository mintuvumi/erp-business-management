import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import Employee from "@/models/Employee";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function isThisMonth(dateString) {
  const now = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase();

    const sales = await Sale.find();
    const purchases = await Purchase.find();
    const stocks = await Stock.find();
    const cashTransactions = await CashTransaction.find();
    const banks = await BankAccount.find();
    const employees = await Employee.find();

    const totalSales = sales.reduce(
      (sum, s) => sum + Number(s.netSalesAmount || s.netTotal || 0),
      0
    );

    const monthlySales = sales
      .filter((s) => isThisMonth(s.date))
      .reduce((sum, s) => sum + Number(s.netSalesAmount || s.netTotal || 0), 0);

    const totalDueCustomer = sales.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0
    );

    const totalPurchaseDue = purchases.reduce(
      (sum, p) => sum + Number(p.dueAmount || 0),
      0
    );

    const totalStockValue = stocks.reduce(
      (sum, s) => sum + Number(s.totalValue || 0),
      0
    );

    const lowStocks = stocks.filter(
      (s) => Number(s.qty || 0) <= Number(s.lowStockLimit || 5)
    );

    const cashIn = cashTransactions
      .filter((c) => c.type === "in")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const cashOut = cashTransactions
      .filter((c) => c.type === "out")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const cashInHand = cashIn - cashOut;

    const bankBalance = banks.reduce(
      (sum, b) => sum + Number(b.currentBalance || 0),
      0
    );

    const totalProfit = sales.reduce(
      (sum, s) => sum + Number(s.totalProfit || 0),
      0
    );

    const monthlyProfit = sales
      .filter((s) => isThisMonth(s.date))
      .reduce((sum, s) => sum + Number(s.totalProfit || 0), 0);

    const expense = cashTransactions
      .filter((c) =>
        ["expense", "salary_payment", "refund_paid"].includes(c.category)
      )
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const netProfit = totalProfit - expense;

    let title = "AI Business Assistant";
    let answer = "";
    let suggestions = [];

    if (q.includes("profit") || q.includes("লাভ")) {
      title = "Profit Analysis";
      answer = `Total profit ৳ ${money(netProfit)}। এই মাসের profit ৳ ${money(
        monthlyProfit
      )}।`;

      suggestions =
        netProfit >= 0
          ? ["লাভ ভালো আছে। বেশি লাভজনক product focus করুন।"]
          : ["লস কমাতে expense control করুন এবং due collection বাড়ান।"];
    } else if (q.includes("due") || q.includes("বাকি")) {
      title = "Due Analysis";
      answer = `Customer due ৳ ${money(
        totalDueCustomer
      )} এবং Supplier payable ৳ ${money(totalPurchaseDue)}।`;

      suggestions = [
        "Customer due collection priority দিন।",
        "Supplier payment schedule maintain করুন।",
      ];
    } else if (q.includes("stock") || q.includes("স্টক")) {
      title = "Stock Analysis";
      answer = `Total stock value ৳ ${money(
        totalStockValue
      )}। Low stock item ${lowStocks.length} টি।`;

      suggestions =
        lowStocks.length > 0
          ? lowStocks.slice(0, 5).map((s) => `${s.itemName} stock কম আছে`)
          : ["Stock level ভালো আছে।"];
    } else if (q.includes("cash") || q.includes("ক্যাশ")) {
      title = "Cash Analysis";
      answer = `Cash in hand ৳ ${money(cashInHand)}। Total cash in ৳ ${money(
        cashIn
      )}, cash out ৳ ${money(cashOut)}।`;

      suggestions =
        cashInHand < 5000
          ? ["Cash low। Due collection বা owner capital add করতে পারেন।"]
          : ["Cash position stable আছে।"];
    } else if (q.includes("bank") || q.includes("ব্যাংক")) {
      title = "Bank Analysis";
      answer = `Total bank balance ৳ ${money(bankBalance)}। মোট bank account ${banks.length} টি।`;

      suggestions = banks.map(
        (b) => `${b.bankName}: ৳ ${money(b.currentBalance)}`
      );
    } else if (q.includes("expense") || q.includes("খরচ")) {
      title = "Expense Analysis";
      answer = `Total expense ৳ ${money(expense)}।`;

      suggestions = [
        "Expense category-wise review করুন।",
        "অপ্রয়োজনীয় খরচ কমালে profit বাড়বে।",
      ];
    } else if (q.includes("employee") || q.includes("salary") || q.includes("কর্মচারী")) {
      title = "Employee Analysis";
      answer = `Total employee ${employees.length} জন। Present ${employees.filter(
        (e) => e.presentToday
      ).length} জন, absent ${
        employees.filter((e) => !e.presentToday).length
      } জন।`;

      suggestions = ["Salary sheet এবং attendance নিয়মিত update করুন।"];
    } else {
      title = "Business Summary";
      answer = `Sales ৳ ${money(totalSales)}, monthly sales ৳ ${money(
        monthlySales
      )}, cash ৳ ${money(cashInHand)}, bank ৳ ${money(
        bankBalance
      )}, stock ৳ ${money(totalStockValue)}, net profit ৳ ${money(netProfit)}।`;

      suggestions = [
        "Due collection check করুন।",
        "Low stock item review করুন।",
        "Expense control করলে profit বাড়বে।",
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        answer,
        suggestions,
      },
    });
  } catch (error) {
    console.error("AI_SEARCH_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "AI search failed" },
      { status: 500 }
    );
  }
}