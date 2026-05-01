import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const id = params?.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sale invoice ID",
        },
        { status: 400 }
      );
    }

    const sale = await Sale.findById(id).lean();

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          message: "Sale invoice not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...sale,

          // safe fallback fields for invoice UI
          displayBillNo: sale.manualBillNo || sale.billNo,
          invoiceTotal:
            Number(sale.invoiceTotal || sale.grossAmount || sale.netTotal || 0),
          invoiceDueAmount:
            Number(
              sale.invoiceDueAmount ||
                Math.max(
                  Number(sale.invoiceTotal || sale.grossAmount || sale.netTotal || 0) -
                    Number(sale.paidAmount || 0),
                  0
                )
            ),
          statementDueAmount:
            Number(
              sale.statementDueAmount ||
                sale.dueAmount ||
                Math.max(
                  Number(sale.netReceivable || 0) -
                    Number(sale.paidAmount || 0),
                  0
                )
            ),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SALE_SINGLE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load sale invoice",
      },
      { status: 500 }
    );
  }
}