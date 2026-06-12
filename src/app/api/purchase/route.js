import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function paymentTypeOf(paidAmount, grandTotal) {
  const paid = Number(paidAmount || 0);
  const total = Number(grandTotal || 0);

  if (paid <= 0) return "credit";
  if (paid >= total) return "cash";
  return "partial";
}

function normalizeItems(body) {
  const rawItems =
    Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : [
          {
            itemName: body.itemName,
            productId: body.productId || null,
            qty: body.qty,
            price: body.price,
            unit: body.unit || "pcs",
          },
        ];

  return rawItems
    .map((item) => {
      const qty = Number(item.qty || item.quantity || 0);
      const price = Number(item.price || item.rate || 0);

      return {
        itemName: String(item.itemName || item.name || item.productName || "")
          .trim(),
        productId: item.productId || null,
        qty,
        price,
        unit: item.unit || "pcs",
        total: qty * price,
      };
    })
    .filter((item) => item.itemName && item.qty > 0);
}

async function reduceBankBalance({ bankId, amount, companyId }) {
  if (!bankId || Number(amount || 0) <= 0) return null;

  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
    status: { $ne: "inactive" },
  });

  if (!bank) {
    throw new Error("Bank account not found");
  }

  if (Number(bank.currentBalance || 0) < Number(amount || 0)) {
    throw new Error("Not enough bank balance");
  }

  const balanceBefore = Number(bank.currentBalance || 0);
  const balanceAfter = balanceBefore - Number(amount || 0);

  bank.currentBalance = balanceAfter;
  await bank.save();

  return { bank, balanceBefore, balanceAfter };
}

