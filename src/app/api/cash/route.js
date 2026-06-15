import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
import { requireActiveSubscription } from "@/lib/subscription";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function money(value) {
  return Number(value || 0);
}

function makeRegex(value) {
  return {
    $regex: String(value || "").trim(),
    $options: "i",
  };
}

function isSameMonth(dateString, now = new Date()) {
  if (!dateString) return false;
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isSameYear(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date.getFullYear() === now.getFullYear();
}

function isSameDate(date, target) {
  return normalizeDate(date) === target;
}

function buildQuery({ tenant, searchParams }) {
  const search = searchParams.get("search") || "";
  const date = searchParams.get("date") || "";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const type = searchParams.get("type") || "";
  const category = searchParams.get("category") || "";

  const query = {
    companyId: tenant.companyId,
    status: { $ne: "cancelled" },
  };

  if (type) query.type = type;
  if (category) query.category = category;
  if (date) query.date = date;

  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = fromDate;
    if (toDate) query.date.$lte = toDate;
  }

  if (search) {
    const regex = makeRegex(search);

    query.$or = [
      { title: regex },
      { category: regex },
      { note: regex },
      { comment: regex },
      { refType: regex },
      { refId: regex },
      { voucherNo: regex },
      { head: regex },
      { employeeName: regex },
      { customerName: regex },
      { customerPhone: regex },
      { supplierName: regex },
      { marketingOfficerName: regex },
      { billNo: regex },
      { paymentType: regex },
    ];
  }

  return query;
}

function transactionDTO(txn, runningBalance = 0) {
  const amount = money(txn.amount);

  return {
    _id: String(txn._id),
    date: normalizeDate(txn.date || txn.createdAt),
    voucherNo: txn.voucherNo || "",
    title: txn.title || "",
    category: txn.category || "",
    head: txn.head || txn.category || "",
    type: txn.type,

    debit: txn.type === "out" ? amount : 0,
    credit: txn.type === "in" ? amount : 0,
    amount,

    balance: runningBalance,
    balanceAfter: money(txn.balanceAfter || runningBalance),

    note: txn.note || "",
    comment: txn.comment || "",

    refType: txn.refType || "",
    refId: txn.refId || "",

    customerId: txn.customerId || null,
    customerName: txn.customerName || "",
    customerPhone: txn.customerPhone || "",

    supplierId: txn.supplierId || null,
    supplierName: txn.supplierName || "",

    employeeId: txn.employeeId || null,
    employeeName: txn.employeeName || "",

    marketingOfficerId: txn.marketingOfficerId || null,
    marketingOfficerName: txn.marketingOfficerName || "",

    saleId: txn.saleId || null,
    purchaseId: txn.purchaseId || null,
    billNo: txn.billNo || "",

    paymentType: txn.paymentType || "",
    paymentFrom: txn.paymentFrom || "cash",

    createdAt: txn.createdAt,
  };
}

async function getOrCreateCash(companyId) {
  let cash = await Cash.findOne({ companyId });

  if (!cash) {
    cash = await Cash.create({
      companyId,
      openingBalance: 0,
      currentBalance: 0,
      balance: 0,
      status: "active",
    });
  }

  return cash;
}

