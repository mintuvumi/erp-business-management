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

    const accountReceivable = sales.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0
    );

    const accountPayable = purchases.reduce(
      (sum, p) => sum + Number(p.dueAmount || 0),
      0
    );

    const stockValue = stocks.reduce(
      (sum, s) => sum + Number(s.totalValue || 0),
      0
    );

    const cashIn = cashTransactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const cashOut = cashTransactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const cashInHand = cashIn - cashOut;

    const bankBalance = banks.reduce(
      (sum, b) => sum + Number(b.currentBalance || 0),
      0
    );

    const totalLoan = loans.reduce(
      (sum, l) => sum + Number(l.dueAmount || 0),
      0
    );

    const ownerCapital = cashTransactions
      .filter((t) => t.category === "other_income" && t.refType === "owner_capital")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const otherIncome = cashTransactions
      .filter((t) => t.category === "other_income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalAsset =
      accountReceivable + stockValue + cashInHand + bankBalance;

    const totalLiability = accountPayable + totalLoan;

    const netPosition = totalAsset - totalLiability;

    return NextResponse.json({
      success: true,
      data: {
        accountReceivable,
        accountPayable,
        stockValue,
        cashInHand,
        bankBalance,
        totalLoan,
        ownerCapital,
        otherIncome,
        totalAsset,
        totalLiability,
        netPosition,
        loans,
        banks,
      },
    });
  } catch (error) {
    console.error("ACCOUNTS_SUMMARY_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load accounts summary" },
      { status: 500 }
    );
  }
}