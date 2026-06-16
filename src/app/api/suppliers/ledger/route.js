import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function n(value) {
  return Number(value || 0) || 0;
}

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function amountOf(p) {
  return n(p.grandTotal || p.netTotal || p.invoiceTotal || p.total || p.amount);
}

function paidOf(p) {
  return n(p.paidAmount || p.paid);
}

function dueOf(p) {
  return n(p.dueAmount || p.purchaseDueAmount);
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
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

    const { searchParams } = new URL(req.url);

    const supplier = String(searchParams.get("supplier") || "").trim();
    const supplierId = searchParams.get("supplierId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const dueOnly = searchParams.get("dueOnly") || "";

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (supplier) {
      const regex = { $regex: escapeRegex(supplier), $options: "i" };

      query.$or = [
        { purchaseNo: regex },
        { supplierName: regex },
        { supplierPhone: regex },
        { supplierAddress: regex },
        { supplierBillNo: regex },
        { supplierInvoiceNo: regex },
        { itemName: regex },
        { note: regex },
        { "items.itemName": regex },
        { "items.name": regex },
        { "items.productName": regex },
      ];
    }

    if (supplierId) query.supplierId = supplierId;

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    if (dueOnly === "true") {
      query.dueAmount = { $gt: 0 };
    }

    const purchases = await Purchase.find(query)
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const purchaseIds = purchases.map((p) => p._id);

    const [cashPayments, bankPayments] = await Promise.all([
      CashTransaction.find({
        companyId: tenant.companyId,
        purchaseId: { $in: purchaseIds },
        category: { $in: ["supplier_payment", "cash_purchase"] },
        status: { $ne: "cancelled" },
      })
        .sort({ date: 1, createdAt: 1 })
        .lean(),

      BankTransaction.find({
        companyId: tenant.companyId,
        purchaseId: { $in: purchaseIds },
        category: { $in: ["supplier_payment", "bank_payment"] },
        status: { $ne: "cancelled" },
      })
        .sort({ date: 1, createdAt: 1 })
        .lean(),
    ]);

    const paymentMap = {};

    [...cashPayments, ...bankPayments].forEach((txn) => {
      const key = String(txn.purchaseId || "");
      if (!paymentMap[key]) paymentMap[key] = [];

      paymentMap[key].push({
        _id: String(txn._id),
        date: normalizeDate(txn.date || txn.createdAt),
        source: txn.bankId ? "bank" : "cash",
        amount: n(txn.amount),
        note: txn.note || "",
        comment: txn.comment || "",
        voucherNo: txn.voucherNo || txn.transactionNo || "",
      });
    });

    let balance = 0;

    const rows = purchases.map((purchase) => {
      const total = amountOf(purchase);
      const paidAmount = paidOf(purchase);
      const dueAmount = dueOf(purchase);

      balance += dueAmount;

      return {
        _id: String(purchase._id),
        date: normalizeDate(purchase.date || purchase.createdAt),

        purchaseNo: purchase.purchaseNo || "",
        supplierBillNo: purchase.supplierBillNo || "",
        supplierInvoiceNo: purchase.supplierInvoiceNo || "",

        supplierId: purchase.supplierId || null,
        supplierName: purchase.supplierName || "Cash Supplier",
        supplierPhone: purchase.supplierPhone || "",
        supplierAddress: purchase.supplierAddress || "",

        itemName: purchase.itemName || purchase.items?.[0]?.itemName || "",
        items: purchase.items || [],

        purchaseType: purchase.purchaseType || "",
        paymentType: purchase.paymentType || "",
        paymentFrom: purchase.paymentFrom || "",

        total,
        paidAmount,
        dueAmount,
        balance,

        payments: paymentMap[String(purchase._id)] || [],

        note: purchase.note || "",
      };
    });

    const summary = {
      totalPurchase: rows.reduce((s, r) => s + n(r.total), 0),
      totalPaid: rows.reduce((s, r) => s + n(r.paidAmount), 0),
      totalDue: rows.reduce((s, r) => s + n(r.dueAmount), 0),
      closingBalance: balance,
      totalEntry: rows.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        rows,
        summary,
      },
    });
  } catch (error) {
    console.error("SUPPLIER_STATEMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load supplier statement",
      },
      { status: 500 }
    );
  }
}