async function syncCashBalanceFromTransactions(companyId) {
  const cash = await getOrCreateCash(companyId);

  const transactions = await CashTransaction.find({
    companyId,
    status: { $ne: "cancelled" },
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();

  const openingBalance = money(cash.openingBalance);
  let runningBalance = openingBalance;

  for (const txn of transactions) {
    runningBalance += txn.type === "in" ? money(txn.amount) : -money(txn.amount);
  }

  cash.currentBalance = runningBalance;
  cash.balance = runningBalance;
  await cash.save();

  return {
    cash,
    transactions,
    openingBalance,
    totalIn: transactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + money(t.amount), 0),
    totalOut: transactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + money(t.amount), 0),
  };
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

    const sub = await requireActiveSubscription(tenant);

    if (!sub.ok) {
      return NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
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

    const body = await req.json();
    const amount = money(body.amount);

    if (!body.title?.trim() || !body.type || !body.category) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, amount, type and category required",
        },
        { status: 400 }
      );
    }

    if (!["in", "out"].includes(body.type)) {
      return NextResponse.json(
        { success: false, message: "Valid cash type required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount required" },
        { status: 400 }
      );
    }

    const cash = await getOrCreateCash(tenant.companyId);
    const currentCashBalance = money(cash.currentBalance || cash.balance || 0);

    if (body.type === "out" && currentCashBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Not enough cash balance",
        },
        { status: 400 }
      );
    }

    const balanceBefore = currentCashBalance;
    const balanceAfter =
      body.type === "in"
        ? currentCashBalance + amount
        : currentCashBalance - amount;

    const transaction = await CashTransaction.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",

      type: body.type,
      category: body.category,
      title: body.title.trim(),
      amount,
      note: body.note || "",
      comment: body.comment || "",

      head: body.head || body.category || "",

      employeeId: body.employeeId || null,
      employeeName: body.employeeName || "",

      customerId: body.customerId || null,
      customerName: body.customerName || "",
      customerPhone: body.customerPhone || "",

      supplierId: body.supplierId || null,
      supplierName: body.supplierName || "",

      marketingOfficerId: body.marketingOfficerId || null,
      marketingOfficerName: body.marketingOfficerName || "",

      saleId: body.saleId || null,
      purchaseId: body.purchaseId || null,

      billNo: body.billNo || "",
      voucherNo: body.voucherNo || "",

      paymentType: body.paymentType || "Cash",
      paymentFrom: body.paymentFrom || "cash",
      bankId: body.bankId || null,

      date: body.date || today(),

      refType: body.refType || "manual",
      refId: body.refId || "",

      balanceBefore,
      balanceAfter,
      status: "active",
    });

    cash.currentBalance = balanceAfter;
    cash.balance = balanceAfter;
    await cash.save();

    return NextResponse.json(
      {
        success: true,
        message: "Cash transaction saved",
        data: transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("DASHBOARD_CASH_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save cash transaction",
      },
      { status: 500 }
    );
  }
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

    const sub = await requireActiveSubscription(tenant);

    if (!sub.ok) {
      return NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
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
    const limit = Number(searchParams.get("limit") || 500);
    const query = buildQuery({ tenant, searchParams });

    const [transactions, bankAccounts, cashSync] = await Promise.all([
      CashTransaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .limit(limit)
        .lean(),

      BankAccount.find({
        companyId: tenant.companyId,
        status: "active",
      }).lean(),

      syncCashBalanceFromTransactions(tenant.companyId),
    ]);

    const allTransactions = cashSync.transactions;
    const openingBalance = cashSync.openingBalance;
    const totalIn = cashSync.totalIn;
    const totalOut = cashSync.totalOut;
    const cashInHand = money(cashSync.cash.currentBalance);

    const totalBankBalance = bankAccounts.reduce(
      (sum, b) => sum + money(b.currentBalance),
      0
    );

    const cashAndBankBalance = cashInHand + totalBankBalance;

    const now = new Date();
    const todayDate = today();

    const todayCashIn = allTransactions
      .filter(
        (t) => t.type === "in" && isSameDate(t.date || t.createdAt, todayDate)
      )
      .reduce((sum, t) => sum + money(t.amount), 0);

    const todayCashOut = allTransactions
      .filter(
        (t) => t.type === "out" && isSameDate(t.date || t.createdAt, todayDate)
      )
      .reduce((sum, t) => sum + money(t.amount), 0);

    const monthlyCashIn = allTransactions
      .filter(
        (t) => t.type === "in" && isSameMonth(t.date || t.createdAt, now)
      )
      .reduce((sum, t) => sum + money(t.amount), 0);

    const monthlyCashOut = allTransactions
      .filter(
        (t) => t.type === "out" && isSameMonth(t.date || t.createdAt, now)
      )
      .reduce((sum, t) => sum + money(t.amount), 0);

    const yearlyCashIn = allTransactions
      .filter((t) => t.type === "in" && isSameYear(t.date || t.createdAt))
      .reduce((sum, t) => sum + money(t.amount), 0);

    const yearlyCashOut = allTransactions
      .filter((t) => t.type === "out" && isSameYear(t.date || t.createdAt))
      .reduce((sum, t) => sum + money(t.amount), 0);

    const dueCollection = allTransactions
      .filter((t) => t.category === "due_collection")
      .reduce((sum, t) => sum + money(t.amount), 0);

    const cashSales = allTransactions
      .filter((t) => t.category === "cash_sale")
      .reduce((sum, t) => sum + money(t.amount), 0);

    const expenses = allTransactions
      .filter((t) => t.type === "out" && t.category === "expense")
      .reduce((sum, t) => sum + money(t.amount), 0);

    let runningBalance = openingBalance;

    const statementRowsAsc = [...allTransactions]
      .sort(
        (a, b) =>
          new Date(a.date || a.createdAt).getTime() -
          new Date(b.date || b.createdAt).getTime()
      )
      .map((txn) => {
        const amount = money(txn.amount);
        runningBalance += txn.type === "in" ? amount : -amount;
        return transactionDTO(txn, runningBalance);
      });

    const statementRows = [...statementRowsAsc].sort(
      (a, b) =>
        new Date(b.date || b.createdAt).getTime() -
        new Date(a.date || a.createdAt).getTime()
    );

    const filteredTransactions = transactions.map((txn) => {
      const found = statementRows.find((r) => String(r._id) === String(txn._id));
      return found || transactionDTO(txn, money(txn.balanceAfter));
    });

    const cardSummary = [
      {
        key: "cashInHand",
        title: "Cash In Hand",
        amount: cashInHand,
      },
      {
        key: "bankBalance",
        title: "Bank Balance",
        amount: totalBankBalance,
      },
      {
        key: "cashBank",
        title: "Cash + Bank Balance",
        amount: cashAndBankBalance,
      },
      {
        key: "todayCollection",
        title: "Today Cash In",
        amount: todayCashIn,
      },
      {
        key: "todayExpense",
        title: "Today Cash Out",
        amount: todayCashOut,
      },
      {
        key: "monthlyCollection",
        title: "Monthly Cash In",
        amount: monthlyCashIn,
      },
      {
        key: "monthlyExpense",
        title: "Monthly Cash Out",
        amount: monthlyCashOut,
      },
      {
        key: "netCashFlow",
        title: "Net Cash Flow",
        amount: totalIn - totalOut,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        openingBalance,
        cashInHand,
        totalBankBalance,
        cashAndBankBalance,

        totalIn,
        totalOut,

        todayCashIn,
        todayCashOut,
        todayNetCashFlow: todayCashIn - todayCashOut,

        monthlyCashIn,
        monthlyCashOut,
        monthlyNetCashFlow: monthlyCashIn - monthlyCashOut,

        yearlyCashIn,
        yearlyCashOut,
        yearlyNetCashFlow: yearlyCashIn - yearlyCashOut,

        dueCollection,
        cashSales,
        expenses,

        cardSummary,

        banks: bankAccounts,
        transactions: filteredTransactions,
        statementRows,
      },
    });
  } catch (error) {
    console.error("DASHBOARD_CASH_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load cash dashboard",
      },
      { status: 500 }
    );
  }
}