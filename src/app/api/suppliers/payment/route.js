import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";

import Purchase from "@/models/Purchase";
import Supplier from "@/models/Supplier";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import ChequeBook from "@/models/ChequeBook";
import ChequeRegister from "@/models/ChequeRegister";

import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
import { requireActiveSubscription } from "@/lib/subscription";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function n(value) {
  return Number(value || 0) || 0;
}

function clean(value = "") {
  return String(value || "").trim();
}

function paymentTypeOf({ paid, total }) {
  if (n(paid) <= 0) return "credit";
  if (n(paid) >= n(total)) return "cash";
  return "partial";
}

async function reduceCash({ companyId, amount }) {
  let cash = await Cash.findOne({ companyId });

  if (!cash) {
    cash = await Cash.create({
      companyId,
      currentBalance: 0,
      balance: 0,
    });
  }

  const balanceBefore = n(cash.currentBalance || cash.balance);
  const balanceAfter = balanceBefore - n(amount);

  cash.currentBalance = balanceAfter;
  cash.balance = balanceAfter;

  await cash.save();

  return { balanceBefore, balanceAfter };
}

async function reduceBank({ companyId, bankId, amount }) {
  if (!bankId) throw new Error("Bank account required");

  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
    status: { $ne: "inactive" },
  });

  if (!bank) throw new Error("Bank account not found");

  const balanceBefore = n(bank.currentBalance || bank.balance);

  if (balanceBefore < n(amount)) {
    throw new Error("Not enough bank balance");
  }

  const balanceAfter = balanceBefore - n(amount);

  bank.currentBalance = balanceAfter;
  bank.balance = balanceAfter;
  bank.lastTransactionAt = new Date();

  await bank.save();

  return { bank, balanceBefore, balanceAfter };
}

