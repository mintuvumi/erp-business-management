import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/models/Stock";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";

function isToday(date) {
  return date === new Date().toISOString().slice(0, 10);
}

function isThisMonth(dateString) {
  const now = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export async function GET() {
  try {
    await connectDB();

    const stocks = await Stock.find().sort({ itemName: 1 });
    const purchases = await Purchase.find();
    const sales = await Sale.find();

    const stockPurchases = purchases.filter((p) => p.purchaseType === "stock");

    const todayStockIn = stockPurchases
      .filter((p) => isToday(p.date))
      .reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

    const monthlyStockIn = stockPurchases
      .filter((p) => isThisMonth(p.date))
      .reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

  

    const todayStockOut = sales
      .filter((sale) => isToday(sale.date))
      .flatMap((sale) =>
        (sale.items || []).filter((item) => item.sourceType === "stock")
      )
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    const monthlyStockOut = sales
      .filter((sale) => isThisMonth(sale.date))
      .flatMap((sale) =>
        (sale.items || []).filter((item) => item.sourceType === "stock")
      )
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    const totalPcs = stocks.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
    const totalValue = stocks.reduce(
      (sum, s) => sum + (Number(s.totalValue) || 0),
      0
    );

    const lowStock = stocks.filter(
      (s) => Number(s.qty || 0) <= Number(s.lowStockLimit || 5)
    );

    return NextResponse.json({
      success: true,
      data: {
        todayStockIn,
        todayStockOut,
        monthlyStockIn,
        monthlyStockOut,
        todayStockPcs: totalPcs,
        todayStockValue: totalValue,
        monthlyStockPcs: totalPcs,
        monthlyStockValue: totalValue,
        totalPcs,
        totalValue,
        lowStock,
        stocks,
      },
    });
  } catch (error) {
    console.error("STOCK_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load stock dashboard" },
      { status: 500 }
    );
  }
}