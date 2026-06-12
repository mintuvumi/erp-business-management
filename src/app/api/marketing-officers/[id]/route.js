import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import { getTenant } from "@/lib/tenant";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const officer = await MarketingOfficer.findOne({
      _id: id,
      companyId: tenant.companyId,
    });

    if (!officer) {
      return NextResponse.json(
        { success: false, message: "Marketing officer not found" },
        { status: 404 }
      );
    }

    const ledger = await MarketingOfficerLedger.find({
      companyId: tenant.companyId,
      marketingOfficerId: officer._id,
    }).sort({ date: -1, createdAt: -1 });

    const summary = ledger.reduce(
      (acc, item) => {
        acc.totalSales += Number(item.totalSales || 0);
        acc.cashSales += Number(item.cashSales || 0);
        acc.dueSales += Number(item.dueSales || 0);
        acc.collectionAmount += Number(item.collectionAmount || 0);
        acc.dueAmount += Number(item.dueAmount || 0);
        acc.profitAmount += Number(item.profitAmount || 0);
        acc.expenseAmount += Number(item.expenseAmount || 0);
        acc.salaryAmount += Number(item.salaryAmount || 0);
        acc.conveyanceAmount += Number(item.conveyanceAmount || 0);
        acc.commissionAmount += Number(item.commissionAmount || 0);
        return acc;
      },
      {
        totalSales: 0,
        cashSales: 0,
        dueSales: 0,
        collectionAmount: 0,
        dueAmount: 0,
        profitAmount: 0,
        expenseAmount: 0,
        salaryAmount: 0,
        conveyanceAmount: 0,
        commissionAmount: 0,
      }
    );

    summary.netContribution =
      summary.profitAmount -
      summary.expenseAmount -
      summary.salaryAmount -
      summary.conveyanceAmount -
      summary.commissionAmount;

    summary.monthlyTarget = Number(officer.monthlyTarget || 0);
    summary.yearlyTarget = Number(officer.yearlyTarget || 0);

    summary.targetAchievement =
      summary.monthlyTarget > 0
        ? Math.round((summary.totalSales / summary.monthlyTarget) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        officer,
        summary,
        ledger,
      },
    });
  } catch (error) {
    console.error("MARKETING_OFFICER_DETAILS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load officer details",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const officer = await MarketingOfficer.findOne({
      _id: id,
      companyId: tenant.companyId,
    });

    if (!officer) {
      return NextResponse.json(
        { success: false, message: "Marketing officer not found" },
        { status: 404 }
      );
    }

    Object.assign(officer, {
      userId: body.userId ?? officer.userId,

      officerId: body.officerId ?? officer.officerId,
      name: body.name ?? officer.name,
      phone: body.phone ?? officer.phone,
      email: body.email ?? officer.email,
      photo: body.photo ?? officer.photo,
      address: body.address ?? officer.address,
      nid: body.nid ?? officer.nid,
      designation: body.designation ?? officer.designation,
      area: body.area ?? officer.area,
      territory: body.territory ?? officer.territory,
      monthlySalary: body.monthlySalary ?? officer.monthlySalary,
      commissionRate: body.commissionRate ?? officer.commissionRate,
      monthlyTarget: body.monthlyTarget ?? officer.monthlyTarget,
      yearlyTarget: body.yearlyTarget ?? officer.yearlyTarget,
      status: body.status ?? officer.status,
      note: body.note ?? officer.note,
    });

    await officer.save();

    return NextResponse.json({
      success: true,
      message: "Marketing officer updated",
      data: officer,
    });
  } catch (error) {
    console.error("MARKETING_OFFICER_UPDATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update officer",
      },
      { status: 500 }
    );
  }
}