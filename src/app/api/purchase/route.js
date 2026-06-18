import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import Supplier from "@/models/Supplier";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
import { requireActiveSubscription } from "@/lib/subscription";

function n(value) {
  return Number(value || 0) || 0;
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

async function upsertSupplierFromPurchase({ body, tenant, purchase }) {
  const supplierName = String(body.supplierName || "").trim();
  if (!supplierName) return null;

  const supplierPhone = String(body.supplierPhone || "").trim();
  const supplierAddress = String(body.supplierAddress || "").trim();

  let supplier = await Supplier.findOne({
    companyId: tenant.companyId,
    name: { $regex: `^${escapeRegex(supplierName)}$`, $options: "i" },
    status: "active",
  });

  if (!supplier) {
    supplier = await Supplier.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
      name: supplierName,
      phone: supplierPhone,
      address: supplierAddress,
      currentDue: n(purchase.dueAmount),
      totalPurchase: n(purchase.grandTotal),
      totalPaid: n(purchase.paidAmount),
      lastPurchaseDate: purchase.date,
      status: "active",
    });
  } else {
    supplier.phone = supplierPhone || supplier.phone || "";
    supplier.address = supplierAddress || supplier.address || "";
    supplier.currentDue = n(supplier.currentDue) + n(purchase.dueAmount);
    supplier.totalPurchase = n(supplier.totalPurchase) + n(purchase.grandTotal);
    supplier.totalPaid = n(supplier.totalPaid) + n(purchase.paidAmount);
    supplier.lastPurchaseDate = purchase.date;
    await supplier.save();
  }

  return supplier;
}

async function addStockFromPurchase({ purchase }) {
  if (!["stock", "raw_material"].includes(purchase.purchaseType)) return;

  for (const item of purchase.items || []) {
    const name = item.itemName || purchase.itemName || "";
    if (!name) continue;

    const qty = n(item.qty);
    const price = n(item.landedCostPerUnit || item.price);

    let stock = await Stock.findOne({
      companyId: purchase.companyId,
      $or: [{ itemName: name }, { productName: name }],
      status: "active",
    });

    if (!stock) {
      await Stock.create({
        companyId: purchase.companyId,
        itemName: name,
        productName: name,
        qty,
        quantity: qty,
        availableQty: qty,
        avgCost: price,
        lastPurchasePrice: price,
        totalValue: qty * price,
        supplierName: purchase.supplierName || "",
        supplierPhone: purchase.supplierPhone || "",
        status: "active",
      });
    } else {
      const oldQty = n(stock.qty || stock.quantity);
      const oldCost = n(stock.avgCost || stock.lastPurchasePrice);
      const newQty = oldQty + qty;
      const avgCost = newQty > 0 ? (oldQty * oldCost + qty * price) / newQty : price;

      stock.qty = newQty;
      stock.quantity = newQty;
      stock.availableQty = newQty;
      stock.avgCost = avgCost;
      stock.lastPurchasePrice = price;
      stock.totalValue = newQty * avgCost;
      stock.supplierName = purchase.supplierName || stock.supplierName || "";
      stock.supplierPhone = purchase.supplierPhone || stock.supplierPhone || "";
      await stock.save();
    }
  }
}

async function restoreStockFromPurchase({ purchase }) {
  if (!["stock", "raw_material"].includes(purchase.purchaseType)) return;

  for (const item of purchase.items || []) {
    const name = item.itemName || purchase.itemName || "";
    if (!name) continue;

    const stock = await Stock.findOne({
      companyId: purchase.companyId,
      $or: [{ itemName: name }, { productName: name }],
      status: "active",
    });

    if (!stock) continue;

    const qty = n(item.qty);
    stock.qty = Math.max(n(stock.qty || stock.quantity) - qty, 0);
    stock.quantity = stock.qty;
    stock.availableQty = stock.qty;
    stock.totalValue = stock.qty * n(stock.avgCost || stock.lastPurchasePrice);
    await stock.save();
  }
}

