import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/models/Stock";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import { getTenant } from "@/lib/tenant";

function isToday(date) {
  return date === new Date().toISOString().slice(0, 10);
}

function isThisMonth(dateString) {
  if (!dateString) return false;

  const now = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
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

    const stocks = await Stock.find({
      companyId: tenant.companyId,
      status: "active",
    }).sort({ itemName: 1 });

    const purchases = await Purchase.find({
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    });

    const sales = await Sale.find({
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    }).sort({ createdAt: -1 });

    const stockPurchases = purchases.filter(
      (p) => p && p.purchaseType === "stock"
    );

    const todayStockIn = stockPurchases
      .filter((p) => isToday(p.date))
      .reduce((sum, p) => sum + Number(p.qty || 0), 0);

    const monthlyStockIn = stockPurchases
      .filter((p) => isThisMonth(p.date))
      .reduce((sum, p) => sum + Number(p.qty || 0), 0);

    const soldItems = sales.flatMap((sale) =>
      (sale.items || [])
        .filter((item) => item && item.sourceType === "stock")
        .map((item) => ({
          itemName: item.name,
          qty: Number(item.qty || 0),
          unit: item.unit || "pcs",
          price: Number(item.price || 0),
          total: Number(item.total || 0),
          customerName: sale.customerName || "",
          customerPhone: sale.customerPhone || "",
          customerAddress: sale.customerAddress || "",
          invoiceNo: sale.billNo || "",
          date: sale.date || "",
        }))
    );

    const todayStockOut = soldItems
      .filter((item) => isToday(item.date))
      .reduce((sum, item) => sum + Number(item.qty || 0), 0);

    const monthlyStockOut = soldItems
      .filter((item) => isThisMonth(item.date))
      .reduce((sum, item) => sum + Number(item.qty || 0), 0);

    const enrichedStocks = stocks.map((stock) => {
      const buyers = soldItems.filter(
        (item) =>
          String(item.itemName || "").toLowerCase() ===
          String(stock.itemName || "").toLowerCase()
      );

      const totalSoldQty = buyers.reduce(
        (sum, b) => sum + Number(b.qty || 0),
        0
      );

      const totalSoldAmount = buyers.reduce(
        (sum, b) => sum + Number(b.total || 0),
        0
      );

      return {
        ...stock.toObject(),
        buyers,
        totalSoldQty,
        totalSoldAmount,
      };
    });

    const totalPcs = stocks.reduce(
      (sum, stock) => sum + Number(stock.qty || 0),
      0
    );

    const totalValue = stocks.reduce(
      (sum, stock) => sum + Number(stock.totalValue || 0),
      0
    );

    const lowStock = enrichedStocks.filter(
      (stock) =>
        Number(stock.qty || 0) <= Number(stock.lowStockLimit || 5)
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
        stocks: enrichedStocks,
      },
    });
  } catch (error) {
    console.error("STOCK_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load stock dashboard",
      },
      { status: 500 }
    );
  }
}