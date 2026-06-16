import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import Cash from "@/models/Cash";
import BankAccount from "@/models/BankAccount";
import Loan from "@/models/Loan";
import CompanySetting from "@/models/CompanySetting";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function n(value) {
  return Number(value || 0) || 0;
}

function stockQty(stock) {
  return n(stock.qty || stock.quantity);
}

function stockCost(stock) {
  if (stock.productType === "finished_goods") {
    return n(stock.avgProductionCost || stock.lastProductionCost);
  }

  return n(stock.avgCost || stock.lastPurchasePrice);
}

function stockValue(stock) {
  const saved = n(stock.totalValue);
  if (saved > 0) return saved;

  return stockQty(stock) * stockCost(stock);
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
      await requirePermission(tenant, "accounts");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Access denied" },
        { status: 403 }
      );
    }

    const companyId = tenant.companyId;

    const [settings, sales, purchases, stocks, cash, banks, loans] =
      await Promise.all([
        CompanySetting.findOne({ companyId }).lean(),

        Sale.find({
          companyId,
          status: { $ne: "cancelled" },
        }).lean(),

        Purchase.find({
          companyId,
          status: { $ne: "cancelled" },
        }).lean(),

        Stock.find({
          companyId,
          status: "active",
        }).lean(),

        Cash.findOne({ companyId }).lean(),

        BankAccount.find({
          companyId,
          status: { $ne: "inactive" },
        }).lean(),

        Loan.find({
          companyId,
          status: { $ne: "cancelled" },
        }).lean(),
      ]);

    const totalAccountReceivable = sales.reduce(
      (sum, s) => sum + n(s.statementDueAmount || s.dueAmount),
      0
    );

    const totalStockValue = stocks.reduce(
      (sum, s) => sum + stockValue(s),
      0
    );

    const cashInHand = n(cash?.currentBalance || cash?.balance);

    const totalBankBalance = banks.reduce(
      (sum, b) => sum + n(b.currentBalance || b.balance),
      0
    );

    const totalAccountPayable = purchases.reduce(
      (sum, p) => sum + n(p.dueAmount || p.purchaseDueAmount),
      0
    );

    const totalLoan = loans.reduce(
      (sum, l) =>
        sum +
        n(
          l.remainingAmount ||
            l.dueAmount ||
            l.balanceAmount ||
            l.outstandingAmount ||
            l.amount
        ),
      0
    );

    const totalAsset =
      totalAccountReceivable + totalStockValue + cashInHand + totalBankBalance;

    const totalLiability = totalAccountPayable + totalLoan;

    const netFinancialPosition = totalAsset - totalLiability;

    const message =
      netFinancialPosition >= 0
        ? "🎉 অভিনন্দন! আপনার কোম্পানির অবস্থান ভালো। নিয়মিত হিসাব রাখলে ব্যবসা আরও শক্তিশালী হবে।"
        : "💙 সাহস রাখুন। ব্যবসায় ওঠানামা থাকে। বাকি আদায়, খরচ নিয়ন্ত্রণ ও স্টক পরিকল্পনা করলে সামনে ভালো ফল আসবে।";

    return NextResponse.json({
      success: true,
      data: {
        companyName: settings?.companyName || "Company Name",
        companyAddress: settings?.companyAddress || "Company Address",
        companyPhone: settings?.companyPhone || "Phone Number",

        totalAccountReceivable,
        totalStockValue,
        cashInHand,
        totalBankBalance,

        totalAsset,

        totalAccountPayable,
        totalLoan,
        totalLiability,

        netFinancialPosition,
        message,

        banks,
        loans,
      },
    });
  } catch (error) {
    console.error("FINANCIAL_POSITION_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to load financial position" },
      { status: 500 }
    );
  }
}