async function applyPurchasePayment({ purchase, tenant }) {
  const paidAmount = n(purchase.paidAmount);
  if (paidAmount <= 0) return;

  if (purchase.paymentFrom === "bank") {
    const bank = await BankAccount.findOne({
      _id: purchase.bankId,
      companyId: tenant.companyId,
    });

    if (!bank) throw new Error("Bank account not found");

    bank.currentBalance = Math.max(n(bank.currentBalance || bank.balance) - paidAmount, 0);
    bank.balance = bank.currentBalance;
    await bank.save();

    await BankTransaction.create({
      companyId: tenant.companyId,
      bankId: bank._id,
      purchaseId: purchase._id,
      type: "out",
      category: "bank_payment",
      amount: paidAmount,
      date: purchase.date,
      title: "Purchase Payment",
      note: purchase.note || "",
      status: "active",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    return;
  }

  let cash = await Cash.findOne({ companyId: tenant.companyId });

  if (!cash) {
    cash = await Cash.create({
      companyId: tenant.companyId,
      currentBalance: 0,
      balance: 0,
    });
  }

  cash.currentBalance = Math.max(n(cash.currentBalance || cash.balance) - paidAmount, 0);
  cash.balance = cash.currentBalance;
  await cash.save();

  await CashTransaction.create({
    companyId: tenant.companyId,
    purchaseId: purchase._id,
    type: "out",
    category: "cash_purchase",
    amount: paidAmount,
    date: purchase.date,
    title: "Purchase Payment",
    note: purchase.note || "",
    status: "active",
    createdByUserId: tenant.user?.id || null,
    createdBy: tenant.user?.name || "",
  });
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    if (!tenant.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const sub = await requireActiveSubscription(tenant);
    if (!sub.ok) {
      return NextResponse.json(
        { success: false, subscriptionExpired: true, message: sub.message },
        { status: sub.status }
      );
    }

    await requirePermission(tenant, "purchase");

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get("search") || "").trim();

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      query.$or = [
        { purchaseNo: regex },
        { supplierBillNo: regex },
        { supplierName: regex },
        { supplierPhone: regex },
        { itemName: regex },
        { "items.itemName": regex },
      ];
    }

    const purchases = await Purchase.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: purchases.map((p) => ({
        ...p,
        _id: String(p._id),
        supplierId: p.supplierId ? String(p.supplierId) : "",
        bankId: p.bankId ? String(p.bankId) : "",
        date: normalizeDate(p.date || p.createdAt),
        itemName: p.itemName || p.items?.[0]?.itemName || "",
        qty: n(p.qty || p.items?.[0]?.qty),
        price: n(p.price || p.items?.[0]?.price),
        grandTotal: n(p.grandTotal || p.total),
        paidAmount: n(p.paidAmount),
        dueAmount: n(p.dueAmount),
      })),
    });
  } catch (error) {
    console.error("PURCHASE_GET_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load purchases" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    if (!tenant.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const sub = await requireActiveSubscription(tenant);
    if (!sub.ok) {
      return NextResponse.json(
        { success: false, subscriptionExpired: true, message: sub.message },
        { status: sub.status }
      );
    }

    await requirePermission(tenant, "purchase");

    const body = await req.json();

    const itemName = String(body.itemName || body.items?.[0]?.itemName || "").trim();
    const supplierName = String(body.supplierName || "").trim();

    if (!itemName) {
      return NextResponse.json({ success: false, message: "Item name required" }, { status: 400 });
    }

    if (!supplierName) {
      return NextResponse.json({ success: false, message: "Supplier name required" }, { status: 400 });
    }

    const qty = n(body.qty || body.items?.[0]?.qty || 1);
    const price = n(body.price || body.items?.[0]?.price);
    const subTotal = n(body.subTotal || qty * price);
    const discount = n(body.discount);
    const transportCost = n(body.transportCost);
    const otherCost = n(body.otherCost);
    const grandTotal = n(body.grandTotal || subTotal - discount + transportCost + otherCost);
    const paidAmount = n(body.paidAmount);
    const dueAmount = Math.max(grandTotal - paidAmount, 0);

    if (qty <= 0 || price <= 0 || grandTotal <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid item, quantity and price required" },
        { status: 400 }
      );
    }

    if (paidAmount > grandTotal) {
      return NextResponse.json(
        { success: false, message: "Paid amount cannot exceed grand total" },
        { status: 400 }
      );
    }

    const items = [
      {
        itemName,
        productId: body.items?.[0]?.productId || null,
        qty,
        price,
        landedCostPerUnit: price,
        total: qty * price,
      },
    ];

    const paymentType = dueAmount <= 0 ? "cash" : paidAmount > 0 ? "partial" : "credit";

    const purchase = await Purchase.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",

      supplierId: body.supplierId || null,
      supplierName,
      supplierPhone: body.supplierPhone || "",
      supplierAddress: body.supplierAddress || "",
      supplierBillNo: body.supplierBillNo || "",

      items,
      itemName,
      qty,
      price,
      total: subTotal,
      subTotal,
      discount,
      transportCost,
      otherCost,
      grandTotal,
      paidAmount,
      dueAmount,

      purchaseType: body.purchaseType || "stock",
      paymentType,
      paymentFrom: body.paymentFrom || "cash",
      paymentMethod: body.paymentMethod || body.paymentFrom || "cash",
      bankId: body.paymentFrom === "bank" ? body.bankId || null : null,

      date: body.date || new Date().toISOString().slice(0, 10),
      note: body.note || "",
      status: "active",
    });

    const supplier = await upsertSupplierFromPurchase({ body, tenant, purchase });

    if (supplier && !purchase.supplierId) {
      purchase.supplierId = supplier._id;
      await purchase.save();
    }

    await addStockFromPurchase({ purchase });
    await applyPurchasePayment({ purchase, tenant });

    return NextResponse.json(
      {
        success: true,
        message: "Purchase saved successfully",
        data: purchase,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PURCHASE_POST_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Purchase save failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    if (!tenant.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const sub = await requireActiveSubscription(tenant);
    if (!sub.ok) {
      return NextResponse.json(
        { success: false, subscriptionExpired: true, message: sub.message },
        { status: sub.status }
      );
    }

    await requirePermission(tenant, "purchase");

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Purchase id is required" },
        { status: 400 }
      );
    }

    const purchase = await Purchase.findOne({
      _id: body._id,
      companyId: tenant.companyId,
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, message: "Purchase not found" },
        { status: 404 }
      );
    }

    if (body.cancel === true) {
      if (purchase.status !== "cancelled") {
        await restoreStockFromPurchase({ purchase });

        await CashTransaction.updateMany(
          { companyId: tenant.companyId, purchaseId: purchase._id },
          {
            $set: {
              status: "cancelled",
              cancelledAt: new Date(),
              cancelledByUserId: tenant.user?.id || null,
            },
          }
        );

        await BankTransaction.updateMany(
          { companyId: tenant.companyId, purchaseId: purchase._id },
          {
            $set: {
              status: "cancelled",
              cancelledAt: new Date(),
              cancelledByUserId: tenant.user?.id || null,
            },
          }
        );

        purchase.status = "cancelled";
        purchase.updatedByUserId = tenant.user?.id || null;
        purchase.updatedBy = tenant.user?.name || "";
        purchase.cancelledAt = new Date();
        purchase.cancelledByUserId = tenant.user?.id || null;
        purchase.cancelReason = body.reason || "Purchase cancelled";
        await purchase.save();
      }

      return NextResponse.json({
        success: true,
        message: "Purchase cancelled successfully",
      });
    }

    if (body.supplierBillNo !== undefined) purchase.supplierBillNo = body.supplierBillNo;
    if (body.supplierName !== undefined) purchase.supplierName = body.supplierName;
    if (body.supplierPhone !== undefined) purchase.supplierPhone = body.supplierPhone;
    if (body.supplierAddress !== undefined) purchase.supplierAddress = body.supplierAddress;
    if (body.note !== undefined) purchase.note = body.note;
    if (body.date !== undefined) purchase.date = body.date;

    purchase.updatedByUserId = tenant.user?.id || null;
    purchase.updatedBy = tenant.user?.name || "";
    await purchase.save();

    return NextResponse.json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    console.error("PURCHASE_PATCH_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Purchase update failed" },
      { status: 500 }
    );
  }
}