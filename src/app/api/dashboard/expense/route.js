import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import BankAccount from "@/models/BankAccount";
import ChequeBook from "@/models/ChequeBook";
import ChequeRegister from "@/models/ChequeRegister";
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

function n(v) {
  return Number(v || 0) || 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function includesText(value, q) {
  return String(value || "").toLowerCase().includes(q);
}

async function checkAccess(tenant) {
  try {
    await requirePermission(tenant, "accounts");
    return null;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Access denied" },
      { status: 403 }
    );
  }
}

async function getCash(companyId) {
  let cash = await Cash.findOne({ companyId });

  if (!cash) {
    cash = await Cash.create({
      companyId,
      currentBalance: 0,
      balance: 0,
    });
  }

  return cash;
}

async function restoreCash(companyId, amount) {
  const cash = await getCash(companyId);
  const before = n(cash.currentBalance || cash.balance);
  const after = before + n(amount);

  cash.currentBalance = after;
  cash.balance = after;

  await cash.save();

  return { before, after };
}

async function applyCash(companyId, amount) {
  const cash = await getCash(companyId);
  const before = n(cash.currentBalance || cash.balance);

  if (before < n(amount)) {
    throw new Error("Not enough cash balance");
  }

  const after = before - n(amount);

  cash.currentBalance = after;
  cash.balance = after;

  await cash.save();

  return { before, after };
}

async function restoreBank({ companyId, bankId, amount }) {
  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
  });

  if (!bank) throw new Error("Bank not found");

  const before = n(bank.currentBalance);
  const after = before + n(amount);

  bank.currentBalance = after;
  bank.balance = after;
  bank.lastTransactionAt = new Date();

  await bank.save();

  return { bank, before, after };
}

async function applyBank({ companyId, bankId, amount }) {
  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
    status: { $ne: "inactive" },
  });

  if (!bank) throw new Error("Bank not found");

  const before = n(bank.currentBalance);

  if (before < n(amount)) {
    throw new Error("Not enough bank balance");
  }

  const after = before - n(amount);

  bank.currentBalance = after;
  bank.balance = after;
  bank.lastTransactionAt = new Date();

  await bank.save();

  return { bank, before, after };
}

async function getAutoChequeNo({ companyId, bankId }) {
  const chequeBook = await ChequeBook.findOne({
    companyId,
    bankId,
    status: "active",
  }).sort({ createdAt: 1 });

  if (!chequeBook) throw new Error("No active cheque book found for this bank");

  if (n(chequeBook.nextNo) > n(chequeBook.endNo)) {
    chequeBook.status = "completed";
    await chequeBook.save();
    throw new Error("Cheque book completed. Please add new cheque book");
  }

  return { chequeBook, chequeNo: String(chequeBook.nextNo) };
}

async function markChequeUsed(chequeBook) {
  chequeBook.nextNo = n(chequeBook.nextNo) + 1;
  chequeBook.usedLeaves = n(chequeBook.usedLeaves) + 1;
  chequeBook.remainingLeaves = Math.max(0, n(chequeBook.remainingLeaves) - 1);

  if (n(chequeBook.nextNo) > n(chequeBook.endNo)) {
    chequeBook.status = "completed";
  }

  await chequeBook.save();
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
    paymentType:
      source === "bank" ? e.paymentMethod || "bank" : e.paymentType || "Cash",
    amount: n(e.amount),
    note: e.note || "",
    comment: e.comment || "",
    refType: e.refType || "",
    refId: e.refId || "",
    transactionId: e.transactionId || "",
    chequeNo: e.chequeNo || "",
    voucherNo:
      source === "bank"
        ? e.transactionNo || e.voucherNo || ""
        : e.voucherNo || "",
    createdAt: e.createdAt,
  };
}

