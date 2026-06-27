import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import MarketingOfficer from "@/models/MarketingOfficer";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function money(value) {
  return Number(value || 0);
}

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

async function getLoggedInOfficer({ tenant, user }) {
  if (user.role !== "marketing_officer") return null;

  let officer = await MarketingOfficer.findOne({
    companyId: tenant.companyId,
    userId: tenant.user?.id,
    status: "active",
  });

  if (!officer) {
    officer = await MarketingOfficer.findOne({
      companyId: tenant.companyId,
      $or: [
        user.email ? { email: user.email } : null,
        user.phone ? { phone: user.phone } : null,
      ].filter(Boolean),
      status: "active",
    });
  }

  if (!officer) {
    officer = await MarketingOfficer.create({
      companyId: tenant.companyId,
      userId: tenant.user?.id,
      name: user.name || "Marketing Officer",
      phone: user.phone || "",
      email: user.email || "",
      photo: user.photo || user.avatar || "",
      designation: "Marketing Officer",
      status: "active",
      createdByUserId: tenant.user?.id || null,
      createdBy: user.name || "",
    });
  }

  if (!officer.userId) {
    officer.userId = tenant.user?.id;
    await officer.save();
  }

  return officer;
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

    let user;

    try {
      user = await requirePermission(tenant, "customerLedger");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Access denied" },
        { status: 403 }
      );
    }

    const officer = await getLoggedInOfficer({ tenant, user });

    const { searchParams } = new URL(req.url);

    const customer = searchParams.get("customer") || "";
    const customerId = searchParams.get("customerId") || "";
    const marketingOfficerId = searchParams.get("marketingOfficerId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const dueOnly = searchParams.get("dueOnly") || "";
    const dueToday = searchParams.get("dueToday") || "";

    const saleQuery = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (user.role === "marketing_officer") {
      saleQuery.marketingOfficerId = officer._id;
    } else if (marketingOfficerId) {
      saleQuery.marketingOfficerId = marketingOfficerId;
    }

    if (customerId) {
  saleQuery.customerId = customerId;
} else if (customer) {
  saleQuery.$or = [
    { customerName: { $regex: customer, $options: "i" } },
    { customerPhone: { $regex: customer, $options: "i" } },
    { billNo: { $regex: customer, $options: "i" } },
  ];
}


    if (from || to) {
      saleQuery.date = {};
      if (from) saleQuery.date.$gte = from;
      if (to) saleQuery.date.$lte = to;
    }

    if (dueOnly === "true") {
      saleQuery.$or = [
        ...(saleQuery.$or || []),
        { dueAmount: { $gt: 0 } },
        { statementDueAmount: { $gt: 0 } },
      ];
    }

    if (dueToday === "true") {
      saleQuery.$or = [
        ...(saleQuery.$or || []),
        { dueAmount: { $gt: 0 } },
        { statementDueAmount: { $gt: 0 } },
      ];

      saleQuery.$and = [
        ...(saleQuery.$and || []),
        {
          $or: [
            {
              nextCollectionDate: {
                $lte: new Date().toISOString().slice(0, 10),
              },
            },
            {
              "dueSchedule.nextDueDate": {
                $lte: new Date().toISOString().slice(0, 10),
              },
            },
            {
              "dueSchedule.promiseDate": {
                $lte: new Date().toISOString().slice(0, 10),
              },
            },
          ],
        },
      ];
    }

    const sales = await Sale.find(saleQuery).sort({
      date: 1,
      createdAt: 1,
    });

    const saleIds = sales.map((s) => s._id);

    const [cashCollections, bankCollections] = await Promise.all([
      CashTransaction.find({
        companyId: tenant.companyId,
        saleId: { $in: saleIds },
        category: {
          $in: ["due_collection", "customer_collection", "installment_collection"],
        },
        status: { $ne: "cancelled" },
      }).sort({ date: 1, createdAt: 1 }),

      BankTransaction.find({
        companyId: tenant.companyId,
        saleId: { $in: saleIds },
        category: {
          $in: ["due_collection", "customer_collection", "installment_collection"],
        },
        status: { $ne: "cancelled" },
      }).sort({ date: 1, createdAt: 1 }),
    ]);

    const collectionMap = {};

    [...cashCollections, ...bankCollections].forEach((txn) => {
      const key = String(txn.saleId || "");
      if (!collectionMap[key]) collectionMap[key] = [];

      collectionMap[key].push({
        _id: String(txn._id),
        date: normalizeDate(txn.date || txn.createdAt),
        source: txn.bankId ? "bank" : "cash",
        amount: money(txn.amount),
        note: txn.note || "",
        comment: txn.comment || "",
        voucherNo: txn.voucherNo || txn.transactionNo || "",
      });
    });

    let balance = 0;
    const rows = [];

    sales.forEach((sale) => {
      const salesAmount = money(
        sale.salesAmount || sale.afterDiscount || sale.baseSalesAmount || sale.subTotal
      );

      const vatAmount = money(sale.vatAmount);
      const aitAmount = money(sale.aitAmount);
      const paidAmount = money(sale.paidAmount);

      const invoiceTotal = money(
        sale.invoiceTotal || sale.netTotal || sale.total || sale.grandTotal
      );

      const netReceivable = money(
        sale.netReceivable || salesAmount - vatAmount - aitAmount || invoiceTotal
      );

      const currentDue = money(
        sale.statementDueAmount || sale.dueAmount || sale.invoiceDueAmount
      );

      balance += currentDue;

      rows.push({
        _id: String(sale._id),
        type: "sale",
        date: sale.date,
        billNo: sale.billNo || sale.invoiceNo || "",
        customerId: sale.customerId,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerAddress: sale.customerAddress || "",

        marketingOfficerId: sale.marketingOfficerId,
        marketingOfficerName: sale.marketingOfficerName,

        description: sale.note || "",

        salesAmount,
        vatAmount,
        aitAmount,
        invoiceTotal,
        netReceivable,
        paidAmount,

        currentDue,
        dueAmount: currentDue,
        balance,

        nextCollectionDate:
          sale.nextCollectionDate ||
          sale.dueSchedule?.nextDueDate ||
          sale.dueSchedule?.promiseDate ||
          "",

        collectionStatus: sale.collectionStatus || "",
        collectionComment: sale.collectionComment || "",
        lastCollectionComment: sale.lastCollectionComment || "",

        dueSchedule: sale.dueSchedule || {},
        installmentEnabled: sale.installmentEnabled,
        installmentMonths: sale.installmentMonths,
        installmentAmount: sale.installmentAmount,

        dueInterestPercent: sale.dueInterestPercent,
        dueInterestAmount: sale.dueInterestAmount,
        interestApplied: sale.interestApplied,

        collections: collectionMap[String(sale._id)] || [],

        vatDocumentReceived: sale.vatDocumentReceived,
        aitDocumentReceived: sale.aitDocumentReceived,
        vatDocumentNote: sale.vatDocumentNote,
        aitDocumentNote: sale.aitDocumentNote,

        paymentType: sale.paymentType,
        note: sale.note,
      });
    });

    const summary = {
      salesTotal: rows.reduce((s, r) => s + r.salesAmount, 0),
      vatTotal: rows.reduce((s, r) => s + r.vatAmount, 0),
      aitTotal: rows.reduce((s, r) => s + r.aitAmount, 0),
      invoiceTotal: rows.reduce((s, r) => s + r.invoiceTotal, 0),
      netReceivableTotal: rows.reduce((s, r) => s + r.netReceivable, 0),
      paidTotal: rows.reduce((s, r) => s + r.paidAmount, 0),
      currentDueTotal: rows.reduce((s, r) => s + r.currentDue, 0),
      interestTotal: rows.reduce((s, r) => s + money(r.dueInterestAmount), 0),
      closingBalance: rows.length ? rows[rows.length - 1].balance : 0,
      grossTotal: rows.reduce((s, r) => s + r.salesAmount, 0),
      dueTotal: rows.reduce((s, r) => s + r.currentDue, 0),
      totalRecords: rows.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        rows,
        summary,
        officer: officer
          ? {
              _id: officer._id,
              name: officer.name,
              phone: officer.phone,
              area: officer.area,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("CUSTOMER_STATEMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load customer statement",
      },
      { status: 500 }
    );
  }
}