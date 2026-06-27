import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { verifyToken } from "@/lib/auth";

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

function cleanText(value) {
  return String(value || "").toLowerCase().trim();
}

function scoreItem(item, q) {
  const query = cleanText(q);

  const name = cleanText(item.name || item.title);
  const title = cleanText(item.title);
  const subtitle = cleanText(item.subtitle || item.subTitle);
  const type = cleanText(item.type);
  const keywords = cleanText(item.keywords);

  let score = 0;

  if (name === query) score += 500;
  if (title === query) score += 450;
  if (name.startsWith(query)) score += 350;
  if (title.startsWith(query)) score += 300;
  if (name.includes(query)) score += 200;
  if (title.includes(query)) score += 180;

  if (subtitle === query) score += 140;
  if (subtitle.startsWith(query)) score += 120;
  if (subtitle.includes(query)) score += 80;

  if (keywords === query) score += 100;
  if (keywords.startsWith(query)) score += 90;
  if (keywords.includes(query)) score += 70;

  if (type.includes(query)) score += 20;

  score += Number(item.priority || 0);

  return score;
}

export async function GET(req) {
  try {
    await connectDB();

    const token = req.cookies.get("erp_token")?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const companyId = searchParams.get("companyId");

    if (!q || !companyId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const regex = { $regex: q, $options: "i" };
    const baseFilter = { companyId };

    const [
      employees,
      sales,
      purchases,
      stocks,
      cashTransactions,
      bankAccounts,
      bankTransactions,
      salaryPayments,
      advances,
      loans,
    ] = await Promise.all([
      Employee.find({
        ...baseFilter,
        $or: [
          { name: regex },
          { phone: regex },
          { email: regex },
          { employeeId: regex },
          { designation: regex },
          { bankName: regex },
          { bankAccountNo: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(15),

      Sale.find({
        ...baseFilter,
        $or: [
          { billNo: regex },
          { invoiceNo: regex },
          { customerName: regex },
          { customerPhone: regex },
          { customerEmail: regex },
          { paymentType: regex },
          { note: regex },
          { "items.name": regex },
          { "items.itemName": regex },
          { "items.productName": regex },
          { "products.name": regex },
          { "products.itemName": regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(15),

      Purchase.find({
        ...baseFilter,
        $or: [
          { billNo: regex },
          { invoiceNo: regex },
          { supplierName: regex },
          { supplierPhone: regex },
          { itemName: regex },
          { productName: regex },
          { paymentType: regex },
          { purchaseType: regex },
          { note: regex },
          { "items.name": regex },
          { "items.itemName": regex },
          { "items.productName": regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(15),

      Stock.find({
        ...baseFilter,
        $or: [
          { itemName: regex },
          { productName: regex },
          { category: regex },
          { code: regex },
          { sku: regex },
          { barcode: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(15),

      CashTransaction.find({
        ...baseFilter,
        $or: [
          { title: regex },
          { category: regex },
          { note: regex },
          { refType: regex },
          { voucherNo: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10),

      BankAccount.find({
        ...baseFilter,
        $or: [
          { bankName: regex },
          { accountName: regex },
          { accountNo: regex },
          { branch: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10),

      BankTransaction.find({
        ...baseFilter,
        $or: [
          { title: regex },
          { category: regex },
          { note: regex },
          { refType: regex },
          { voucherNo: regex },
        ],
      })
        .populate("bankId")
        .sort({ createdAt: -1 })
        .limit(10),

      SalaryPayment.find({
        ...baseFilter,
        $or: [
          { employeeName: regex },
          { month: regex },
          { paymentMethod: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10),

      AdvanceSalary.find({
        ...baseFilter,
        $or: [
          { employeeName: regex },
          { paidBy: regex },
          { status: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10),

      Loan.find({
        ...baseFilter,
        $or: [
          { lenderName: regex },
          { loanType: regex },
          { note: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const results = [
      ...employees.map((e) => ({
        type: "Employee",
        title: e.name,
        name: e.name,
        subtitle: `${e.designation || "Employee"} • Salary ৳ ${Number(
          e.basicSalary || 0
        ).toFixed(2)}`,
        subTitle: `${e.designation || "Employee"} • Salary ৳ ${Number(
          e.basicSalary || 0
        ).toFixed(2)}`,
        keywords: `${e.name || ""} ${e.phone || ""} ${e.email || ""} ${
          e.employeeId || ""
        } ${e.designation || ""}`,
        amount: Number(e.basicSalary || 0),
        date: e.createdAt,
        route: `/employee?id=${e._id}`,
        path: `/employee?id=${e._id}`,
        priority: 300,
      })),

      ...sales.map((s) => ({
        type: "Sale",
        title: `${s.billNo || s.invoiceNo || "Sale"} - ${s.customerName || ""}`,
        name: `${s.customerName || ""}`,
        subtitle: `Bill: ${s.billNo || s.invoiceNo || "-"} • Due ৳ ${Number(
          s.dueAmount || 0
        ).toFixed(2)}`,
        subTitle: `Bill: ${s.billNo || s.invoiceNo || "-"} • Due ৳ ${Number(
          s.dueAmount || 0
        ).toFixed(2)}`,
        keywords: `${s.billNo || ""} ${s.invoiceNo || ""} ${
          s.customerName || ""
        } ${s.customerPhone || ""}`,
        amount: Number(s.netReceivable || s.netTotal || s.total || 0),
        date: s.date || s.createdAt,
        route: `/sales/list?id=${s._id}`,
        path: `/sales/list?id=${s._id}`,
        priority: 80,
      })),

      ...purchases.map((p) => ({
        type: "Purchase",
        title: `${p.billNo || p.invoiceNo || "Purchase"} - ${
          p.supplierName || p.itemName || ""
        }`,
        name: `${p.supplierName || p.itemName || ""}`,
        subtitle: `Bill: ${p.billNo || p.invoiceNo || "-"} • Due ৳ ${Number(
          p.dueAmount || 0
        ).toFixed(2)}`,
        subTitle: `Bill: ${p.billNo || p.invoiceNo || "-"} • Due ৳ ${Number(
          p.dueAmount || 0
        ).toFixed(2)}`,
        keywords: `${p.billNo || ""} ${p.invoiceNo || ""} ${
          p.supplierName || ""
        } ${p.supplierPhone || ""} ${p.itemName || ""} ${p.productName || ""}`,
        amount: Number(p.total || p.netTotal || 0),
        date: p.date || p.createdAt,
       route: p.supplierId
  ? `/suppliers/profile?id=${p.supplierId}`
  : `/suppliers/ledger?search=${encodeURIComponent(p.supplierName || "")}`,
path: p.supplierId
  ? `/suppliers/profile?id=${p.supplierId}`
  : `/suppliers/ledger?search=${encodeURIComponent(p.supplierName || "")}`,
        priority: 60,
      })),

      ...stocks.map((s) => ({
        type: "Stock",
        title: s.itemName || s.productName,
        name: s.itemName || s.productName,
        subtitle: `Qty ${Number(s.qty || 0)} • Value ৳ ${Number(
          s.totalValue || 0
        ).toFixed(2)}`,
        subTitle: `Qty ${Number(s.qty || 0)} • Value ৳ ${Number(
          s.totalValue || 0
        ).toFixed(2)}`,
        keywords: `${s.itemName || ""} ${s.productName || ""} ${
          s.category || ""
        } ${s.code || ""} ${s.sku || ""} ${s.barcode || ""}`,
        amount: Number(s.totalValue || 0),
        date: s.createdAt,
        route: `/stock?id=${s._id}`,
        path: `/stock?id=${s._id}`,
        priority: 120,
      })),

      ...cashTransactions.map((c) => ({
        type: "Cash",
        title: c.title || c.voucherNo || "Cash Transaction",
        name: c.title || c.voucherNo || "Cash Transaction",
        subtitle: `${c.type || ""} • ${String(c.category || "").replaceAll(
          "_",
          " "
        )}`,
        subTitle: `${c.type || ""} • ${String(c.category || "").replaceAll(
          "_",
          " "
        )}`,
        keywords: `${c.title || ""} ${c.voucherNo || ""} ${c.category || ""} ${
          c.note || ""
        } ${c.refType || ""}`,
        amount: Number(c.amount || 0),
        date: c.date || c.createdAt,
        route: `/cash?id=${c._id}`,
        path: `/cash?id=${c._id}`,
        priority: 40,
      })),

      ...bankAccounts.map((b) => ({
        type: "Bank",
        title: b.bankName || b.accountName,
        name: b.bankName || b.accountName,
        subtitle: `${b.accountName || "Account"} • ${b.accountNo || ""}`,
        subTitle: `${b.accountName || "Account"} • ${b.accountNo || ""}`,
        keywords: `${b.bankName || ""} ${b.accountName || ""} ${
          b.accountNo || ""
        } ${b.branch || ""}`,
        amount: Number(b.currentBalance || 0),
        date: b.createdAt,
        route: `/bank?id=${b._id}`,
        path: `/bank?id=${b._id}`,
        priority: 30,
      })),

      ...bankTransactions.map((b) => ({
        type: "Bank Transaction",
        title: b.title || b.voucherNo || "Bank Transaction",
        name: b.title || b.voucherNo || "Bank Transaction",
        subtitle: `${b.bankId?.bankName || "Bank"} • ${String(
          b.category || ""
        ).replaceAll("_", " ")}`,
        subTitle: `${b.bankId?.bankName || "Bank"} • ${String(
          b.category || ""
        ).replaceAll("_", " ")}`,
        keywords: `${b.title || ""} ${b.voucherNo || ""} ${
          b.category || ""
        } ${b.note || ""} ${b.refType || ""} ${b.bankId?.bankName || ""}`,
        amount: Number(b.amount || 0),
        date: b.date || b.createdAt,
        route: `/bank?id=${b._id}`,
        path: `/bank?id=${b._id}`,
        priority: 35,
      })),

      ...salaryPayments.map((s) => ({
        type: "Salary",
        title: `Salary ${s.employeeName}`,
        name: s.employeeName,
        subtitle: `${s.month || ""} • ${s.paymentMethod || ""}`,
        subTitle: `${s.month || ""} • ${s.paymentMethod || ""}`,
        keywords: `${s.employeeName || ""} ${s.month || ""} ${
          s.paymentMethod || ""
        } ${s.note || ""}`,
        amount: Number(s.paidAmount || 0),
        date: s.date || s.createdAt,
        route: `/salary/sheet?id=${s._id}`,
        path: `/salary/sheet?id=${s._id}`,
        priority: 25,
      })),

      ...advances.map((a) => ({
        type: "Advance Salary",
        title: `Advance ${a.employeeName}`,
        name: a.employeeName,
        subtitle: `${a.paidBy || ""} • Remaining ৳ ${Number(
          a.remainingAmount || 0
        ).toFixed(2)}`,
        subTitle: `${a.paidBy || ""} • Remaining ৳ ${Number(
          a.remainingAmount || 0
        ).toFixed(2)}`,
        keywords: `${a.employeeName || ""} ${a.paidBy || ""} ${
          a.status || ""
        } ${a.note || ""}`,
        amount: Number(a.amount || 0),
        date: a.date || a.createdAt,
        route: `/employee?id=${a.employeeId || ""}`,
        path: `/employee?id=${a.employeeId || ""}`,
        priority: 20,
      })),

      ...loans.map((l) => ({
        type: "Loan",
        title: `${l.loanType || ""} loan - ${l.lenderName || ""}`,
        name: l.lenderName || l.loanType || "Loan",
        subtitle: `${l.lenderName || ""} • Due ৳ ${Number(
          l.dueAmount || 0
        ).toFixed(2)}`,
        subTitle: `${l.lenderName || ""} • Due ৳ ${Number(
          l.dueAmount || 0
        ).toFixed(2)}`,
        keywords: `${l.lenderName || ""} ${l.loanType || ""} ${l.note || ""}`,
        amount: Number(l.amount || 0),
        date: l.date || l.createdAt,
        route: `/accounts?id=${l._id}`,
        path: `/accounts?id=${l._id}`,
        priority: 15,
      })),
    ];

    const sorted = results
      .map((item) => ({
        ...item,
        score: scoreItem(item, q),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        const aDate = new Date(a.date || 0).getTime();
        const bDate = new Date(b.date || 0).getTime();

        return bDate - aDate;
      });

    return NextResponse.json({
      success: true,
      data: sorted.slice(0, 50),
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