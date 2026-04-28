import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import Loan from "@/models/Loan";

export async function GET() {
  try {
    await connectDB();

    const sales = await Sale.find();
    const purchases = await Purchase.find();
    const stocks = await Stock.find();
    const cashTransactions = await CashTransaction.find();
    const banks = await BankAccount.find();
    const loans = await Loan.find();

    const totalAccountReceivable = sales.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0
    );

    const totalStockValue = stocks.reduce(
      (sum, s) => sum + Number(s.totalValue || 0),
      0
    );

    const totalCashIn = cashTransactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalCashOut = cashTransactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const cashInHand = totalCashIn - totalCashOut;

    const totalBankBalance = banks.reduce(
      (sum, b) => sum + Number(b.currentBalance || 0),
      0
    );

    const totalAccountPayable = purchases.reduce(
      (sum, p) => sum + Number(p.dueAmount || 0),
      0
    );

    const totalLoan = loans.reduce(
      (sum, l) => sum + Number(l.dueAmount || l.amount || 0),
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
      { success: false, message: "Failed to load financial position" },
      { status: 500 }
    );
  }
}