import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

function n(value) {
  return Number(value || 0) || 0;
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
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

    const sub = await requireActiveSubscription(tenant);

    if (!sub.ok) {
      return NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    const phone = searchParams.get("phone") || "";
    const name = searchParams.get("name") || "";

    if (!id && !phone && !name) {
      return NextResponse.json(
        { success: false, message: "Customer id, phone or name required" },
        { status: 400 }
      );
    }

    const customerQuery = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (id && mongoose.Types.ObjectId.isValid(id)) {
      customerQuery._id = id;
    } else if (phone) {
      customerQuery.phone = phone;
    } else if (name) {
      customerQuery.name = { $regex: `^${name}$`, $options: "i" };
    }

    const customer = await Customer.findOne(customerQuery);

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    const sales = await Sale.find({
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
      $or: [
        { customerId: customer._id },
        { customerPhone: customer.phone },
        { customerName: { $regex: `^${customer.name}$`, $options: "i" } },
      ],
    }).sort({ date: -1, createdAt: -1 });

    const saleIds = sales.map((s) => s._id);

    const [cashCollections, bankCollections] = await Promise.all([
      CashTransaction.find({
        companyId: tenant.companyId,
        saleId: { $in: saleIds },
        category: {
          $in: ["due_collection", "customer_collection", "installment_collection"],
        },
        status: { $ne: "cancelled" },
      }).sort({ date: -1, createdAt: -1 }),

      BankTransaction.find({
        companyId: tenant.companyId,
        saleId: { $in: saleIds },
        category: {
          $in: ["due_collection", "customer_collection", "installment_collection"],
        },
        status: { $ne: "cancelled" },
      }).sort({ date: -1, createdAt: -1 }),
    ]);

    const collections = [...cashCollections, ...bankCollections]
      .map((txn) => ({
        _id: String(txn._id),
        date: normalizeDate(txn.date || txn.createdAt),
        source: txn.bankId ? "bank" : "cash",
        amount: n(txn.amount),
        billNo: txn.billNo || "",
        saleId: txn.saleId ? String(txn.saleId) : "",
        voucherNo: txn.voucherNo || txn.transactionNo || "",
        note: txn.note || "",
        comment: txn.comment || "",
        marketingOfficerName: txn.marketingOfficerName || "",
        createdBy: txn.createdBy || "",
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const invoices = sales.map((sale) => ({
      _id: String(sale._id),
      date: sale.date,
      billNo: sale.billNo || sale.invoiceNo || "",
      invoiceTotal: n(sale.invoiceTotal || sale.netTotal || sale.total),
      netReceivable: n(sale.netReceivable),
      paidAmount: n(sale.paidAmount),
      dueAmount: n(sale.statementDueAmount || sale.dueAmount),
      paymentType: sale.paymentType || "",
      nextCollectionDate:
        sale.nextCollectionDate ||
        sale.dueSchedule?.nextDueDate ||
        sale.dueSchedule?.promiseDate ||
        "",
      collectionStatus: sale.collectionStatus || "",
      collectionComment:
        sale.collectionComment || sale.lastCollectionComment || "",
      marketingOfficerId: sale.marketingOfficerId || null,
      marketingOfficerName: sale.marketingOfficerName || "",
      items: sale.items || [],
      note: sale.note || "",
    }));

    const summary = {
      totalInvoices: invoices.length,
      totalSales: invoices.reduce((s, r) => s + n(r.invoiceTotal), 0),
      totalReceivable: invoices.reduce((s, r) => s + n(r.netReceivable), 0),
      totalPaid: invoices.reduce((s, r) => s + n(r.paidAmount), 0),
      currentDue:
        n(customer.openingDue) +
        invoices.reduce((s, r) => s + n(r.dueAmount), 0),
      totalCollection: collections.reduce((s, r) => s + n(r.amount), 0),
      openingDue: n(customer.openingDue),
      lastSaleDate: invoices[0]?.date || customer.lastSaleDate || "",
      lastCollectionDate: collections[0]?.date || "",
    };

    return NextResponse.json({
      success: true,
      data: {
        customer,
        summary,
        invoices,
        collections,
      },
    });
  } catch (error) {
    console.error("CUSTOMER_PROFILE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load customer profile",
      },
      { status: 500 }
    );
  }
}