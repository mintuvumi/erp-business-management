import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";

function moneyNumber(value) {
  return Number(value || 0);
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const customer = searchParams.get("customer") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const query = {
      status: { $ne: "cancelled" },
    };

    if (customer) {
      query.customerName = { $regex: customer, $options: "i" };
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const sales = await Sale.find(query).sort({ date: 1, createdAt: 1 });

    let balance = 0;

    const rows = sales.map((sale) => {
      const salesAmount = moneyNumber(
        sale.salesAmount || sale.afterDiscount || sale.baseSalesAmount
      );

      const vatAmount = moneyNumber(sale.vatAmount);
      const aitAmount = moneyNumber(sale.aitAmount);
      const paidAmount = moneyNumber(sale.paidAmount);

      const netReceivable = moneyNumber(
        sale.netReceivable || salesAmount - vatAmount - aitAmount
      );

      const currentDue = Math.max(netReceivable - paidAmount, 0);

      balance += currentDue;

      return {
        _id: sale._id,
        date: sale.date,
        billNo: sale.billNo,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,

        description: sale.note || "",

        salesAmount,
        vatAmount,
        aitAmount,

        netReceivable,
        paidAmount,

        currentDue,
        dueAmount: currentDue,

        balance,

        vatDocumentReceived: sale.vatDocumentReceived,
        aitDocumentReceived: sale.aitDocumentReceived,
        vatDocumentNote: sale.vatDocumentNote,
        aitDocumentNote: sale.aitDocumentNote,

        paymentType: sale.paymentType,
        note: sale.note,
      };
    });

    const summary = {
      salesTotal: rows.reduce((s, r) => s + r.salesAmount, 0),
      vatTotal: rows.reduce((s, r) => s + r.vatAmount, 0),
      aitTotal: rows.reduce((s, r) => s + r.aitAmount, 0),
      netReceivableTotal: rows.reduce((s, r) => s + r.netReceivable, 0),
      paidTotal: rows.reduce((s, r) => s + r.paidAmount, 0),
      currentDueTotal: rows.reduce((s, r) => s + r.currentDue, 0),
      closingBalance: balance,

      grossTotal: rows.reduce((s, r) => s + r.salesAmount, 0),
      dueTotal: rows.reduce((s, r) => s + r.currentDue, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        rows,
        summary,
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