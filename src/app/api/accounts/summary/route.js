import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import BankAccount from "@/models/BankAccount";
import Loan from "@/models/Loan";
import AccountTransaction from "@/models/AccountTransaction";

export async function GET() {
  try {
    await connectDB();

    const sales = await Sale.find().lean();
    const purchases = await Purchase.find().lean();
    const stocks = await Stock.find().lean();
    const banks = await BankAccount.find().lean();
    const loans = await Loan.find().lean();

    const transactions = await AccountTransaction.find({
      status: "active",
    }).lean();

    // =========================
    // RECEIVABLE
    // =========================

    const accountReceivable = sales.reduce(
      (sum, sale) => sum + Number(sale.dueAmount || 0),
      0
    );

    // =========================
    // PAYABLE
    // =========================

    const accountPayable = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.dueAmount || 0),
      0
    );

    // =========================
    // STOCK VALUE
    // =========================

    const stockValue = stocks.reduce(
      (sum, stock) => sum + Number(stock.totalValue || 0),
      0
    );

    // =========================
    // CASH RECEIVE
    // =========================

    const cashReceive = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.direction === "in" &&
          t.receiveTo === "cash"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // =========================
    // CASH PAYMENT
    // =========================

    const cashPayment = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.direction === "out" &&
          t.paymentFrom === "cash"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // =========================
    // CASH TRANSFER IN
    // =========================

    const transferCashIn = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.direction === "transfer" &&
          t.paymentFrom === "bank" &&
          t.receiveTo === "cash"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // =========================
    // CASH TRANSFER OUT
    // =========================

    const transferCashOut = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.direction === "transfer" &&
          t.paymentFrom === "cash" &&
          t.receiveTo === "bank"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // =========================
    // FINAL CASH
    // =========================

    const cashInHand =
      cashReceive +
      transferCashIn -
      cashPayment -
      transferCashOut;

    // =========================
    // BANK BALANCE
    // =========================

    // IMPORTANT:
    // currentBalance already auto updated
    // from transactions route

    const bankBalance = banks.reduce(
      (sum, bank) => sum + Number(bank.currentBalance || 0),
      0
    );

    // =========================
    // LOAN
    // =========================

    const totalLoan = loans.reduce(
      (sum, loan) => sum + Number(loan.dueAmount || 0),
      0
    );

    const loanReceive = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.transactionType === "loan_receive"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const loanPayment = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.transactionType === "loan_payment"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const finalLoanDue =
      totalLoan +
      loanReceive -
      loanPayment;

    // =========================
    // OWNER CAPITAL
    // =========================

    const ownerCapital = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.transactionType === "owner_capital"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // =========================
    // OTHER INCOME
    // =========================

    const otherIncome = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.direction === "in" &&
          ![
            "loan_receive",
            "owner_capital",
          ].includes(t.transactionType)
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // =========================
    // TOTAL EXPENSE
    // =========================

    const totalExpense = transactions
      .filter(
        (t) =>
          t.status === "active" &&
          t.direction === "out" &&
          ![
            "loan_payment",
          ].includes(t.transactionType)
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // =========================
    // ASSET
    // =========================

    const totalAsset =
      accountReceivable +
      stockValue +
      cashInHand +
      bankBalance;

    // =========================
    // LIABILITY
    // =========================

    const totalLiability =
      accountPayable +
      finalLoanDue;

    // =========================
    // NET POSITION
    // =========================

    const netPosition =
      totalAsset -
      totalLiability;

    return NextResponse.json({
      success: true,

      data: {
        accountReceivable,
        accountPayable,

        stockValue,

        cashInHand,
        bankBalance,

        totalLoan: finalLoanDue,

        ownerCapital,
        otherIncome,
        totalExpense,

        totalAsset,
        totalLiability,

        netPosition,

        loans,
        banks,
      },
    });
  } catch (error) {
    console.error(
      "ACCOUNTS_SUMMARY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load accounts summary",
      },
      {
        status: 500,
      }
    );
  }
}