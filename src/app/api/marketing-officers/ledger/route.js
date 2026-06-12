import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import Sale from "@/models/Sale";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function money(value) {
  return Number(value || 0);
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

    let user;

    try {
      user = await requirePermission(tenant, "customerLedger");
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Access denied",
        },
        { status: 403 }
      );
    }

    let loggedInOfficer = null;

    if (user.role === "marketing_officer") {
      loggedInOfficer = await MarketingOfficer.findOne({
        companyId: tenant.companyId,
        userId: tenant.user?.id,
        status: "active",
      });

      if (!loggedInOfficer) {
        return NextResponse.json(
          {
            success: false,
            message: "Marketing Officer profile not found",
          },
          { status: 404 }
        );
      }
    }

    const { searchParams } = new URL(req.url);

    const officerId = searchParams.get("officerId") || "";
    const customer = searchParams.get("customer") || "";
    const customerId = searchParams.get("customerId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const filter = {
      companyId: tenant.companyId,
    };

    if (user.role === "marketing_officer") {
      filter.marketingOfficerId = loggedInOfficer._id;
    } else if (officerId) {
      filter.marketingOfficerId = officerId;
    }

    if (customer) {
      filter.customerName = { $regex: customer, $options: "i" };
    }

    if (customerId) {
      filter.customerId = customerId;
    }

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const ledger = await MarketingOfficerLedger.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    const saleQuery = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
      dueAmount: { $gt: 0 },
    };

    if (user.role === "marketing_officer") {
      saleQuery.marketingOfficerId = loggedInOfficer._id;
    } else if (officerId) {
      saleQuery.marketingOfficerId = officerId;
    }

    if (customer) {
      saleQuery.customerName = { $regex: customer, $options: "i" };
    }

    if (customerId) {
      saleQuery.customerId = customerId;
    }

    const dueSales = await Sale.find(saleQuery)
      .select(
        "billNo customerId customerName customerPhone marketingOfficerId marketingOfficerName dueAmount statementDueAmount nextCollectionDate collectionComment dueSchedule installmentEnabled installmentMonths installmentAmount dueInterestPercent dueInterestAmount collectionStatus date"
      )
      .sort({
        nextCollectionDate: 1,
        createdAt: -1,
      });

    const summary = {
      totalSales: ledger.reduce((s, r) => s + money(r.totalSales), 0),
      totalCollection: ledger.reduce((s, r) => s + money(r.collectionAmount), 0),
      totalDue: dueSales.reduce(
        (s, r) => s + money(r.statementDueAmount || r.dueAmount),
        0
      ),
      totalProfit: ledger.reduce((s, r) => s + money(r.profitAmount), 0),
      totalEntry: ledger.length,
      dueInvoiceCount: dueSales.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        officer: loggedInOfficer
          ? {
              _id: loggedInOfficer._id,
              name: loggedInOfficer.name,
              phone: loggedInOfficer.phone,
              area: loggedInOfficer.area,
            }
          : null,
        ledger,
        dueSales,
        summary,
      },
    });
  } catch (error) {
    console.error("MARKETING_OFFICER_LEDGER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load officer ledger",
      },
      { status: 500 }
    );
  }
}