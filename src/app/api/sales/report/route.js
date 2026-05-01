import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";

export async function GET(req) {
  try {
    await connectDB();

    const sales = await Sale.find();

    const summary = {
      totalSales: 0,
      totalCost: 0,
      totalProfit: 0,
    };

    for (const sale of sales) {
      summary.totalSales += Number(sale.netSalesAmount || 0);
      summary.totalCost += Number(sale.totalCost || 0);
      summary.totalProfit += Number(sale.totalProfit || 0);
    }

    const profitPercent =
      summary.totalSales > 0
        ? (summary.totalProfit / summary.totalSales) * 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        profitPercent,
      },
    });
  } catch (error) {
    console.error("SALES_REPORT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load report",
      },
      { status: 500 }
    );
  }
}