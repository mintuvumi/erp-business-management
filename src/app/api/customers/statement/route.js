import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const customer = searchParams.get("customer") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const query = {};

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
      const grossAmount = Number(sale.grossAmount || sale.netTotal || 0);
      const vatAmount = Number(sale.vatAmount || 0);
      const aitAmount = Number(sale.aitAmount || 0);
      const netReceivable = Number(sale.netReceivable || sale.netTotal || 0);
      const paidAmount = Number(sale.paidAmount || 0);
      const dueAmount = Number(sale.dueAmount || 0);

      balance += dueAmount;

      return {
        _id: sale._id,
        date: sale.date,
        billNo: sale.billNo,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,

        grossAmount,
        vatAmount,
        aitAmount,
        netReceivable,
        paidAmount,
        dueAmount,
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
      grossTotal: rows.reduce((s, r) => s + r.grossAmount, 0),
      vatTotal: rows.reduce((s, r) => s + r.vatAmount, 0),
      aitTotal: rows.reduce((s, r) => s + r.aitAmount, 0),
      netReceivableTotal: rows.reduce((s, r) => s + r.netReceivable, 0),
      paidTotal: rows.reduce((s, r) => s + r.paidAmount, 0),
      dueTotal: rows.reduce((s, r) => s + r.dueAmount, 0),
      closingBalance: balance,
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
        message: "Failed to load customer statement",
      },
      { status: 500 }
    );
  }
}