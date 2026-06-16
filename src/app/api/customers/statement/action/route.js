import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Stock from "@/models/Stock";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import BankAccount from "@/models/BankAccount";
import CompanySetting from "@/models/CompanySetting";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import Notification from "@/models/Notification";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function n(v) {
  return Number(v || 0) || 0;
}

async function restoreStock(sale, companyId, user) {
  for (const item of sale.items || []) {
    if (!item.productId) continue;
    if (!["stock", "finished_goods"].includes(item.sourceType)) continue;

    const stock = await Stock.findOne({
      _id: item.productId,
      companyId,
    });

    if (!stock) continue;

    const qty = n(item.qty || item.quantity);

    stock.qty = n(stock.qty || stock.quantity) + qty;
    stock.quantity = stock.qty;
    stock.availableQty = n(stock.availableQty) + qty;

    const cost =
      stock.productType === "finished_goods"
        ? n(stock.avgProductionCost || stock.lastProductionCost)
        : n(stock.avgCost || stock.lastPurchasePrice);

    stock.totalValue = n(stock.qty) * cost;
    stock.updatedByUserId = user?.id || null;
    stock.updatedBy = user?.name || "";

    await stock.save();
  }
}

async function reverseCashTransactions(sale, companyId, user) {
  const cashTransactions = await CashTransaction.find({
    companyId,
    saleId: sale._id,
    status: { $ne: "cancelled" },
  });

  if (!cashTransactions.length) return;

  let cash = await Cash.findOne({ companyId });

  if (!cash) {
    cash = await Cash.create({
      companyId,
      currentBalance: 0,
      balance: 0,
    });
  }

  for (const tx of cashTransactions) {
    if (tx.type === "in") {
      cash.currentBalance = Math.max(n(cash.currentBalance || cash.balance) - n(tx.amount), 0);
      cash.balance = cash.currentBalance;
    }

    if (tx.type === "out") {
      cash.currentBalance = n(cash.currentBalance || cash.balance) + n(tx.amount);
      cash.balance = cash.currentBalance;
    }

    tx.status = "cancelled";
    tx.cancelledAt = new Date();
    tx.cancelledByUserId = user?.id || null;
    tx.updatedByUserId = user?.id || null;
    tx.updatedBy = user?.name || "";
    tx.comment = `${tx.comment || ""} Sale cancelled/reversed`.trim();

    await tx.save();
  }

  await cash.save();
}

async function reverseBankTransactions(sale, companyId, user) {
  const bankTransactions = await BankTransaction.find({
    companyId,
    saleId: sale._id,
    status: { $ne: "cancelled" },
  });

  for (const tx of bankTransactions) {
    const bank = await BankAccount.findOne({
      _id: tx.bankId,
      companyId,
    });

    if (bank) {
      if (tx.type === "in") {
        bank.currentBalance = Math.max(n(bank.currentBalance || bank.balance) - n(tx.amount), 0);
        bank.balance = bank.currentBalance;
      }

      if (tx.type === "out") {
        bank.currentBalance = n(bank.currentBalance || bank.balance) + n(tx.amount);
        bank.balance = bank.currentBalance;
      }

      await bank.save();
    }

    tx.status = "cancelled";
    tx.cancelledAt = new Date();
    tx.cancelledByUserId = user?.id || null;
    tx.updatedByUserId = user?.id || null;
    tx.updatedBy = user?.name || "";
    tx.comment = `${tx.comment || ""} Sale cancelled/reversed`.trim();

    await tx.save();
  }
}

async function cancelMarketingOfficerLedger(sale, companyId, user) {
  await MarketingOfficerLedger.updateMany(
    {
      companyId,
      referenceType: "sale",
      referenceId: sale._id,
      status: { $ne: "cancelled" },
    },
    {
      $set: {
        status: "cancelled",
        updatedByUserId: user?.id || null,
        updatedBy: user?.name || "",
      },
    }
  );
}

async function cancelNotifications(sale, companyId) {
  await Notification.updateMany(
    {
      companyId,
      refId: sale._id,
      refType: { $in: ["sale_due", "sale", "customer_due"] },
    },
    {
      $set: {
        read: true,
        status: "cancelled",
      },
    }
  );
}

export async function POST(req) {
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
      await requirePermission(tenant, "sales");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { saleId, action, ownerPin } = body;

    if (!saleId || !["cancel", "delete"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    const settings = await CompanySetting.findOne({
      companyId: tenant.companyId,
    });

    const savedPin = String(settings?.ownerPin || "1234");

    if (!ownerPin || String(ownerPin) !== savedPin) {
      return NextResponse.json(
        { success: false, message: "Owner PIN invalid" },
        { status: 403 }
      );
    }

    const sale = await Sale.findOne({
      _id: saleId,
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found or already cancelled" },
        { status: 404 }
      );
    }

    await restoreStock(sale, tenant.companyId, tenant.user);
    await reverseCashTransactions(sale, tenant.companyId, tenant.user);
    await reverseBankTransactions(sale, tenant.companyId, tenant.user);
    await cancelMarketingOfficerLedger(sale, tenant.companyId, tenant.user);
    await cancelNotifications(sale, tenant.companyId);

    sale.status = "cancelled";
    sale.collectionStatus = "cancelled";
    sale.cancelledAt = new Date();
    sale.cancelledByUserId = tenant.user?.id || null;
    sale.updatedByUserId = tenant.user?.id || null;
    sale.updatedBy = tenant.user?.name || "";
    sale.cancelReason =
      body.reason ||
      (action === "delete"
        ? "Sale deleted/cancelled from customer statement"
        : "Sale cancelled from customer statement");

    await sale.save();

    return NextResponse.json({
      success: true,
      message:
        action === "delete"
          ? "Sale deleted/cancelled successfully"
          : "Sale cancelled successfully",
    });
  } catch (error) {
    console.error("CUSTOMER_STATEMENT_ACTION_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Action failed" },
      { status: 500 }
    );
  }
}