async function updateStockFromPurchase({
  items,
  purchase,
  purchaseType,
  companyId,
  supplierId,
  supplierName,
  user,
}) {
  if (purchaseType !== "stock" && purchaseType !== "raw_material") return;

  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const extraCost =
    Number(purchase.transportCost || 0) +
    Number(purchase.otherCost || 0) -
    Number(purchase.discount || 0);

  const extraCostPerUnit = totalQty > 0 ? extraCost / totalQty : 0;

  for (const item of items) {
    const itemName = item.itemName.trim();
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const landedCostPerUnit = Math.max(price + extraCostPerUnit, 0);
    const purchaseTotalCost = qty * landedCostPerUnit;

    if (!itemName || qty <= 0) continue;

    let stock = await Stock.findOne({
      companyId,
      itemName,
    });

    if (!stock) {
      stock = await Stock.create({
        companyId,
        itemName,
        productName: itemName,
        productType: purchaseType === "raw_material" ? "raw_material" : "trading",

        qty,
        quantity: qty,
        availableQty: qty,

        avgCost: landedCostPerUnit,
        lastPurchasePrice: price,
        lastPurchaseDate: purchase.date || today(),

        supplierName: supplierName || "",
        supplierId: supplierId || null,
        lastSupplierName: supplierName || "",
        lastSupplierId: supplierId || null,

        totalValue: purchaseTotalCost,

        createdByUserId: user?.id || null,
        createdBy: user?.name || "",
      });
    } else {
      const oldQty = Number(stock.qty || 0);
      const oldValue = Number(stock.totalValue || 0);

      const newQty = oldQty + qty;
      const newValue = oldValue + purchaseTotalCost;

      stock.qty = newQty;
      stock.quantity = newQty;
      stock.availableQty = Math.max(newQty - Number(stock.reservedQty || 0), 0);

      stock.avgCost = newQty > 0 ? newValue / newQty : 0;
      stock.lastPurchasePrice = price;
      stock.lastPurchaseDate = purchase.date || today();

      stock.supplierName = supplierName || stock.supplierName || "";
      stock.supplierId = supplierId || stock.supplierId || null;
      stock.lastSupplierName = supplierName || stock.lastSupplierName || "";
      stock.lastSupplierId = supplierId || stock.lastSupplierId || null;

      if (purchaseType === "raw_material") {
        stock.productType = "raw_material";
      }

      stock.totalValue = newQty * Number(stock.avgCost || 0);
      stock.updatedByUserId = user?.id || null;
      stock.updatedBy = user?.name || "";

      await stock.save();
    }
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

    const body = await req.json();

    if (!body.supplierName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Supplier name is required" },
        { status: 400 }
      );
    }

    const items = normalizeItems(body);

    if (!items.length) {
      return NextResponse.json(
        { success: false, message: "At least one valid item is required" },
        { status: 400 }
      );
    }

    const subTotal = items.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const discount = Number(body.discount || 0);
    const transportCost = Number(body.transportCost || 0);
    const otherCost = Number(body.otherCost || 0);
    const paidAmount = Number(body.paidAmount || 0);

    if (discount < 0 || transportCost < 0 || otherCost < 0 || paidAmount < 0) {
      return NextResponse.json(
        { success: false, message: "Negative amount is not allowed" },
        { status: 400 }
      );
    }

    const grandTotal = Math.max(
      subTotal - discount + transportCost + otherCost,
      0
    );

    if (grandTotal <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid purchase amount is required" },
        { status: 400 }
      );
    }

    if (paidAmount > grandTotal) {
      return NextResponse.json(
        { success: false, message: "Paid amount cannot exceed purchase total" },
        { status: 400 }
      );
    }

    const dueAmount = Math.max(grandTotal - paidAmount, 0);
    const paymentType = paymentTypeOf(paidAmount, grandTotal);
    const purchaseType = body.purchaseType || "stock";
    const date = body.date || today();

    let bankInfo = null;

    if (paidAmount > 0 && body.paymentFrom === "bank") {
      bankInfo = await reduceBankBalance({
        bankId: body.bankId,
        amount: paidAmount,
        companyId: tenant.companyId,
      });
    }

    const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const extraCostPerUnit =
      totalQty > 0 ? (transportCost + otherCost - discount) / totalQty : 0;

    const finalItems = items.map((item) => ({
      ...item,
      landedCostPerUnit: Math.max(
        Number(item.price || 0) + extraCostPerUnit,
        0
      ),
    }));

    const purchase = await Purchase.create({
      ...body,

      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",

      supplierId: body.supplierId || null,
      supplierBillNo: body.supplierBillNo || "",
      supplierInvoiceNo: body.supplierInvoiceNo || "",

      supplierName: body.supplierName || "",
      supplierPhone: body.supplierPhone || "",
      supplierAddress: body.supplierAddress || "",

      items: finalItems,

      itemName: finalItems[0]?.itemName || "",
      qty: totalQty,
      price: finalItems[0]?.price || 0,
      total: subTotal,

      subTotal,
      discount,
      transportCost,
      otherCost,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentType,

      purchaseType,

      paymentFrom: body.paymentFrom || "cash",
      bankId: body.paymentFrom === "bank" ? body.bankId : null,
      paymentMethod: body.paymentMethod || body.paymentFrom || "cash",
      chequeNo: body.chequeNo || "",

      date,
      note: body.note || "",
      status: "active",
    });

    await updateStockFromPurchase({
      items: finalItems,
      purchase,
      purchaseType,
      companyId: tenant.companyId,
      supplierId: body.supplierId || null,
      supplierName: body.supplierName || "",
      user: tenant.user,
    });

    if (paidAmount > 0 && body.paymentFrom === "bank") {
      await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        bankId: body.bankId,
        type: "out",
        category: "supplier_payment",
        title: `Purchase payment - ${purchase.supplierName}`,
        amount: paidAmount,

        paymentMethod: body.paymentMethod || "bank",
        chequeNo: body.chequeNo || "",
        transactionId: body.transactionId || "",

        personName: purchase.supplierName,
        personType: "supplier",

        supplierId: body.supplierId || null,
        purchaseId: purchase._id,

        date,
        note: body.note || "",

        refType: "purchase",
        refId: purchase._id.toString(),

        balanceBefore: bankInfo?.balanceBefore || 0,
        balanceAfter: bankInfo?.balanceAfter || 0,
        status: "active",
      });
    }

    if (paidAmount > 0 && body.paymentFrom !== "bank") {
      await CashTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        type: "out",
        category: "cash_purchase",
        title: `Purchase payment - ${purchase.supplierName}`,
        amount: paidAmount,
        date,
        note: body.note || "",
        refType: "purchase",
        refId: purchase._id.toString(),
      });
    }

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
      {
        success: false,
        message: error.message || "Failed to save purchase",
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

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const supplierName = searchParams.get("supplierName") || "";
    const paymentType = searchParams.get("paymentType") || "";
    const purchaseType = searchParams.get("purchaseType") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const limit = Number(searchParams.get("limit") || 500);

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (supplierName) query.supplierName = supplierName;
    if (paymentType) query.paymentType = paymentType;
    if (purchaseType) query.purchaseType = purchaseType;

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    if (search) {
      const regex = { $regex: search, $options: "i" };

      query.$or = [
        { purchaseNo: regex },
        { supplierBillNo: regex },
        { supplierInvoiceNo: regex },
        { supplierName: regex },
        { supplierPhone: regex },
        { itemName: regex },
        { note: regex },
        { "items.itemName": regex },
      ];
    }

    const purchases = await Purchase.find(query)
      .populate("supplierId", "name phone address")
      .populate("bankId", "bankName accountNo accountNumber currentBalance")
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const totalPurchase = purchases.reduce(
      (sum, item) => sum + Number(item.grandTotal || item.total || 0),
      0
    );

    const totalPaid = purchases.reduce(
      (sum, item) => sum + Number(item.paidAmount || 0),
      0
    );

    const totalDue = purchases.reduce(
      (sum, item) => sum + Number(item.dueAmount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: purchases,
      summary: {
        totalPurchase,
        totalPaid,
        totalDue,
        totalEntry: purchases.length,
      },
    });
  } catch (error) {
    console.error("PURCHASE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch purchases",
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
      purchase.status = "cancelled";
      purchase.updatedByUserId = tenant.user?.id || null;
      purchase.updatedBy = tenant.user?.name || "";
      await purchase.save();

      return NextResponse.json({
        success: true,
        message: "Purchase cancelled successfully",
      });
    }

    if (body.supplierBillNo !== undefined) {
      purchase.supplierBillNo = body.supplierBillNo;
    }

    if (body.supplierInvoiceNo !== undefined) {
      purchase.supplierInvoiceNo = body.supplierInvoiceNo;
    }

    if (body.supplierName !== undefined) {
      purchase.supplierName = body.supplierName;
    }

    if (body.supplierPhone !== undefined) {
      purchase.supplierPhone = body.supplierPhone;
    }

    if (body.supplierAddress !== undefined) {
      purchase.supplierAddress = body.supplierAddress;
    }

    if (body.note !== undefined) {
      purchase.note = body.note;
    }

    if (body.date !== undefined) {
      purchase.date = body.date;
    }

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
      {
        success: false,
        message: error.message || "Purchase update failed",
      },
      { status: 500 }
    );
  }
}