import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import { getTenant } from "@/lib/tenant";

async function updateBankBalance({ bankId, amount, companyId }) {
  if (!bankId) return;

  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
  });

  if (!bank) return;

  if (Number(bank.currentBalance || 0) < Number(amount || 0)) {
    throw new Error("Not enough bank balance");
  }

  bank.currentBalance = Number(bank.currentBalance || 0) - Number(amount || 0);
  await bank.save();
}

async function updateStock(items = [], purchaseType = "stock", companyId) {
  if (purchaseType !== "stock") return;

  for (const item of items) {
    const itemName = item.itemName?.trim();
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const total = qty * price;

    if (!itemName || qty <= 0) continue;

    let stock = await Stock.findOne({
      companyId,
      itemName,
    });

    if (!stock) {
      await Stock.create({
        companyId,
        itemName,
        qty,
        avgCost: price,
        totalValue: total,
      });
    } else {
      const newQty = Number(stock.qty || 0) + qty;
      const newTotalValue = Number(stock.totalValue || 0) + total;

      stock.qty = newQty;
      stock.totalValue = newTotalValue;
      stock.avgCost = newQty > 0 ? newTotalValue / newQty : 0;

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

    const body = await req.json();

    const items =
      body.items?.length > 0
        ? body.items.map((item) => ({
            itemName: item.itemName,
            productId: item.productId || null,
            qty: Number(item.qty || 0),
            price: Number(item.price || 0),
            total: Number(item.qty || 0) * Number(item.price || 0),
          }))
        : [
            {
              itemName: body.itemName,
              qty: Number(body.qty || 0),
              price: Number(body.price || 0),
              total: Number(body.qty || 0) * Number(body.price || 0),
            },
          ];

    const subTotal = items.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const discount = Number(body.discount || 0);
    const transportCost = Number(body.transportCost || 0);
    const otherCost = Number(body.otherCost || 0);
    const paidAmount = Number(body.paidAmount || 0);

    const grandTotal = subTotal - discount + transportCost + otherCost;
    const dueAmount = Math.max(grandTotal - paidAmount, 0);

    const paymentType =
      paidAmount <= 0
        ? "credit"
        : paidAmount >= grandTotal
        ? "cash"
        : "partial";

    if (!body.supplierName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Supplier name is required" },
        { status: 400 }
      );
    }

    if (!items[0]?.itemName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Item name is required" },
        { status: 400 }
      );
    }

    if (grandTotal <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid purchase amount is required" },
        { status: 400 }
      );
    }

    if (paidAmount > 0 && body.paymentFrom === "bank") {
      await updateBankBalance({
        bankId: body.bankId,
        amount: paidAmount,
        companyId: tenant.companyId,
      });
    }

    const purchase = await Purchase.create({
      ...body,

      companyId: tenant.companyId,
      createdByUserId: tenant.user.id,
      createdBy: tenant.user.name || "",

      supplierBillNo: body.supplierBillNo || "",
      supplierInvoiceNo: body.supplierInvoiceNo || "",

      supplierName: body.supplierName || "",
      supplierPhone: body.supplierPhone || "",
      supplierAddress: body.supplierAddress || "",

      items,

      itemName: items[0]?.itemName || "",
      qty: items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
      price: items[0]?.price || 0,
      total: subTotal,

      subTotal,
      discount,
      transportCost,
      otherCost,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentType,

      paymentFrom: body.paymentFrom || "cash",
      bankId: body.paymentFrom === "bank" ? body.bankId : null,
      paymentMethod: body.paymentMethod || body.paymentFrom || "cash",

      date: body.date || new Date().toISOString().slice(0, 10),
      status: "active",
    });

    await updateStock(items, body.purchaseType || "stock", tenant.companyId);

    if (paidAmount > 0) {
      await CashTransaction.create({
        companyId: tenant.companyId,
        type: "out",
        category: "cash_purchase",
        title: `Purchase payment - ${purchase.supplierName}`,
        amount: paidAmount,
        date: purchase.date,
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
      query.$or = [
        { purchaseNo: { $regex: search, $options: "i" } },
        { supplierBillNo: { $regex: search, $options: "i" } },
        { supplierInvoiceNo: { $regex: search, $options: "i" } },
        { supplierName: { $regex: search, $options: "i" } },
        { supplierPhone: { $regex: search, $options: "i" } },
        { itemName: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
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
        message: "Failed to fetch purchases",
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
      purchase.updatedByUserId = tenant.user.id;
      purchase.updatedBy = tenant.user.name || "";
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

    purchase.updatedByUserId = tenant.user.id;
    purchase.updatedBy = tenant.user.name || "";

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