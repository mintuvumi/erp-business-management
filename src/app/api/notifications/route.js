import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import Employee from "@/models/Employee";
import { getTenant } from "@/lib/tenant";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeAlert({ type, title, message, refType = "", path = "", refId = "" }) {
  return {
    type,
    title,
    message,
    refType,
    refId,
    path,
    read: false,
    createdAt: new Date(),
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

    const todayDate = today();
    const isMarketingOfficer = tenant.role === "marketing_officer";

    const baseSaleQuery = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (isMarketingOfficer) {
      baseSaleQuery.marketingOfficerId = tenant.user?.id;
    }

    const [sales, purchases, stocks, cashTransactions, banks, employees] =
      await Promise.all([
        Sale.find(baseSaleQuery).sort({ createdAt: -1 }).limit(200),
        isMarketingOfficer
          ? []
          : Purchase.find({
              companyId: tenant.companyId,
              status: { $ne: "cancelled" },
            }).sort({ createdAt: -1 }).limit(100),
        isMarketingOfficer
          ? []
          : Stock.find({
              companyId: tenant.companyId,
              status: "active",
            }).sort({ createdAt: -1 }),
        isMarketingOfficer
          ? []
          : CashTransaction.find({
              companyId: tenant.companyId,
              status: { $ne: "cancelled" },
            }),
        isMarketingOfficer
          ? []
          : BankAccount.find({
              companyId: tenant.companyId,
              status: "active",
            }),
        isMarketingOfficer
          ? []
          : Employee.find({
              companyId: tenant.companyId,
              status: { $ne: "inactive" },
            }),
      ]);

    const alerts = [];

    const dueTodaySales = sales.filter(
      (s) =>
        Number(s.dueAmount || 0) > 0 &&
        s.nextCollectionDate &&
        String(s.nextCollectionDate) <= todayDate
    );

    if (dueTodaySales.length > 0) {
      const totalDueToday = dueTodaySales.reduce(
        (sum, s) => sum + Number(s.dueAmount || 0),
        0
      );

      alerts.push(
        makeAlert({
          type: "warning",
          title: "Due Collection Reminder",
          message: `${dueTodaySales.length} জন customer-এর collection date এসেছে। Total due ৳ ${money(
            totalDueToday
          )}। Follow-up করুন।`,
          refType: "due_collection",
          path: "/customers/statement?dueToday=true",
        })
      );

      dueTodaySales.slice(0, 5).forEach((sale) => {
        alerts.push(
          makeAlert({
            type: "warning",
            title: `${sale.customerName} - Due Today`,
            message: `Invoice ${sale.billNo || ""}, due ৳ ${money(
              sale.dueAmount
            )}, promised date ${sale.nextCollectionDate}. ${
              sale.collectionComment || sale.dueSchedule?.reminderNote || ""
            }`,
            refType: "customer_due_today",
            refId: String(sale._id),
            path: `/customers/statement?customer=${encodeURIComponent(
              sale.customerName || ""
            )}`,
          })
        );
      });
    }

    const overdueSales = sales.filter(
      (s) =>
        Number(s.dueAmount || 0) > 0 &&
        s.nextCollectionDate &&
        String(s.nextCollectionDate) < todayDate
    );

    if (overdueSales.length > 0) {
      const overdueAmount = overdueSales.reduce(
        (sum, s) => sum + Number(s.dueAmount || 0),
        0
      );

      alerts.push(
        makeAlert({
          type: "danger",
          title: "Overdue Customer Due",
          message: `${overdueSales.length} টি invoice overdue। Amount ৳ ${money(
            overdueAmount
          )}। Interest applicable হলে customer ledger check করুন।`,
          refType: "overdue_due",
          path: "/customers/statement?dueToday=true",
        })
      );
    }

    const customerDue = sales.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0
    );

    if (customerDue > 0) {
      alerts.push(
        makeAlert({
          type: "warning",
          title: "Customer Due Pending",
          message: `Customer due amount ৳ ${money(
            customerDue
          )} pending আছে। Collection follow-up করুন।`,
          refType: "customer_due",
          path: "/customers/statement",
        })
      );
    }

    if (!isMarketingOfficer) {
      const supplierDue = purchases.reduce(
        (sum, p) => sum + Number(p.dueAmount || 0),
        0
      );

      if (supplierDue > 0) {
        alerts.push(
          makeAlert({
            type: "warning",
            title: "Supplier Payable Pending",
            message: `Supplier payable ৳ ${money(
              supplierDue
            )} আছে। Payment schedule check করুন।`,
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
            message: `Cash in hand ৳ ${money(
              cashInHand
            )}। Expense control বা due collection দরকার।`,
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
            message: `Total bank balance ৳ ${money(
              totalBankBalance
            )}। Bank transaction review করুন।`,
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
              ? `Net profit ৳ ${money(
                  netProfit
                )}। Business position positive আছে।`
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
    }

    const savedQuery = {
      companyId: tenant.companyId,
    };

    if (isMarketingOfficer) {
      savedQuery.$or = [
        { userId: tenant.user?.id },
        { marketingOfficerId: tenant.user?.id },
        { refType: { $in: ["customer_due", "due_collection", "customer_due_today"] } },
      ];
    }

    const savedNotifications = await Notification.find(savedQuery)
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
      { success: false, message: error.message || "Failed to load notifications" },
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

    const body = await req.json();

    const notification = await Notification.create({
      companyId: tenant.companyId,
      userId: body.userId || null,
      marketingOfficerId: body.marketingOfficerId || null,
      type: body.type || "info",
      title: body.title,
      message: body.message || "",
      refType: body.refType || "",
      refId: body.refId || "",
      path: body.path || "",
      read: false,
    });

    return NextResponse.json({
      success: true,
      message: "Notification created",
      data: notification,
    });
  } catch (error) {
    console.error("NOTIFICATION_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create notification" },
      { status: 500 }
    );
  }
}