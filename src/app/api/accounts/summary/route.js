import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import BankAccount from "@/models/BankAccount";
import Loan from "@/models/Loan";
import AccountTransaction from "@/models/AccountTransaction";

import { getTenant } from "@/lib/tenant";

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const companyFilter = {
      companyId: tenant.companyId,
    };

    const sales = await Sale.find({
      ...companyFilter,
      status: { $ne: "cancelled" },
    }).lean();

    const purchases = await Purchase.find({
      ...companyFilter,
      status: { $ne: "cancelled" },
    }).lean();

    const stocks = await Stock.find({
      ...companyFilter,
      status: "active",
    }).lean();

    const banks = await BankAccount.find({
      ...companyFilter,
      status: "active",
    }).lean();

    const loans = await Loan.find({
      ...companyFilter,
      status: { $ne: "cancelled" },
    }).lean();

    const transactions = await AccountTransaction.find({
      ...companyFilter,
      status: "active",
    }).lean();

    // =========================
    // SALES
    // =========================

    const totalSales = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.invoiceTotal || sale.netTotal || 0),
      0
    );

    const totalSalesPaid = sales.reduce(
      (sum, sale) => sum + Number(sale.paidAmount || 0),
      0
    );

    const totalSalesDue = sales.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.statementDueAmount ||
            sale.invoiceDueAmount ||
            sale.dueAmount ||
            0
        ),
      0
    );

    const totalProfit = sales.reduce(
      (sum, sale) => sum + Number(sale.totalProfit || 0),
      0
    );

    // =========================
    // PURCHASE
    // =========================

    const totalPurchase = purchases.reduce(
      (sum, purchase) =>
        sum +
        Number(
          purchase.grandTotal ||
            purchase.total ||
            0
        ),
      0
    );

    const totalPurchasePaid = purchases.reduce(
      (sum, purchase) =>
        sum + Number(purchase.paidAmount || 0),
      0
    );

    const totalPurchaseDue = purchases.reduce(
      (sum, purchase) =>
        sum + Number(purchase.dueAmount || 0),
      0
    );

    // =========================
    // RECEIVABLE
    // =========================

    const accountReceivable = totalSalesDue;

    // =========================
    // PAYABLE
    // =========================

    const accountPayable = totalPurchaseDue;

    // =========================
    // STOCK VALUE
    // =========================

    const stockValue = stocks.reduce(
      (sum, stock) =>
        sum + Number(stock.totalValue || 0),
      0
    );

    // =========================
    // CASH RECEIVE
    // =========================

    const cashReceive = transactions
      .filter(
        (t) =>
          t.direction === "in" &&
          t.receiveTo === "cash"
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    // =========================
    // CASH PAYMENT
    // =========================

    const cashPayment = transactions
      .filter(
        (t) =>
          t.direction === "out" &&
          t.paymentFrom === "cash"
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    // =========================
    // CASH TRANSFER IN
    // =========================

    const transferCashIn = transactions
      .filter(
        (t) =>
          t.direction === "transfer" &&
          t.paymentFrom === "bank" &&
          t.receiveTo === "cash"
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    // =========================
    // CASH TRANSFER OUT
    // =========================

    const transferCashOut = transactions
      .filter(
        (t) =>
          t.direction === "transfer" &&
          t.paymentFrom === "cash" &&
          t.receiveTo === "bank"
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

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

    const bankBalance = banks.reduce(
      (sum, bank) =>
        sum + Number(bank.currentBalance || 0),
      0
    );

    // =========================
    // LOAN
    // =========================

    const totalLoan = loans.reduce(
      (sum, loan) =>
        sum + Number(loan.dueAmount || 0),
      0
    );

    const loanReceive = transactions
      .filter(
        (t) =>
          t.transactionType ===
          "loan_receive"
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    const loanPayment = transactions
      .filter(
        (t) =>
          t.transactionType ===
          "loan_payment"
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

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
          t.transactionType ===
          "owner_capital"
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    // =========================
    // OTHER INCOME
    // =========================

    const otherIncome = transactions
      .filter(
        (t) =>
          t.direction === "in" &&
          ![
            "loan_receive",
            "owner_capital",
          ].includes(t.transactionType)
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    // =========================
    // TOTAL EXPENSE
    // =========================

    const totalExpense = transactions
      .filter(
        (t) =>
          t.direction === "out" &&
          ![
            "loan_payment",
          ].includes(t.transactionType)
      )
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

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
      totalAsset - totalLiability;

    return NextResponse.json({
      success: true,

      data: {
        totalSales,
        totalSalesPaid,
        totalSalesDue,

        totalPurchase,
        totalPurchasePaid,
        totalPurchaseDue,

        totalProfit,

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

        totalCustomer: sales.length,
        totalSupplier: purchases.length,

        loans,
        banks,
      },
    });
  } catch (error) {
    console.error(
      "DASHBOARD_SUMMARY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to load dashboard summary",
      },
      {
        status: 500,
      }
    );
  }
}