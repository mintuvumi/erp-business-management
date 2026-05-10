import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import { getTenant } from "@/lib/tenant";

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

    const { searchParams } = new URL(req.url);

    const supplier = searchParams.get("supplier") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (supplier) {
      query.$or = [
        { supplierName: { $regex: supplier, $options: "i" } },
        { supplierPhone: { $regex: supplier, $options: "i" } },
        { supplierBillNo: { $regex: supplier, $options: "i" } },
        { supplierInvoiceNo: { $regex: supplier, $options: "i" } },
        { itemName: { $regex: supplier, $options: "i" } },
        { purchaseNo: { $regex: supplier, $options: "i" } },
      ];
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const purchases = await Purchase.find(query).sort({
      date: 1,
      createdAt: 1,
    });

    let balance = 0;

    const rows = purchases.map((purchase) => {
      const total = Number(purchase.grandTotal || purchase.total || 0);
      const paidAmount = Number(purchase.paidAmount || 0);
      const dueAmount = Number(purchase.dueAmount || 0);

      balance += dueAmount;

      return {
        _id: purchase._id,
        date: purchase.date,

        purchaseNo: purchase.purchaseNo || "",
        supplierBillNo: purchase.supplierBillNo || "",
        supplierInvoiceNo: purchase.supplierInvoiceNo || "",

        supplierName: purchase.supplierName || "Cash Supplier",
        supplierPhone: purchase.supplierPhone || "",
        supplierAddress: purchase.supplierAddress || "",

        itemName: purchase.itemName || "",
        purchaseType: purchase.purchaseType || "",
        paymentType: purchase.paymentType || "",

        total,
        paidAmount,
        dueAmount,
        balance,

        note: purchase.note || "",
      };
    });

    const summary = {
      totalPurchase: rows.reduce((s, r) => s + Number(r.total || 0), 0),
      totalPaid: rows.reduce((s, r) => s + Number(r.paidAmount || 0), 0),
      totalDue: rows.reduce((s, r) => s + Number(r.dueAmount || 0), 0),
      closingBalance: balance,
      totalEntry: rows.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        rows,
        summary,
      },
    });
  } catch (error) {
    console.error("SUPPLIER_LEDGER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load supplier ledger",
      },
      { status: 500 }
    );
  }
}