import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function isSameMonth(dateString, now = new Date()) {
  if (!dateString) return false;
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isSameYear(dateString, now = new Date()) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date.getFullYear() === now.getFullYear();
}

function saleAmount(sale) {
  return Number(
    sale.netSalesAmount ||
      sale.netReceivable ||
      sale.netTotal ||
      sale.invoiceTotal ||
      sale.total ||
      0
  );
}

function saleCost(sale) {
  return (
    Number(sale.totalCost || 0) ||
    (sale.items || []).reduce((sum, item) => {
      return sum + Number(item.costTotal || 0);
    }, 0)
  );
}

function saleProfit(sale) {
  const savedProfit = Number(sale.totalProfit || 0);
  if (savedProfit !== 0) return savedProfit;

  return saleAmount(sale) - saleCost(sale);
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
  await requirePermission(tenant, "reports");
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      message: error.message || "Access denied",
    },
    { status: 403 }
  );
}

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const customerId = searchParams.get("customerId") || "";
    const marketingOfficerId = searchParams.get("marketingOfficerId") || "";

    const now = new Date();
    const today = new Date().toISOString().slice(0, 10);

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (search) {
      const regex = { $regex: search, $options: "i" };

      query.$or = [
        { billNo: regex },
        { manualBillNo: regex },
        { invoiceNo: regex },
        { customerName: regex },
        { customerPhone: regex },
        { marketingOfficerName: regex },
        { note: regex },
        { "items.name": regex },
        { "items.itemName": regex },
        { "items.productName": regex },
      ];
    }

    if (date) query.date = date;

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    if (customerId) query.customerId = customerId;
    if (marketingOfficerId) query.marketingOfficerId = marketingOfficerId;

    const [sales, allSales] = await Promise.all([
      Sale.find(query).sort({ date: -1, createdAt: -1 }).lean(),

      Sale.find({
        companyId: tenant.companyId,
        status: { $ne: "cancelled" },
      }).lean(),
    ]);

    const summary = {
      totalSales: 0,
      totalCost: 0,
      totalProfit: 0,
      totalPaid: 0,
      totalDue: 0,
      totalInvoice: 0,
      totalVat: 0,
      totalAit: 0,
      totalDiscount: 0,
      totalEntry: allSales.length,
    };

    for (const sale of allSales) {
      summary.totalSales += saleAmount(sale);
      summary.totalCost += saleCost(sale);
      summary.totalProfit += saleProfit(sale);
      summary.totalPaid += Number(sale.paidAmount || 0);
      summary.totalDue += Number(sale.dueAmount || sale.statementDueAmount || 0);
      summary.totalInvoice += Number(sale.invoiceTotal || sale.netTotal || 0);
      summary.totalVat += Number(sale.vatAmount || 0);
      summary.totalAit += Number(sale.aitAmount || 0);
      summary.totalDiscount += Number(sale.discount || 0);
    }

    const todaySales = allSales.filter(
      (s) => normalizeDate(s.date || s.createdAt) === today
    );

    const monthlySales = allSales.filter((s) =>
      isSameMonth(s.date || s.createdAt, now)
    );

    const yearlySales = allSales.filter((s) =>
      isSameYear(s.date || s.createdAt, now)
    );

    const todayTotalSales = todaySales.reduce(
      (sum, sale) => sum + saleAmount(sale),
      0
    );

    const monthlyTotalSales = monthlySales.reduce(
      (sum, sale) => sum + saleAmount(sale),
      0
    );

    const yearlyTotalSales = yearlySales.reduce(
      (sum, sale) => sum + saleAmount(sale),
      0
    );

    const todayProfit = todaySales.reduce(
      (sum, sale) => sum + saleProfit(sale),
      0
    );

    const monthlyProfit = monthlySales.reduce(
      (sum, sale) => sum + saleProfit(sale),
      0
    );

    const yearlyProfit = yearlySales.reduce(
      (sum, sale) => sum + saleProfit(sale),
      0
    );

    const profitPercent =
      summary.totalSales > 0
        ? (summary.totalProfit / summary.totalSales) * 100
        : 0;

    const productMap = {};
    const customerMap = {};
    const officerMap = {};

    allSales.forEach((sale) => {
      const customerKey = sale.customerName || "Unknown Customer";

      if (!customerMap[customerKey]) {
        customerMap[customerKey] = {
          customerName: customerKey,
          sales: 0,
          paid: 0,
          due: 0,
          profit: 0,
          count: 0,
        };
      }

      customerMap[customerKey].sales += saleAmount(sale);
      customerMap[customerKey].paid += Number(sale.paidAmount || 0);
      customerMap[customerKey].due += Number(
        sale.dueAmount || sale.statementDueAmount || 0
      );
      customerMap[customerKey].profit += saleProfit(sale);
      customerMap[customerKey].count += 1;

      const officerKey = sale.marketingOfficerName || "No Officer";

      if (!officerMap[officerKey]) {
        officerMap[officerKey] = {
          marketingOfficerName: officerKey,
          sales: 0,
          collection: 0,
          due: 0,
          profit: 0,
          count: 0,
        };
      }

      officerMap[officerKey].sales += saleAmount(sale);
      officerMap[officerKey].collection += Number(sale.paidAmount || 0);
      officerMap[officerKey].due += Number(
        sale.dueAmount || sale.statementDueAmount || 0
      );
      officerMap[officerKey].profit += saleProfit(sale);
      officerMap[officerKey].count += 1;

      (sale.items || []).forEach((item) => {
        const key = item.name || item.itemName || item.productName || "Unknown Item";

        if (!productMap[key]) {
          productMap[key] = {
            itemName: key,
            qty: 0,
            sales: 0,
            cost: 0,
            profit: 0,
            count: 0,
          };
        }

        productMap[key].qty += Number(item.qty || item.quantity || 0);
        productMap[key].sales += Number(item.total || item.amount || 0);
        productMap[key].cost += Number(item.costTotal || 0);
        productMap[key].profit += Number(item.profit || 0);
        productMap[key].count += 1;
      });
    });

    const salesRows = sales.map((sale) => ({
      ...sale,
      _id: String(sale._id),
      totalSales: saleAmount(sale),
      totalCost: saleCost(sale),
      totalProfit: saleProfit(sale),
      date: normalizeDate(sale.date || sale.createdAt),
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        profitPercent,

        todayTotalSales,
        monthlyTotalSales,
        yearlyTotalSales,

        todayProfit,
        monthlyProfit,
        yearlyProfit,

        productWise: Object.values(productMap).sort(
          (a, b) => b.sales - a.sales
        ),

        customerWise: Object.values(customerMap).sort(
          (a, b) => b.sales - a.sales
        ),

        officerWise: Object.values(officerMap).sort(
          (a, b) => b.sales - a.sales
        ),

        sales: salesRows,
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