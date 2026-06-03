import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import Employee from "@/models/Employee";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import Loan from "@/models/Loan";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const regex = { $regex: q, $options: "i" };

    const [
      sales,
      purchases,
      stocks,
      employees,
      cashTransactions,
      bankAccounts,
      bankTransactions,
      salaryPayments,
      advances,
      loans,
    ] = await Promise.all([
      Sale.find({
        $or: [
          { billNo: regex },
          { customerName: regex },
          { customerPhone: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      Purchase.find({
        $or: [
          { supplierName: regex },
          { itemName: regex },
          { paymentType: regex },
          { purchaseType: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      Stock.find({
        $or: [
          { itemName: regex },
          { productName: regex },
          { barcode: regex },
          { sku: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      Employee.find({
        $or: [
          { name: regex },
          { phone: regex },
          { designation: regex },
          { bankName: regex },
          { bankAccountNo: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      CashTransaction.find({
        $or: [
          { title: regex },
          { category: regex },
          { note: regex },
          { refType: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      BankAccount.find({
        $or: [
          { bankName: regex },
          { accountName: regex },
          { accountNo: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      BankTransaction.find({
        $or: [
          { title: regex },
          { category: regex },
          { note: regex },
          { refType: regex },
        ],
      })
        .populate("bankId")
        .sort({ createdAt: -1 })
        .limit(8),

      SalaryPayment.find({
        $or: [
          { employeeName: regex },
          { month: regex },
          { paymentMethod: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      AdvanceSalary.find({
        $or: [
          { employeeName: regex },
          { paidBy: regex },
          { status: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),

      Loan.find({
        $or: [
          { lenderName: regex },
          { loanType: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    const results = [
      ...sales.map((s) => ({
        type: "sale",
        title: `Sale ${s.billNo || ""}`,
        subtitle: `${s.customerName || "Customer"} • Due ৳ ${Number(
          s.dueAmount || 0
        ).toFixed(2)}`,
        amount: Number(s.netReceivable || s.netTotal || 0),
        date: s.date,
        path: "/sales/list",
      })),

      ...purchases.map((p) => ({
        type: "purchase",
        title: `Purchase ${p.itemName || ""}`,
        subtitle: `${p.supplierName || "Supplier"} • Due ৳ ${Number(
          p.dueAmount || 0
        ).toFixed(2)}`,
        amount: Number(p.total || 0),
        date: p.date,
        path: "/suppliers/ledger",
      })),

      ...stocks.map((s) => ({
        type: "stock",
        title: s.itemName || s.productName || "Stock Item",
        subtitle: `Qty ${Number(s.qty || 0)} • Value ৳ ${Number(
          s.totalValue || 0
        ).toFixed(2)}`,
        amount: Number(s.totalValue || 0),
        date: "",
        path: "/stock",
      })),

      ...employees.map((e) => ({
        type: "employee",
        title: e.name,
        subtitle: `${e.designation || "Employee"} • Salary ৳ ${Number(
          e.basicSalary || 0
        ).toFixed(2)}`,
        amount: Number(e.basicSalary || 0),
        date: "",
        path: "/employee",
      })),

      ...cashTransactions.map((c) => ({
        type: "cash",
        title: c.title || "Cash Transaction",
        subtitle: `${c.type || ""} • ${c.category?.replaceAll("_", " ") || ""}`,
        amount: Number(c.amount || 0),
        date: c.date,
        path: "/dashboard",
      })),

      ...bankAccounts.map((b) => ({
        type: "bank",
        title: b.bankName || "Bank Account",
        subtitle: `${b.accountName || "Account"} • ${b.accountNo || ""}`,
        amount: Number(b.currentBalance || 0),
        date: "",
        path: "/bank",
      })),

      ...bankTransactions.map((b) => ({
        type: "bank_transaction",
        title: b.title || "Bank Transaction",
        subtitle: `${b.bankId?.bankName || "Bank"} • ${
          b.category?.replaceAll("_", " ") || ""
        }`,
        amount: Number(b.amount || 0),
        date: b.date,
        path: "/bank",
      })),

      ...salaryPayments.map((s) => ({
        type: "salary",
        title: `Salary ${s.employeeName || ""}`,
        subtitle: `${s.month || ""} • ${s.paymentMethod || ""}`,
        amount: Number(s.paidAmount || 0),
        date: s.date,
        path: "/salary/sheet",
      })),

      ...advances.map((a) => ({
        type: "advance_salary",
        title: `Advance ${a.employeeName || ""}`,
        subtitle: `${a.paidBy || ""} • Remaining ৳ ${Number(
          a.remainingAmount || 0
        ).toFixed(2)}`,
        amount: Number(a.amount || 0),
        date: a.date,
        path: "/employee",
      })),

      ...loans.map((l) => ({
        type: "loan",
        title: `${l.loanType || "Loan"} loan`,
        subtitle: `${l.lenderName || ""} • Due ৳ ${Number(
          l.dueAmount || 0
        ).toFixed(2)}`,
        amount: Number(l.amount || 0),
        date: l.date,
        path: "/accounts",
      })),
    ];

    return NextResponse.json({
      success: true,
      data: results.slice(0, 40),
    });
  } catch (error) {
    console.error("GLOBAL_SEARCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Search failed",
        data: [],
      },
      { status: 500 }
    );
  }
}