function filterRows(rows, { search, dateFilter, sourceFilter }) {
  let result = rows;

  if (sourceFilter) result = result.filter((r) => r.source === sourceFilter);
  if (dateFilter)
    result = result.filter((r) => normalizeDate(r.date) === dateFilter);

  if (search) {
    const q = search.toLowerCase();

    result = result.filter(
      (r) =>
        includesText(r.title, q) ||
        includesText(r.category, q) ||
        includesText(r.note, q) ||
        includesText(r.comment, q) ||
        includesText(r.sourceName, q) ||
        includesText(r.head, q) ||
        includesText(r.paymentType, q) ||
        includesText(r.refType, q) ||
        includesText(r.refId, q) ||
        includesText(r.voucherNo, q) ||
        includesText(r.chequeNo, q)
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

    categoryMap[categoryKey].amount += n(e.amount);
    categoryMap[categoryKey].count += 1;

    const sourceKey = e.sourceName || e.source || "Other";

    if (!sourceMap[sourceKey]) {
      sourceMap[sourceKey] = {
        source: sourceKey,
        amount: 0,
        count: 0,
      };
    }

    sourceMap[sourceKey].amount += n(e.amount);
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

    const denied = await checkAccess(tenant);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);

    const search = String(searchParams.get("search") || "").trim();
    const dateFilter = searchParams.get("date") || "";
    const sourceFilter = searchParams.get("source") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const now = new Date();
    const todayDate = today();

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
      .filter((e) => e.date === todayDate)
      .reduce((s, e) => s + n(e.amount), 0);

    const monthlyExpense = allExpenses
      .filter((e) => {
        const d = new Date(e.date);

        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      })
      .reduce((s, e) => s + n(e.amount), 0);

    const yearlyExpense = allExpenses
      .filter((e) => new Date(e.date).getFullYear() === now.getFullYear())
      .reduce((s, e) => s + n(e.amount), 0);

    const totalExpense = allExpenses.reduce((s, e) => s + n(e.amount), 0);

    const filteredTotalExpense = rows.reduce((s, e) => s + n(e.amount), 0);

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
    console.error("EXPENSE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load expense data",
      },
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

    const denied = await checkAccess(tenant);
    if (denied) return denied;

    const body = await req.json();

    const amount = n(body.amount);
    const paymentFrom = body.paymentFrom || "cash";
    const paymentMethod = body.paymentMethod || paymentFrom;
    const date = body.date || today();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, message: "Expense title required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount required" },
        { status: 400 }
      );
    }

    if (!["cash", "bank"].includes(paymentFrom)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment source" },
        { status: 400 }
      );
    }

    let transaction = null;
    let chequeRegister = null;

    if (paymentFrom === "bank") {
      if (!body.bankId) {
        return NextResponse.json(
          { success: false, message: "Select bank" },
          { status: 400 }
        );
      }

      const bankInfo = await applyBank({
        companyId: tenant.companyId,
        bankId: body.bankId,
        amount,
      });

      let chequeBook = null;
      let chequeNo = "";

      if (paymentMethod === "cheque") {
        const chequeInfo = await getAutoChequeNo({
          companyId: tenant.companyId,
          bankId: bankInfo.bank._id,
        });

        chequeBook = chequeInfo.chequeBook;
        chequeNo = chequeInfo.chequeNo;
      }

      transaction = await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        bankId: bankInfo.bank._id,

        type: "out",
        category: body.category || "expense",
        title: body.title.trim(),
        amount,

        paymentMethod,
        chequeNo,
        transactionId: body.transactionId || "",

        personName: body.personName || "Expense",
        personType: "other",

        head: body.head || "expense",
        date,
        note: body.note || "",
        comment: body.comment || "",

        refType: "expense",
        refId: body.refId || "",

        balanceBefore: bankInfo.before,
        balanceAfter: bankInfo.after,

        status: "active",
      });

      if (paymentMethod === "cheque") {
        chequeRegister = await ChequeRegister.create({
          companyId: tenant.companyId,

          bankId: bankInfo.bank._id,
          bankName: bankInfo.bank.bankName || "",

          chequeNo,
          payTo: body.title || "Expense",

          amount,
          chequeDate: date,

          sourceType: "expense",
          transactionId: String(transaction._id),

          status: "pending",
          note: body.note || "",
        });

        await markChequeUsed(chequeBook);
      }
    } else {
      const cashInfo = await applyCash(tenant.companyId, amount);

      transaction = await CashTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        type: "out",
        category: body.category || "expense",
        title: body.title.trim(),
        amount,

        balanceBefore: cashInfo.before,
        balanceAfter: cashInfo.after,

        date,
        note: body.note || "",
        comment: body.comment || "",

        head: body.head || "expense",

        refType: "expense",
        refId: body.refId || "",

        paymentType: "Cash",
        paymentFrom: "cash",

        status: "active",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Expense saved successfully",
      data: {
        transaction,
        chequeRegister,
      },
    });
  } catch (error) {
    console.error("EXPENSE_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Expense save failed",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const denied = await checkAccess(tenant);
    if (denied) return denied;

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Expense id required" },
        { status: 400 }
      );
    }

    const source = body.paymentFrom || body.source || "cash";
    const Model = source === "bank" ? BankTransaction : CashTransaction;

    const txn = await Model.findOne({
      _id: body._id,
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    });

    if (!txn) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    const oldAmount = n(txn.amount);
    const newAmount = n(body.amount || txn.amount);
    const diff = newAmount - oldAmount;

    if (diff !== 0) {
      if (source === "bank") {
        if (diff > 0) {
          await applyBank({
            companyId: tenant.companyId,
            bankId: txn.bankId,
            amount: diff,
          });
        } else {
          await restoreBank({
            companyId: tenant.companyId,
            bankId: txn.bankId,
            amount: Math.abs(diff),
          });
        }
      } else {
        if (diff > 0) {
          await applyCash(tenant.companyId, diff);
        } else {
          await restoreCash(tenant.companyId, Math.abs(diff));
        }
      }
    }

    txn.title = body.title || txn.title;
    txn.head = body.head || txn.head;
    txn.amount = newAmount;
    txn.date = body.date || txn.date;
    txn.note = body.note ?? txn.note;
    txn.comment = body.comment ?? txn.comment;
    txn.transactionId = body.transactionId ?? txn.transactionId;
    txn.updatedByUserId = tenant.user?.id || null;
    txn.updatedBy = tenant.user?.name || "";

    await txn.save();

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully",
      data: txn,
    });
  } catch (error) {
    console.error("EXPENSE_PUT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Expense update failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const denied = await checkAccess(tenant);
    if (denied) return denied;

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Expense id required" },
        { status: 400 }
      );
    }

    const source = body.source || "cash";
    const Model = source === "bank" ? BankTransaction : CashTransaction;

    const txn = await Model.findOne({
      _id: body._id,
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    });

    if (!txn) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    if (source === "bank") {
      await restoreBank({
        companyId: tenant.companyId,
        bankId: txn.bankId,
        amount: txn.amount,
      });

      if (txn.paymentMethod === "cheque" && txn.chequeNo) {
        await ChequeRegister.findOneAndUpdate(
          {
            companyId: tenant.companyId,
            transactionId: String(txn._id),
          },
          {
            status: "cancelled",
            note: `${txn.note || ""} | Expense cancelled`,
            updatedByUserId: tenant.user?.id || null,
            updatedBy: tenant.user?.name || "",
          },
          { returnDocument: "after" }
        );
      }
    } else {
      await restoreCash(tenant.companyId, txn.amount);
    }

    txn.status = "cancelled";
    txn.cancelledAt = new Date();
    txn.cancelledByUserId = tenant.user?.id || null;

    await txn.save();

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("EXPENSE_DELETE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Expense delete failed",
      },
      { status: 500 }
    );
  }
}