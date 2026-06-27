import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";

import Purchase from "@/models/Purchase";
import Supplier from "@/models/Supplier";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";

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
  const balanceAfter = balanceBefore - n(amount);

  bank.currentBalance = balanceAfter;
  bank.balance = balanceAfter;

  await bank.save();

  return { bank, balanceBefore, balanceAfter };
}

async function saveOnePayment({
  tenant,
  purchase,
  amount,
  paymentDate,
  note,
  comment,
  paymentFrom,
  bankId,
  paymentMethod,
  chequeNo,
  transactionId,
}) {
  const grandTotal = n(purchase.grandTotal || purchase.total);
  const oldPaid = n(purchase.paidAmount);
  const oldDue = n(purchase.dueAmount || grandTotal - oldPaid);
  const payNow = Math.min(n(amount), oldDue);

  if (payNow <= 0) return { paid: 0 };

  const newPaid = oldPaid + payNow;
  const newDue = Math.max(grandTotal - newPaid, 0);

  purchase.paidAmount = newPaid;
  purchase.dueAmount = newDue;
  purchase.paymentType = paymentTypeOf({ paid: newPaid, total: grandTotal });
  purchase.updatedByUserId = tenant.user?.id || null;
  purchase.updatedBy = tenant.user?.name || "";
  await purchase.save();

  let transaction = null;

  if (paymentFrom === "bank") {
    const bankInfo = await reduceBank({
      companyId: tenant.companyId,
      bankId,
      amount: payNow,
    });

    transaction = await BankTransaction.create({
      companyId: tenant.companyId,
      bankId,
      purchaseId: purchase._id,

      type: "out",
      category: "supplier_payment",
      title: `Supplier payment to ${purchase.supplierName || "Supplier"}`,
      amount: payNow,

      paymentMethod: paymentMethod || "bank",
      chequeNo: chequeNo || "",
      transactionId: transactionId || "",

      personName: purchase.supplierName || "",
      personType: "supplier",

      supplierId: purchase.supplierId || null,
      supplierName: purchase.supplierName || "",

      billNo: purchase.purchaseNo || purchase.supplierBillNo || "",
      date: paymentDate,
      note,
      comment,

      refType: "supplier_payment",
      refId: purchase._id.toString(),

      balanceBefore: bankInfo.balanceBefore,
      balanceAfter: bankInfo.balanceAfter,

      status: "active",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });
  } else {
    const cashInfo = await reduceCash({
      companyId: tenant.companyId,
      amount: payNow,
    });

    transaction = await CashTransaction.create({
      companyId: tenant.companyId,
      purchaseId: purchase._id,

      type: "out",
      category: "supplier_payment",
      title: `Supplier payment to ${purchase.supplierName || "Supplier"}`,
      amount: payNow,

      balanceBefore: cashInfo.balanceBefore,
      balanceAfter: cashInfo.balanceAfter,

      date: paymentDate,
      note,
      comment,

      refType: "supplier_payment",
      refId: purchase._id.toString(),

      supplierId: purchase.supplierId || null,
      supplierName: purchase.supplierName || "",

      billNo: purchase.purchaseNo || purchase.supplierBillNo || "",
      paymentType: "Cash",
      paymentFrom: "cash",

      status: "active",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });
  }

  return {
    paid: payNow,
    purchaseId: purchase._id,
    dueAmount: newDue,
    transactionId: transaction?._id || null,
  };
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

    if (!["cash", "bank"].includes(paymentFrom)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
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

    let remaining = amount;
    const payments = [];

    for (const purchase of purchases) {
      if (remaining <= 0) break;

      const paid = Math.min(remaining, n(purchase.dueAmount));

      const result = await saveOnePayment({
        tenant,
        purchase,
        amount: paid,
        paymentDate,
        note,
        comment,
        paymentFrom,
        bankId,
        paymentMethod: body.paymentMethod || paymentFrom,
        chequeNo: body.chequeNo || "",
        transactionId: body.transactionId || "",
      });

      if (result.paid > 0) {
        payments.push(result);
        remaining -= result.paid;
      }
    }

    const finalSupplierId =
      supplierId || purchases.find((p) => p.supplierId)?.supplierId || null;

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