async function getAutoChequeNo({ companyId, bankId }) {
  const chequeBook = await ChequeBook.findOne({
    companyId,
    bankId,
    status: "active",
  }).sort({ createdAt: 1 });

  if (!chequeBook) {
    throw new Error("No active cheque book found for this bank");
  }

  if (n(chequeBook.nextNo) > n(chequeBook.endNo)) {
    chequeBook.status = "completed";
    await chequeBook.save();
    throw new Error("Cheque book completed. Please add new cheque book");
  }

  return {
    chequeBook,
    chequeNo: String(chequeBook.nextNo),
  };
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

async function applyPurchasePayments({ tenant, purchases, amount }) {
  let remaining = n(amount);
  const payments = [];

  for (const purchase of purchases) {
    if (remaining <= 0) break;

    const grandTotal = n(purchase.grandTotal || purchase.total);
    const oldPaid = n(purchase.paidAmount);
    const oldDue = n(purchase.dueAmount || grandTotal - oldPaid);
    const payNow = Math.min(remaining, oldDue);

    if (payNow <= 0) continue;

    const newPaid = oldPaid + payNow;
    const newDue = Math.max(grandTotal - newPaid, 0);

    purchase.paidAmount = newPaid;
    purchase.dueAmount = newDue;
    purchase.paymentType = paymentTypeOf({ paid: newPaid, total: grandTotal });
    purchase.updatedByUserId = tenant.user?.id || null;
    purchase.updatedBy = tenant.user?.name || "";

    await purchase.save();

    payments.push({
      paid: payNow,
      purchaseId: purchase._id,
      purchaseNo: purchase.purchaseNo || purchase.supplierBillNo || "",
      dueAmount: newDue,
    });

    remaining -= payNow;
  }

  return payments;
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId || !tenant?.user?.id) {
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
      await requirePermission(tenant, "purchase");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const purchaseId = clean(body.purchaseId);
    const supplierId = clean(body.supplierId);
    const supplierName = clean(body.supplierName);
    const amount = n(body.amount);
    const paymentDate = body.date || today();
    const note = clean(body.note);
    const comment = clean(body.comment || body.paymentComment || note);
    const paymentFrom = clean(body.paymentFrom || body.paymentTo || "cash");
    const bankId = body.bankId || null;
    const paymentMethod = clean(body.paymentMethod || paymentFrom);

    if (!["cash", "bank"].includes(paymentFrom)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment source" },
        { status: 400 }
      );
    }

    if (paymentFrom === "bank" && !bankId) {
      return NextResponse.json(
        { success: false, message: "Bank account required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid payment amount required" },
        { status: 400 }
      );
    }

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
      dueAmount: { $gt: 0 },
    };

    if (purchaseId) {
      if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return NextResponse.json(
          { success: false, message: "Invalid purchase id" },
          { status: 400 }
        );
      }

      query._id = purchaseId;
    } else if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        return NextResponse.json(
          { success: false, message: "Invalid supplier id" },
          { status: 400 }
        );
      }

      query.supplierId = supplierId;
    } else if (supplierName) {
      query.supplierName = { $regex: `^${supplierName}$`, $options: "i" };
    } else {
      return NextResponse.json(
        { success: false, message: "Supplier or purchase required" },
        { status: 400 }
      );
    }

    const purchases = await Purchase.find(query).sort({
      date: 1,
      createdAt: 1,
    });

    if (!purchases.length) {
      return NextResponse.json(
        { success: false, message: "No due purchase found" },
        { status: 404 }
      );
    }

    const totalDue = purchases.reduce((sum, p) => sum + n(p.dueAmount), 0);

    if (amount > totalDue) {
      return NextResponse.json(
        {
          success: false,
          message: `Supplier total due is only ৳ ${totalDue.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    const firstPurchase = purchases[0];
    const finalSupplierId =
      supplierId || purchases.find((p) => p.supplierId)?.supplierId || null;

    let autoChequeNo = body.chequeNo || "";
    let chequeBook = null;

    if (paymentFrom === "bank" && paymentMethod === "cheque") {
      const chequeInfo = await getAutoChequeNo({
        companyId: tenant.companyId,
        bankId,
      });

      chequeBook = chequeInfo.chequeBook;
      autoChequeNo = chequeInfo.chequeNo;
    }

    const payments = await applyPurchasePayments({
      tenant,
      purchases,
      amount,
    });

    let transaction = null;
    let chequeRegister = null;

    if (paymentFrom === "bank") {
      const bankInfo = await reduceBank({
        companyId: tenant.companyId,
        bankId,
        amount,
      });

      transaction = await BankTransaction.create({
        companyId: tenant.companyId,
        bankId,
        purchaseId: firstPurchase?._id || null,

        type: "out",
        category: "supplier_payment",
        title: `Supplier payment to ${
          firstPurchase?.supplierName || supplierName || "Supplier"
        }`,
        amount,

        paymentMethod: paymentMethod || "bank",
        chequeNo: paymentMethod === "cheque" ? autoChequeNo : "",
        transactionId: body.transactionId || "",

        personName: firstPurchase?.supplierName || supplierName || "",
        personType: "supplier",

        supplierId: finalSupplierId || null,
        supplierName: firstPurchase?.supplierName || supplierName || "",

        billNo:
          firstPurchase?.purchaseNo ||
          firstPurchase?.supplierBillNo ||
          `MULTI-${payments.length}`,

        date: paymentDate,
        note,
        comment,

        refType: "supplier_payment",
        refId: finalSupplierId ? String(finalSupplierId) : String(firstPurchase?._id || ""),

        balanceBefore: bankInfo.balanceBefore,
        balanceAfter: bankInfo.balanceAfter,

        status: "active",
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });

      if (paymentMethod === "cheque") {
        const existingCheque = await ChequeRegister.findOne({
          companyId: tenant.companyId,
          transactionId: String(transaction._id),
        });

        if (!existingCheque) {
          chequeRegister = await ChequeRegister.create({
            companyId: tenant.companyId,

            bankId: bankInfo.bank._id,
            bankName: bankInfo.bank.bankName || "",

            chequeNo: autoChequeNo,

            payTo: firstPurchase?.supplierName || supplierName || "Supplier",

            amount,
            chequeDate: paymentDate,

            sourceType: "supplier",
            transactionId: String(transaction._id),

            status: "pending",
            note,
          });

          await markChequeUsed(chequeBook);
        } else {
          chequeRegister = existingCheque;
        }
      }
    } else {
      const cashInfo = await reduceCash({
        companyId: tenant.companyId,
        amount,
      });

      transaction = await CashTransaction.create({
        companyId: tenant.companyId,
        purchaseId: firstPurchase?._id || null,

        type: "out",
        category: "supplier_payment",
        title: `Supplier payment to ${
          firstPurchase?.supplierName || supplierName || "Supplier"
        }`,
        amount,

        balanceBefore: cashInfo.balanceBefore,
        balanceAfter: cashInfo.balanceAfter,

        date: paymentDate,
        note,
        comment,

        refType: "supplier_payment",
        refId: finalSupplierId ? String(finalSupplierId) : String(firstPurchase?._id || ""),

        supplierId: finalSupplierId || null,
        supplierName: firstPurchase?.supplierName || supplierName || "",

        billNo:
          firstPurchase?.purchaseNo ||
          firstPurchase?.supplierBillNo ||
          `MULTI-${payments.length}`,

        paymentType: "Cash",
        paymentFrom: "cash",

        status: "active",
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });
    }

    if (finalSupplierId) {
      const supplier = await Supplier.findOne({
        _id: finalSupplierId,
        companyId: tenant.companyId,
      });

      if (supplier) {
        supplier.totalPaid = n(supplier.totalPaid) + amount;
        supplier.currentDue = Math.max(n(supplier.currentDue) - amount, 0);
        await supplier.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Supplier payment saved successfully",
      data: {
        amount,
        paidCount: payments.length,
        payments,
        remainingDue: Math.max(totalDue - amount, 0),
        transaction,
        chequeRegister,
        chequeNo: chequeRegister?.chequeNo || autoChequeNo || "",
      },
    });
  } catch (error) {
    console.error("SUPPLIER_PAYMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save supplier payment",
      },
      { status: 500 }
    );
  }
}