import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import CashTransaction from "@/models/CashTransaction";
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

function makeRegex(text) {
  return { $regex: String(text || "").trim(), $options: "i" };
}

function makeNo(prefix = "BNK") {
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

async function checkAccountAccess(tenant) {
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

async function recalculateBankLedger(bankId, companyId) {
  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
    status: { $ne: "inactive" },
  });

  if (!bank) return null;

  const txns = await BankTransaction.find({
    bankId,
    companyId,
    status: { $ne: "cancelled" },
  }).sort({ date: 1, createdAt: 1 });

  let balance = money(bank.openingBalance);

  for (const txn of txns) {
    txn.balanceBefore = balance;

    if (txn.type === "in") balance += money(txn.amount);
    if (txn.type === "out") balance -= money(txn.amount);

    txn.balanceAfter = balance;
    await txn.save();
  }

  bank.currentBalance = Math.max(balance, 0);
  bank.lastTransactionAt = new Date();
  await bank.save();

  return bank;
}

async function createCashMirror({
  tenant,
  type,
  category,
  title,
  amount,
  date,
  note,
  refId,
}) {
  return CashTransaction.create({
    companyId: tenant.companyId,
    createdByUserId: tenant.user?.id || null,
    createdBy: tenant.user?.name || "",
    type,
    category,
    title,
    amount,
    date,
    note: note || "",
    refType: "bank",
    refId,
    status: "active",
  });
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



    const denied = await checkAccountAccess(tenant);
    if (denied) return denied;

    const body = await req.json();

    if (body.action === "create_bank") {
      const openingBalance = money(body.openingBalance);
      const accountNumber = String(
        body.accountNumber || body.accountNo || ""
      ).trim();

      if (!body.bankName?.trim()) {
        return NextResponse.json(
          { success: false, message: "Bank name is required" },
          { status: 400 }
        );
      }

      if (openingBalance < 0) {
        return NextResponse.json(
          { success: false, message: "Opening balance cannot be negative" },
          { status: 400 }
        );
      }

      if (accountNumber) {
        const exists = await BankAccount.findOne({
          companyId: tenant.companyId,
          $or: [{ accountNumber }, { accountNo: accountNumber }],
          status: { $ne: "inactive" },
        });

        if (exists) {
          return NextResponse.json(
            { success: false, message: "Bank account already exists" },
            { status: 409 }
          );
        }
      }

      const bank = await BankAccount.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        bankName: body.bankName.trim(),
        accountName: body.accountName || "",
        accountNo: accountNumber,
        accountNumber,
        branchName: body.branchName || body.branch || "",
        branch: body.branch || body.branchName || "",
        routingNumber: body.routingNumber || "",
        swiftCode: body.swiftCode || "",
        bankType: body.bankType || "bank",
        openingBalance,
        currentBalance: openingBalance,
        currency: body.currency || "BDT",
        note: body.note || "",
        accountHolderPhone: body.accountHolderPhone || "",
        accountHolderEmail: body.accountHolderEmail || "",
        status: "active",
      });

      return NextResponse.json(
        { success: true, message: "Bank account created", data: bank },
        { status: 201 }
      );
    }

    if (body.action === "transfer") {
      const amount = money(body.amount);

      if (!body.fromBankId || !body.toBankId) {
        return NextResponse.json(
          { success: false, message: "From bank and To bank required" },
          { status: 400 }
        );
      }

      if (String(body.fromBankId) === String(body.toBankId)) {
        return NextResponse.json(
          { success: false, message: "Cannot transfer to same bank" },
          { status: 400 }
        );
      }

      if (amount <= 0) {
        return NextResponse.json(
          { success: false, message: "Valid amount required" },
          { status: 400 }
        );
      }

      const [fromBank, toBank] = await Promise.all([
        BankAccount.findOne({
          _id: body.fromBankId,
          companyId: tenant.companyId,
          status: { $ne: "inactive" },
        }),
        BankAccount.findOne({
          _id: body.toBankId,
          companyId: tenant.companyId,
          status: { $ne: "inactive" },
        }),
      ]);

      if (!fromBank || !toBank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (money(fromBank.currentBalance) < amount) {
        return NextResponse.json(
          { success: false, message: "Not enough bank balance" },
          { status: 400 }
        );
      }

      const transferRef = makeNo("TRF");
      const date = body.date || today();

      const outBefore = money(fromBank.currentBalance);
      fromBank.currentBalance = outBefore - amount;
      fromBank.lastTransactionAt = new Date();
      await fromBank.save();

      const transferOut = await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        transactionNo: makeNo("BT"),
        bankId: fromBank._id,
        type: "out",
        category: "transfer_out",
        title: body.title || `Transfer to ${toBank.bankName}`,
        amount,
        paymentMethod: "bank",
        personName: toBank.bankName,
        personType: "other",
        date,
        note: body.note || "",
        refType: "bank_transfer",
        refId: transferRef,
        balanceBefore: outBefore,
        balanceAfter: fromBank.currentBalance,
        status: "active",
      });

      const inBefore = money(toBank.currentBalance);
      toBank.currentBalance = inBefore + amount;
      toBank.lastTransactionAt = new Date();
      await toBank.save();

      const transferIn = await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        transactionNo: makeNo("BT"),
        bankId: toBank._id,
        type: "in",
        category: "transfer_in",
        title: body.title || `Transfer from ${fromBank.bankName}`,
        amount,
        paymentMethod: "bank",
        personName: fromBank.bankName,
        personType: "other",
        date,
        note: body.note || "",
        refType: "bank_transfer",
        refId: transferRef,
        balanceBefore: inBefore,
        balanceAfter: toBank.currentBalance,
        status: "active",
      });

      await recalculateBankLedger(fromBank._id, tenant.companyId);
      await recalculateBankLedger(toBank._id, tenant.companyId);

      return NextResponse.json(
        {
          success: true,
          message: "Bank transfer completed",
          data: { transferOut, transferIn },
        },
        { status: 201 }
      );
    }

    if (body.action === "transaction") {
      const amount = money(body.amount);
      const type = body.type;
      const date = body.date || today();

      if (!body.bankId) {
        return NextResponse.json(
          { success: false, message: "Bank account is required" },
          { status: 400 }
        );
      }

      if (!["in", "out"].includes(type)) {
        return NextResponse.json(
          { success: false, message: "Valid transaction type is required" },
          { status: 400 }
        );
      }

      if (!body.category) {
        return NextResponse.json(
          { success: false, message: "Category is required" },
          { status: 400 }
        );
      }

      if (!body.title?.trim()) {
        return NextResponse.json(
          { success: false, message: "Title is required" },
          { status: 400 }
        );
      }

      if (amount <= 0) {
        return NextResponse.json(
          { success: false, message: "Valid amount required" },
          { status: 400 }
        );
      }

      const bank = await BankAccount.findOne({
        _id: body.bankId,
        companyId: tenant.companyId,
        status: { $ne: "inactive" },
      });

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (type === "out" && money(bank.currentBalance) < amount) {
        return NextResponse.json(
          { success: false, message: "Not enough bank balance" },
          { status: 400 }
        );
      }

      const balanceBefore = money(bank.currentBalance);
      const balanceAfter =
        type === "in" ? balanceBefore + amount : balanceBefore - amount;

      bank.currentBalance = balanceAfter;
      bank.lastTransactionAt = new Date();
      await bank.save();

      const transaction = await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        transactionNo: body.transactionNo || makeNo("BT"),
        voucherNo: body.voucherNo || "",

        bankId: bank._id,
        type,
        category: body.category,
        title: body.title.trim(),
        amount,

        paymentMethod: body.paymentMethod || "bank",
        chequeNo: body.chequeNo || "",
        transactionId: body.transactionId || "",

        personName: body.personName || "",
        personType: body.personType || "none",

        customerId: body.customerId || null,
        customerName: body.customerName || "",
        customerPhone: body.customerPhone || "",

        supplierId: body.supplierId || null,
        supplierName: body.supplierName || "",

        employeeId: body.employeeId || null,
        employeeName: body.employeeName || "",

        saleId: body.saleId || null,
        purchaseId: body.purchaseId || null,

        billNo: body.billNo || "",

        marketingOfficerId: body.marketingOfficerId || null,
        marketingOfficerName: body.marketingOfficerName || "",

        date,
        note: body.note || "",
        comment: body.comment || "",

        refType: body.refType || "manual",
        refId: body.refId || "",

        balanceBefore,
        balanceAfter,
        status: "active",
      });

      if (body.category === "cash_deposit") {
        await createCashMirror({
          tenant,
          type: "out",
          category: "bank_deposit",
          title: `Cash deposit to ${bank.bankName}`,
          amount,
          date,
          note: body.note,
          refId: transaction._id.toString(),
        });
      }

      if (body.category === "cash_withdraw") {
        await createCashMirror({
          tenant,
          type: "in",
          category: "bank_withdraw",
          title: `Cash withdraw from ${bank.bankName}`,
          amount,
          date,
          note: body.note,
          refId: transaction._id.toString(),
        });
      }

      await recalculateBankLedger(bank._id, tenant.companyId);

      return NextResponse.json(
        {
          success: true,
          message: "Bank transaction saved successfully",
          data: transaction,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("BANK_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Bank action failed",
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

    const denied = await checkAccountAccess(tenant);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const bankId = searchParams.get("bankId") || "";
    const limit = Number(searchParams.get("limit") || 1000);

    const banks = await BankAccount.find({
      companyId: tenant.companyId,
      status: { $ne: "inactive" },
    })
      .sort({ createdAt: -1 })
      .lean();

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (bankId) query.bankId = bankId;
    if (date) query.date = date;

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    if (search) {
      const regex = makeRegex(search);

      query.$or = [
        { transactionNo: regex },
        { voucherNo: regex },
        { title: regex },
        { category: regex },
        { note: regex },
        { comment: regex },
        { refType: regex },
        { refId: regex },
        { chequeNo: regex },
        { transactionId: regex },
        { personName: regex },
        { customerName: regex },
        { supplierName: regex },
        { employeeName: regex },
        { marketingOfficerName: regex },
        { paymentMethod: regex },
      ];
    }

    const transactions = await BankTransaction.find(query)
      .populate("bankId")
      .sort({ date: 1, createdAt: 1 })
      .limit(limit)
      .lean();

    const runningBalanceMap = {};

    banks.forEach((bank) => {
      runningBalanceMap[String(bank._id)] = money(bank.openingBalance);
    });

    const statementRowsAsc = transactions.map((txn) => {
      const bankKey = String(txn.bankId?._id || txn.bankId);
      const debit = txn.type === "out" ? money(txn.amount) : 0;
      const credit = txn.type === "in" ? money(txn.amount) : 0;

      runningBalanceMap[bankKey] =
        money(runningBalanceMap[bankKey]) + credit - debit;

      return {
        _id: String(txn._id),
        date: normalizeDate(txn.date || txn.createdAt),
        transactionNo: txn.transactionNo || "",
        voucherNo: txn.voucherNo || "",
        bankName: txn.bankId?.bankName || "",
        accountName: txn.bankId?.accountName || "",
        accountNo: txn.bankId?.accountNo || txn.bankId?.accountNumber || "",
        particulars: txn.title || "",
        category: txn.category || "",
        refType: txn.refType || "",
        refId: txn.refId || "",
        chequeNo: txn.chequeNo || "",
        transactionId: txn.transactionId || "",
        personName:
          txn.personName ||
          txn.customerName ||
          txn.supplierName ||
          txn.employeeName ||
          txn.marketingOfficerName ||
          "",
        personType: txn.personType || "none",
        debit,
        credit,
        balance: runningBalanceMap[bankKey],
        note: txn.note || "",
        comment: txn.comment || "",
        type: txn.type,
        amount: money(txn.amount),
        createdAt: txn.createdAt,
      };
    });

    const statementRows = [...statementRowsAsc].sort(
      (a, b) =>
        new Date(b.date || b.createdAt).getTime() -
        new Date(a.date || a.createdAt).getTime()
    );

    const totalOpeningBalance = banks.reduce(
      (sum, bank) => sum + money(bank.openingBalance),
      0
    );

    const totalBankBalance = banks.reduce(
      (sum, bank) => sum + money(bank.currentBalance),
      0
    );

    const totalIn = transactions
      .filter((txn) => txn.type === "in")
      .reduce((sum, txn) => sum + money(txn.amount), 0);

    const totalOut = transactions
      .filter((txn) => txn.type === "out")
      .reduce((sum, txn) => sum + money(txn.amount), 0);

    const todayDate = today();

    const todayIn = transactions
      .filter(
        (txn) =>
          txn.type === "in" &&
          normalizeDate(txn.date || txn.createdAt) === todayDate
      )
      .reduce((sum, txn) => sum + money(txn.amount), 0);

    const todayOut = transactions
      .filter(
        (txn) =>
          txn.type === "out" &&
          normalizeDate(txn.date || txn.createdAt) === todayDate
      )
      .reduce((sum, txn) => sum + money(txn.amount), 0);

    const statementSummary = {
      openingBalance: totalOpeningBalance,
      totalDeposit: totalIn,
      totalWithdraw: totalOut,
      netFlow: totalIn - totalOut,
      closingBalance: totalBankBalance,
      todayDeposit: todayIn,
      todayWithdraw: todayOut,
      totalAccounts: banks.length,
    };

    const cardSummary = [
      {
        key: "bankBalance",
        title: "Total Bank Balance",
        amount: totalBankBalance,
      },
      {
        key: "opening",
        title: "Opening Balance",
        amount: totalOpeningBalance,
      },
      {
        key: "todayDeposit",
        title: "Today's Deposit",
        amount: todayIn,
      },
      {
        key: "todayWithdraw",
        title: "Today's Withdraw",
        amount: todayOut,
      },
      {
        key: "totalDeposit",
        title: "Total Deposit",
        amount: totalIn,
      },
      {
        key: "totalWithdraw",
        title: "Total Withdraw",
        amount: totalOut,
      },
      {
        key: "netFlow",
        title: "Net Bank Flow",
        amount: totalIn - totalOut,
      },
      {
        key: "accounts",
        title: "Total Accounts",
        amount: banks.length,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        ...statementSummary,
        totalOpeningBalance,
        totalBankBalance,
        totalIn,
        totalOut,
        netFlow: totalIn - totalOut,

        statementSummary,
        cardSummary,

        banks,
        transactions: statementRows,
        statementRows,
      },
    });
  } catch (error) {
    console.error("BANK_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load bank data",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const denied = await checkAccountAccess(tenant);
    if (denied) return denied;

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Transaction id is required" },
        { status: 400 }
      );
    }

    const transaction = await BankTransaction.findOne({
      _id: body._id,
      companyId: tenant.companyId,
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    const bank = await BankAccount.findOne({
      _id: transaction.bankId,
      companyId: tenant.companyId,
    });

    if (!bank) {
      return NextResponse.json(
        { success: false, message: "Bank account not found" },
        { status: 404 }
      );
    }

    if (body.cancel === true) {
      if (transaction.status !== "cancelled") {
        transaction.status = "cancelled";
        transaction.cancelledAt = new Date();
        transaction.cancelledByUserId = tenant.user?.id || null;
        transaction.updatedByUserId = tenant.user?.id || null;
        transaction.updatedBy = tenant.user?.name || "";
        await transaction.save();

        await recalculateBankLedger(bank._id, tenant.companyId);
      }

      return NextResponse.json({
        success: true,
        message: "Transaction cancelled successfully",
      });
    }

    const newAmount = money(body.amount);

    if (newAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount required" },
        { status: 400 }
      );
    }

    const newType = body.type || transaction.type;

    if (!["in", "out"].includes(newType)) {
      return NextResponse.json(
        { success: false, message: "Valid transaction type required" },
        { status: 400 }
      );
    }

    transaction.type = newType;
    transaction.category = body.category || transaction.category;
    transaction.title = body.title?.trim() || transaction.title;
    transaction.amount = newAmount;
    transaction.date = body.date || transaction.date;
    transaction.note = body.note ?? transaction.note;
    transaction.comment = body.comment ?? transaction.comment;
    transaction.paymentMethod = body.paymentMethod || transaction.paymentMethod || "bank";
    transaction.chequeNo = body.chequeNo ?? transaction.chequeNo;
    transaction.transactionId = body.transactionId ?? transaction.transactionId;
    transaction.personName = body.personName ?? transaction.personName;
    transaction.personType = body.personType ?? transaction.personType;
    transaction.updatedByUserId = tenant.user?.id || null;
    transaction.updatedBy = tenant.user?.name || "";

    await transaction.save();

    const updatedBank = await recalculateBankLedger(bank._id, tenant.companyId);

    if (updatedBank && money(updatedBank.currentBalance) < 0) {
      return NextResponse.json(
        { success: false, message: "Bank balance cannot be negative" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("BANK_PATCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Transaction update failed",
      },
      { status: 500 }
    );
  }
}