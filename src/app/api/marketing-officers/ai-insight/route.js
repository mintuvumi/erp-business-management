import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
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

    const officers = await MarketingOfficer.find({
      companyId: tenant.companyId,
      status: "active",
    });

    const ledger = await MarketingOfficerLedger.find({
      companyId: tenant.companyId,
    });

    const summaries = officers.map((officer) => {
      const rows = ledger.filter(
        (x) => String(x.marketingOfficerId) === String(officer._id)
      );

      const totalSales = rows.reduce((s, x) => s + Number(x.totalSales || 0), 0);
      const collection = rows.reduce((s, x) => s + Number(x.collectionAmount || 0), 0);
      const due = rows.reduce((s, x) => s + Number(x.dueAmount || 0), 0);
      const profit = rows.reduce((s, x) => s + Number(x.profitAmount || 0), 0);
      const expense =
        rows.reduce((s, x) => s + Number(x.expenseAmount || 0), 0) +
        rows.reduce((s, x) => s + Number(x.salaryAmount || 0), 0) +
        rows.reduce((s, x) => s + Number(x.conveyanceAmount || 0), 0) +
        rows.reduce((s, x) => s + Number(x.commissionAmount || 0), 0);

      return {
        id: officer._id,
        name: officer.name,
        totalSales,
        collection,
        due,
        profit,
        expense,
        netContribution: profit - expense,
        target: Number(officer.monthlyTarget || 0),
        achievement:
          Number(officer.monthlyTarget || 0) > 0
            ? Math.round((totalSales / Number(officer.monthlyTarget || 0)) * 100)
            : 0,
      };
    });

    const bestSales = [...summaries].sort((a, b) => b.totalSales - a.totalSales)[0];
    const highestDue = [...summaries].sort((a, b) => b.due - a.due)[0];
    const bestProfit = [...summaries].sort((a, b) => b.netContribution - a.netContribution)[0];

    return NextResponse.json({
      success: true,
      data: {
        summaries,
        aiInsight: {
          bestSalesOfficer: bestSales?.name || "N/A",
          highestDueOfficer: highestDue?.name || "N/A",
          bestNetContributionOfficer: bestProfit?.name || "N/A",
          recommendation:
            highestDue?.due > 0
              ? `${highestDue.name} এর due collection follow-up করা দরকার।`
              : "All officers collection performance is stable.",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "AI insight failed" },
      { status: 500 }
    );
  }
}