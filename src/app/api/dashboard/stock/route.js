import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/models/Stock";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(date) {
  return normalizeDate(date) === todayString();
}

function isThisMonth(dateString, now = new Date()) {
  if (!dateString) return false;
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isThisYear(dateString, now = new Date()) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date.getFullYear() === now.getFullYear();
}

function itemKey(value) {
  return String(value || "").trim().toLowerCase();
}

function stockQty(stock) {
  return Number(stock.qty || stock.quantity || 0);
}

function stockCost(stock) {
  if (stock.productType === "finished_goods") {
    return Number(stock.avgProductionCost || stock.lastProductionCost || 0);
  }

  return Number(stock.avgCost || stock.lastPurchasePrice || 0);
}

function stockValue(stock) {
  const qty = stockQty(stock);
  const value = Number(stock.totalValue || 0);

  if (value > 0) return value;

  return qty * stockCost(stock);
}

function purchaseAmount(p) {
  return Number(p.grandTotal || p.total || p.subTotal || 0);
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

    try {
  await requirePermission(tenant, "inventory");
} catch (error) {
  return NextResponse.json(
    { success: false, message: error.message || "Access denied" },
    { status: 403 }
  );
}

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const lowOnly = searchParams.get("lowOnly") || "";
    const category = searchParams.get("category") || "";
    const productType = searchParams.get("productType") || "";

    const stockQuery = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (search) {
      const regex = { $regex: search, $options: "i" };

      stockQuery.$or = [
        { itemName: regex },
        { productName: regex },
        { productCode: regex },
        { code: regex },
        { sku: regex },
        { barcode: regex },
        { category: regex },
        { brand: regex },
        { model: regex },
        { supplierName: regex },
        { warehouse: regex },
        { rackNo: regex },
      ];
    }

    if (category) stockQuery.category = category;
    if (productType) stockQuery.productType = productType;

    const [stocks, purchases, sales] = await Promise.all([
      Stock.find(stockQuery).sort({ itemName: 1 }).lean(),

      Purchase.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
      }).lean(),

      Sale.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const stockPurchases = purchases.filter((p) =>
      ["stock", "inventory", "raw_material"].includes(p.purchaseType)
    );

    const purchasedItems = stockPurchases.flatMap((p) => {
      const purchaseDate = p.date || p.createdAt || "";
      const purchaseNo =
        p.purchaseNo || p.supplierBillNo || p.supplierInvoiceNo || "";

      if (Array.isArray(p.items) && p.items.length > 0) {
        return p.items.map((item) => ({
          productId: item.productId ? String(item.productId) : "",
          itemName:
            item.name ||
            item.itemName ||
            item.productName ||
            p.itemName ||
            "",
          qty: Number(item.qty || item.quantity || 0),
          unit: item.unit || p.unit || "pcs",
          price: Number(item.price || item.rate || 0),
          landedCostPerUnit: Number(item.landedCostPerUnit || item.price || 0),
          total: Number(item.total || item.amount || 0),
          supplierName: p.supplierName || "",
          supplierPhone: p.supplierPhone || "",
          billNo: purchaseNo,
          purchaseType: p.purchaseType || "stock",
          date: purchaseDate,
        }));
      }

      return [
        {
          productId: p.productId ? String(p.productId) : "",
          itemName: p.itemName || p.productName || "",
          qty: Number(p.qty || p.quantity || 0),
          unit: p.unit || "pcs",
          price: Number(p.price || p.rate || 0),
          landedCostPerUnit: Number(p.price || p.rate || 0),
          total: purchaseAmount(p),
          supplierName: p.supplierName || "",
          supplierPhone: p.supplierPhone || "",
          billNo: purchaseNo,
          purchaseType: p.purchaseType || "stock",
          date: purchaseDate,
        },
      ];
    });

    const soldItems = sales.flatMap((sale) =>
      (sale.items || [])
        .filter(
          (item) =>
            item &&
            ["stock", "Stock", "finished_goods", undefined, ""].includes(
              item.sourceType
            )
        )
        .map((item) => ({
          productId: item.productId ? String(item.productId) : "",
          itemName:
            item.name || item.itemName || item.productName || item.title || "",
          qty: Number(item.qty || item.quantity || 0),
          unit: item.unit || "pcs",
          price: Number(item.price || item.rate || 0),
          total: Number(item.total || item.amount || 0),
          costTotal: Number(item.costTotal || 0),
          profit: Number(item.profit || 0),
          customerName: sale.customerName || "",
          customerPhone: sale.customerPhone || "",
          customerAddress: sale.customerAddress || "",
          invoiceNo: sale.billNo || sale.invoiceNo || "",
          date: sale.date || sale.createdAt || "",
        }))
    );

    let filteredPurchasedItems = purchasedItems;
    let filteredSoldItems = soldItems;

    if (fromDate || toDate) {
      filteredPurchasedItems = filteredPurchasedItems.filter((p) => {
        const d = normalizeDate(p.date);
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });

      filteredSoldItems = filteredSoldItems.filter((s) => {
        const d = normalizeDate(s.date);
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    const todayStockIn = purchasedItems
      .filter((p) => isToday(p.date))
      .reduce((sum, p) => sum + Number(p.qty || 0), 0);

    const monthlyStockIn = purchasedItems
      .filter((p) => isThisMonth(p.date))
      .reduce((sum, p) => sum + Number(p.qty || 0), 0);

    const yearlyStockIn = purchasedItems
      .filter((p) => isThisYear(p.date))
      .reduce((sum, p) => sum + Number(p.qty || 0), 0);

    const todayStockOut = soldItems
      .filter((item) => isToday(item.date))
      .reduce((sum, item) => sum + Number(item.qty || 0), 0);

    const monthlyStockOut = soldItems
      .filter((item) => isThisMonth(item.date))
      .reduce((sum, item) => sum + Number(item.qty || 0), 0);

    const yearlyStockOut = soldItems
      .filter((item) => isThisYear(item.date))
      .reduce((sum, item) => sum + Number(item.qty || 0), 0);

    let enrichedStocks = stocks.map((stock) => {
      const stockId = String(stock._id);
      const stockName = itemKey(stock.itemName || stock.productName);

      const buyers = soldItems.filter((item) => {
        if (item.productId) return item.productId === stockId;
        return itemKey(item.itemName) === stockName;
      });

      const suppliers = purchasedItems.filter((item) => {
        if (item.productId) return item.productId === stockId;
        return itemKey(item.itemName) === stockName;
      });

      const totalSoldQty = buyers.reduce(
        (sum, b) => sum + Number(b.qty || 0),
        0
      );

      const totalSoldAmount = buyers.reduce(
        (sum, b) => sum + Number(b.total || 0),
        0
      );

      const totalSoldCost = buyers.reduce(
        (sum, b) => sum + Number(b.costTotal || 0),
        0
      );

      const totalSoldProfit = buyers.reduce(
        (sum, b) => sum + Number(b.profit || 0),
        0
      );

      const totalPurchasedQty = suppliers.reduce(
        (sum, p) => sum + Number(p.qty || 0),
        0
      );

      const totalPurchasedAmount = suppliers.reduce(
        (sum, p) => sum + Number(p.total || 0),
        0
      );

      const qty = stockQty(stock);
      const value = stockValue(stock);
      const cost = stockCost(stock);
      const lowStockLimit = Number(stock.lowStockLimit || 5);
      const isLowStock = qty <= lowStockLimit;

      return {
        ...stock,
        _id: String(stock._id),

        qty,
        quantity: qty,
        availableQty: Number(stock.availableQty || qty),
        avgCost: Number(stock.avgCost || 0),
        lastPurchasePrice: Number(stock.lastPurchasePrice || 0),
        avgProductionCost: Number(stock.avgProductionCost || 0),
        lastProductionCost: Number(stock.lastProductionCost || 0),
        cost,
        totalValue: value,

        buyers,
        suppliers,

        totalSoldQty,
        totalSoldAmount,
        totalSoldCost,
        totalSoldProfit,

        totalPurchasedQty,
        totalPurchasedAmount,

        isLowStock,
      };
    });

    if (lowOnly === "true") {
      enrichedStocks = enrichedStocks.filter((s) => s.isLowStock);
    }

    if (date) {
      const dateSalesNames = new Set(
        soldItems
          .filter((item) => normalizeDate(item.date) === date)
          .map((item) => itemKey(item.itemName))
      );

      const datePurchaseNames = new Set(
        purchasedItems
          .filter((item) => normalizeDate(item.date) === date)
          .map((item) => itemKey(item.itemName))
      );

      enrichedStocks = enrichedStocks.filter((stock) => {
        const key = itemKey(stock.itemName || stock.productName);
        return dateSalesNames.has(key) || datePurchaseNames.has(key);
      });
    }

    const totalPcs = enrichedStocks.reduce(
      (sum, stock) => sum + Number(stock.qty || 0),
      0
    );

    const totalValue = enrichedStocks.reduce(
      (sum, stock) => sum + Number(stock.totalValue || 0),
      0
    );

    const lowStock = enrichedStocks.filter((stock) => stock.isLowStock);

    const categoryMap = {};
    const typeMap = {};

    enrichedStocks.forEach((stock) => {
      const categoryKey = stock.category || "Uncategorized";

      if (!categoryMap[categoryKey]) {
        categoryMap[categoryKey] = {
          category: categoryKey,
          qty: 0,
          value: 0,
          count: 0,
        };
      }

      categoryMap[categoryKey].qty += Number(stock.qty || 0);
      categoryMap[categoryKey].value += Number(stock.totalValue || 0);
      categoryMap[categoryKey].count += 1;

      const typeKey = stock.productType || "trading";

      if (!typeMap[typeKey]) {
        typeMap[typeKey] = {
          productType: typeKey,
          qty: 0,
          value: 0,
          count: 0,
        };
      }

      typeMap[typeKey].qty += Number(stock.qty || 0);
      typeMap[typeKey].value += Number(stock.totalValue || 0);
      typeMap[typeKey].count += 1;
    });

    const categoryWise = Object.values(categoryMap).sort(
      (a, b) => b.value - a.value
    );

    const typeWise = Object.values(typeMap).sort((a, b) => b.value - a.value);

    return NextResponse.json({
      success: true,
      data: {
        todayStockIn,
        todayStockOut,
        monthlyStockIn,
        monthlyStockOut,
        yearlyStockIn,
        yearlyStockOut,

        todayStockPcs: totalPcs,
        todayStockValue: totalValue,
        monthlyStockPcs: totalPcs,
        monthlyStockValue: totalValue,
        yearlyStockPcs: totalPcs,
        yearlyStockValue: totalValue,

        totalPcs,
        totalValue,

        totalPurchaseQty: filteredPurchasedItems.reduce(
          (sum, p) => sum + Number(p.qty || 0),
          0
        ),
        totalSaleQty: filteredSoldItems.reduce(
          (sum, s) => sum + Number(s.qty || 0),
          0
        ),

        lowStock,
        categoryWise,
        typeWise,
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