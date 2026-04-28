
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import Notification from "@/models/Notification";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import Employee from "@/models/Employee";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function makeAlert({ type, title, message, refType = "", path = "" }) {
  return {
    type,
    title,
    message,
    refType,
    path,
    read: false,
    createdAt: new Date(),
  };
}

export async function GET() {
  try {
    await connectDB();

    const sales = await Sale.find().sort({ createdAt: -1 }).limit(100);
    const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(100);
    const stocks = await Stock.find().sort({ createdAt: -1 });
    const cashTransactions = await CashTransaction.find();
    const banks = await BankAccount.find();
    const employees = await Employee.find();

    const alerts = [];

    const customerDue = sales.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0
    );

    if (customerDue > 0) {
      alerts.push(
        makeAlert({
          type: "warning",
          title: "Customer Due Pending",
          message: `Customer due amount ৳ ${money(customerDue)} pending আছে। Collection follow-up করুন।`,
          refType: "customer_due",
          path: "/customers/statement",
        })
      );
    }

    const supplierDue = purchases.reduce(
      (sum, p) => sum + Number(p.dueAmount || 0),
      0
    );

    if (supplierDue > 0) {
      alerts.push(
        makeAlert({
          type: "warning",
          title: "Supplier Payable Pending",
          message: `Supplier payable ৳ ${money(supplierDue)} আছে। Payment schedule check করুন।`,
          refType: "supplier_due",
          path: "/suppliers/ledger",
        })
      );
    }

    const lowStocks = stocks.filter(
      (s) => Number(s.qty || 0) <= Number(s.lowStockLimit || 5)
    );

    if (lowStocks.length > 0) {
      alerts.push(
        makeAlert({
          type: "danger",
          title: "Low Stock Alert",
          message: `${lowStocks.length} টি product low stock আছে। ${lowStocks
            .slice(0, 3)
            .map((s) => s.itemName)
            .join(", ")} ${lowStocks.length > 3 ? "..." : ""}`,
          refType: "stock",
          path: "/stock",
        })
      );
    }

    const cashIn = cashTransactions
      .filter((c) => c.type === "in")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const cashOut = cashTransactions
      .filter((c) => c.type === "out")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const cashInHand = cashIn - cashOut;

    if (cashInHand < 5000) {
      alerts.push(
        makeAlert({
          type: "danger",
          title: "Cash Balance Low",
          message: `Cash in hand ৳ ${money(cashInHand)}। Expense control বা due collection দরকার।`,
          refType: "cash",
          path: "/dashboard",
        })
      );
    }

    const totalBankBalance = banks.reduce(
      (sum, b) => sum + Number(b.currentBalance || 0),
      0
    );

    if (totalBankBalance < 10000) {
      alerts.push(
        makeAlert({
          type: "warning",
          title: "Bank Balance Low",
          message: `Total bank balance ৳ ${money(totalBankBalance)}। Bank transaction review করুন।`,
          refType: "bank",
          path: "/bank",
        })
      );
    }

    const totalProfit = sales.reduce(
      (sum, s) => sum + Number(s.totalProfit || 0),
      0
    );

    const totalExpense = cashTransactions
      .filter((c) =>
        ["expense", "salary_payment", "refund_paid"].includes(c.category)
      )
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const netProfit = totalProfit - totalExpense;

    alerts.push(
      makeAlert({
        type: netProfit >= 0 ? "success" : "danger",
        title: netProfit >= 0 ? "Profit Position Good" : "Loss Alert",
        message:
          netProfit >= 0
            ? `Net profit ৳ ${money(netProfit)}। অভিনন্দন, business position positive আছে।`
            : `Current loss ৳ ${money(
                Math.abs(netProfit)
              )}। Expense reduce ও sales increase plan দরকার।`,
        refType: "profit",
        path: "/dashboard",
      })
    );

    const absentEmployees = employees.filter((e) => !e.presentToday);

    if (absentEmployees.length > 0) {
      alerts.push(
        makeAlert({
          type: "info",
          title: "Employee Attendance",
          message: `${absentEmployees.length} জন employee absent আছে। Attendance review করুন।`,
          refType: "employee",
          path: "/employee",
        })
      );
    }

    const savedNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20);

    const notifications = [
      ...alerts,
      ...savedNotifications.map((n) => ({
        _id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        refType: n.refType,
        refId: n.refId,
        path: n.path,
        createdAt: n.createdAt,
      })),
    ].slice(0, 30);

    return NextResponse.json({
      success: true,
      data: {
        unreadCount: notifications.filter((n) => !n.read).length,
        notifications,
      },
    });
  } catch (error) {
    console.error("NOTIFICATION_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const notification = await Notification.create({
      type: body.type || "info",
      title: body.title,
      message: body.message || "",
      refType: body.refType || "",
      refId: body.refId || "",
      path: body.path || "",
    });

    return NextResponse.json({
      success: true,
      message: "Notification created",
      data: notification,
    });
  } catch (error) {
    console.error("NOTIFICATION_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create notification" },
      { status: 500 }
    );
  }
}