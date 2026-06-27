import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import Supplier from "@/models/Supplier";
import CompanySetting from "@/models/CompanySetting";
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

function keyText(value) {
  return String(value || "").trim().toLowerCase();
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
    const supplierId = String(searchParams.get("supplierId") || "").trim();
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

    const [settings, suppliers, purchases] = await Promise.all([
      CompanySetting.findOne({ companyId: tenant.companyId }).lean(),
      Supplier.find({ companyId: tenant.companyId, status: "active" })
        .sort({ name: 1 })
        .lean(),
      Purchase.find(query).sort({ date: 1, createdAt: 1 }).lean(),
    ]);

    const supplierById = {};
    const supplierByName = {};
    const supplierByPhone = {};

    suppliers.forEach((s) => {
      const id = String(s._id);
      supplierById[id] = s;

      if (s.name) supplierByName[keyText(s.name)] = s;
      if (s.phone) supplierByPhone[keyText(s.phone)] = s;
    });

    const purchaseIds = purchases.map((p) => p._id);
    const purchaseIdStrings = purchaseIds.map((id) => String(id));

    const [cashPayments, bankPayments] = await Promise.all([
      CashTransaction.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
        category: { $in: ["supplier_payment", "cash_purchase"] },
        $or: [
          { purchaseId: { $in: purchaseIds } },
          { refId: { $in: purchaseIdStrings } },
        ],
      })
        .sort({ date: 1, createdAt: 1 })
        .lean(),

      BankTransaction.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
        category: { $in: ["supplier_payment", "bank_payment", "bank_purchase"] },
        $or: [
          { purchaseId: { $in: purchaseIds } },
          { refId: { $in: purchaseIdStrings } },
        ],
      })
        .sort({ date: 1, createdAt: 1 })
        .lean(),
    ]);

    const paymentMap = {};

    [...cashPayments, ...bankPayments].forEach((txn) => {
      const key = String(txn.purchaseId || txn.refId || "");
      if (!paymentMap[key]) paymentMap[key] = [];

      paymentMap[key].push({
        _id: String(txn._id),
        date: normalizeDate(txn.date || txn.createdAt),
        source: txn.bankId ? "bank" : "cash",
        amount: n(txn.amount),
        note: txn.note || "",
        comment: txn.comment || "",
        voucherNo: txn.voucherNo || txn.transactionNo || "",
        chequeNo: txn.chequeNo || "",
        transactionId: txn.transactionId || "",
      });
    });

    let balance = 0;

    const rows = purchases.map((purchase) => {
      const purchaseSupplierId = purchase.supplierId
        ? String(purchase.supplierId)
        : "";

      const matchedSupplier =
        supplierById[purchaseSupplierId] ||
        supplierByName[keyText(purchase.supplierName)] ||
        supplierByPhone[keyText(purchase.supplierPhone)] ||
        null;

      const finalSupplierId = matchedSupplier
        ? String(matchedSupplier._id)
        : purchaseSupplierId;

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

        supplierId: finalSupplierId,
        supplierName:
          purchase.supplierName || matchedSupplier?.name || "Cash Supplier",
        supplierPhone:
          purchase.supplierPhone || matchedSupplier?.phone || "",
        supplierAddress:
          purchase.supplierAddress || matchedSupplier?.address || "",

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

    const supplierWiseObj = {};

    rows.forEach((row) => {
      const key = row.supplierId || row.supplierName || "Cash Supplier";

      if (!supplierWiseObj[key]) {
        supplierWiseObj[key] = {
          supplierId: row.supplierId,
          supplierName: row.supplierName,
          supplierPhone: row.supplierPhone,
          supplierAddress: row.supplierAddress,
          totalPurchase: 0,
          totalPaid: 0,
          totalDue: 0,
          closingBalance: 0,
          totalEntry: 0,
        };
      }

      supplierWiseObj[key].totalPurchase += n(row.total);
      supplierWiseObj[key].totalPaid += n(row.paidAmount);
      supplierWiseObj[key].totalDue += n(row.dueAmount);
      supplierWiseObj[key].closingBalance += n(row.dueAmount);
      supplierWiseObj[key].totalEntry += 1;
    });

    const supplierWise = Object.values(supplierWiseObj).sort(
      (a, b) => b.totalDue - a.totalDue
    );

    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);

    const todayRows = rows.filter((r) => r.date === today);
    const monthRows = rows.filter((r) => r.date?.startsWith(thisMonth));

    const summary = {
      totalPurchase: rows.reduce((s, r) => s + n(r.total), 0),
      totalPaid: rows.reduce((s, r) => s + n(r.paidAmount), 0),
      totalDue: rows.reduce((s, r) => s + n(r.dueAmount), 0),
      closingBalance: rows.reduce((s, r) => s + n(r.dueAmount), 0),
      totalEntry: rows.length,

      todayPurchase: todayRows.reduce((s, r) => s + n(r.total), 0),
      todayPaid: todayRows.reduce((s, r) => s + n(r.paidAmount), 0),
      todayDue: todayRows.reduce((s, r) => s + n(r.dueAmount), 0),

      thisMonthPurchase: monthRows.reduce((s, r) => s + n(r.total), 0),
      thisMonthPaid: monthRows.reduce((s, r) => s + n(r.paidAmount), 0),
      thisMonthDue: monthRows.reduce((s, r) => s + n(r.dueAmount), 0),

      activeSuppliers: suppliers.length,
      dueSuppliers: supplierWise.filter((s) => n(s.totalDue) > 0).length,
      largestDueSupplier: supplierWise[0] || null,
    };

    return NextResponse.json({
      success: true,
      data: {
        company: {
          name: settings?.companyName || "SeeERP",
          address: settings?.companyAddress || "",
          phone: settings?.companyPhone || "",
          email: settings?.companyEmail || "",
          website: settings?.companyWebsite || "",
          logo: settings?.logo || "",
          currency: settings?.currency || "৳",
        },
        suppliers: suppliers.map((s) => ({
          ...s,
          _id: String(s._id),
        })),
        supplierWise,
        rows,
        summary,
      },
    });
  } catch (error) {
    console.error("SUPPLIER_LEDGER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load supplier ledger",
      },
      { status: 500 }
    );
  }
}