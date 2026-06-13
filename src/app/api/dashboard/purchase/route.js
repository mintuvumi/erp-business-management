import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import { getTenant } from "@/lib/tenant";

import { requirePermission } from "@/lib/checkPermission";

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function isSameMonth(dateString, now = new Date()) {
  if (!dateString) return false;
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isSameYear(dateString, now = new Date()) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date.getFullYear() === now.getFullYear();
}

function isToday(dateString) {
  const today = new Date().toISOString().slice(0, 10);
  return normalizeDate(dateString) === today;
}

function amountOf(p) {
  return Number(
    p.grandTotal ||
      p.netTotal ||
      p.invoiceTotal ||
      p.total ||
      p.amount ||
      0
  );
}

function dueOf(p) {
  return Number(p.dueAmount || p.purchaseDueAmount || 0);
}

function paidOf(p) {
  return Number(p.paidAmount || p.paid || 0);
}

function purchaseDTO(p) {
  return {
    ...p,
    _id: String(p._id),
    totalAmount: amountOf(p),
    paidAmount: paidOf(p),
    dueAmount: dueOf(p),
    date: normalizeDate(p.date || p.createdAt),
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

    try {
  await requirePermission(tenant, "purchase");
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      message: error.message || "Access denied",
    },
    { status: 403 }
  );
}

    const user = await User.findById(tenant.user?.id).select(
  "role permissions"
);

if (
  user?.role === "marketing_officer" ||
  user?.permissions?.purchase === false
) {
  return NextResponse.json(
    {
      success: false,
      message: "Access denied",
    },
    { status: 403 }
  );
}


    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const dueOnly = searchParams.get("dueOnly") || "";
    const paymentType = searchParams.get("paymentType") || "";
    const purchaseType = searchParams.get("purchaseType") || "";

    const now = new Date();

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (search) {
      const regex = { $regex: search, $options: "i" };

      query.$or = [
        { purchaseNo: regex },
        { supplierBillNo: regex },
        { supplierInvoiceNo: regex },
        { supplierName: regex },
        { supplierPhone: regex },
        { itemName: regex },
        { paymentType: regex },
        { purchaseType: regex },
        { note: regex },
        { "items.itemName": regex },
        { "items.name": regex },
        { "items.productName": regex },
      ];
    }

    if (date) query.date = date;

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    if (supplierId) query.supplierId = supplierId;
    if (paymentType) query.paymentType = paymentType;
    if (purchaseType) query.purchaseType = purchaseType;
    if (dueOnly === "true") query.dueAmount = { $gt: 0 };

    const [purchases, allPurchases] = await Promise.all([
      Purchase.find(query)
        .populate("supplierId", "name phone address")
        .populate("bankId", "bankName accountNo accountNumber")
        .sort({ date: -1, createdAt: -1 })
        .lean(),

      Purchase.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
      }).lean(),
    ]);

    const totalPurchase = allPurchases.reduce(
      (sum, p) => sum + amountOf(p),
      0
    );

    const totalPaidPurchase = allPurchases.reduce(
      (sum, p) => sum + paidOf(p),
      0
    );

    const totalDuePurchase = allPurchases.reduce(
      (sum, p) => sum + dueOf(p),
      0
    );

    const todayPurchases = allPurchases.filter((p) =>
      isToday(p.date || p.createdAt)
    );

    const monthlyPurchases = allPurchases.filter((p) =>
      isSameMonth(p.date || p.createdAt, now)
    );

    const yearlyPurchases = allPurchases.filter((p) =>
      isSameYear(p.date || p.createdAt, now)
    );

    const todayTotalPurchase = todayPurchases.reduce(
      (sum, p) => sum + amountOf(p),
      0
    );

    const monthlyTotalPurchase = monthlyPurchases.reduce(
      (sum, p) => sum + amountOf(p),
      0
    );

    const yearlyTotalPurchase = yearlyPurchases.reduce(
      (sum, p) => sum + amountOf(p),
      0
    );

    const todayPaidPurchase = todayPurchases.reduce(
      (sum, p) => sum + paidOf(p),
      0
    );

    const monthlyPaidPurchase = monthlyPurchases.reduce(
      (sum, p) => sum + paidOf(p),
      0
    );

    const yearlyPaidPurchase = yearlyPurchases.reduce(
      (sum, p) => sum + paidOf(p),
      0
    );

    const todayDuePurchase = todayPurchases.reduce(
      (sum, p) => sum + dueOf(p),
      0
    );

    const monthlyDuePurchase = monthlyPurchases.reduce(
      (sum, p) => sum + dueOf(p),
      0
    );

    const yearlyDuePurchase = yearlyPurchases.reduce(
      (sum, p) => sum + dueOf(p),
      0
    );

    const cashPurchase = allPurchases
      .filter((p) => p.paymentFrom === "cash" || p.paymentType === "cash")
      .reduce((sum, p) => sum + paidOf(p), 0);

    const bankPurchase = allPurchases
      .filter((p) => p.paymentFrom === "bank")
      .reduce((sum, p) => sum + paidOf(p), 0);

    const supplierMap = {};
    const typeMap = {};

    allPurchases.forEach((p) => {
      const supplierKey = p.supplierName || "Unknown Supplier";

      if (!supplierMap[supplierKey]) {
        supplierMap[supplierKey] = {
          supplierName: supplierKey,
          total: 0,
          paid: 0,
          due: 0,
          count: 0,
        };
      }

      supplierMap[supplierKey].total += amountOf(p);
      supplierMap[supplierKey].paid += paidOf(p);
      supplierMap[supplierKey].due += dueOf(p);
      supplierMap[supplierKey].count += 1;

      const typeKey = p.purchaseType || "stock";

      if (!typeMap[typeKey]) {
        typeMap[typeKey] = {
          purchaseType: typeKey,
          total: 0,
          paid: 0,
          due: 0,
          count: 0,
        };
      }

      typeMap[typeKey].total += amountOf(p);
      typeMap[typeKey].paid += paidOf(p);
      typeMap[typeKey].due += dueOf(p);
      typeMap[typeKey].count += 1;
    });

    const supplierWise = Object.values(supplierMap).sort(
      (a, b) => b.due - a.due
    );

    const typeWise = Object.values(typeMap).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        totalPurchase,
        totalPaidPurchase,
        totalDuePurchase,

        todayTotalPurchase,
        monthlyTotalPurchase,
        yearlyTotalPurchase,

        todayPaidPurchase,
        monthlyPaidPurchase,
        yearlyPaidPurchase,

        todayDuePurchase,
        monthlyDuePurchase,
        yearlyDuePurchase,

        cashPurchase,
        bankPurchase,

        supplierWise,
        typeWise,
        purchases: purchases.map(purchaseDTO),
      },
    });
  } catch (error) {
    console.error("PURCHASE_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load purchase dashboard",
      },
      { status: 500 }
    );
  }
}