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

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();

    const filter = {
      companyId: tenant.companyId,
    };

    if (q) {
      filter.$or = [
        { officerId: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
        { area: { $regex: q, $options: "i" } },
        { territory: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
        { status: { $regex: q, $options: "i" } },
      ];
    }

    const officers = await MarketingOfficer.find(filter).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      data: officers,
    });
  } catch (error) {
    console.error("MARKETING_OFFICER_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load marketing officers",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, message: "Officer name is required" },
        { status: 400 }
      );
    }

    const officer = await MarketingOfficer.create({
      companyId: tenant.companyId,
      officerId: body.officerId || "",
      name: String(body.name || "").trim(),
      phone: body.phone || "",
      email: body.email || "",
      photo: body.photo || "",
      address: body.address || "",
      nid: body.nid || "",
      designation: body.designation || "Marketing Officer",
      area: body.area || "",
      territory: body.territory || "",
      joiningDate: body.joiningDate || new Date(),
      monthlySalary: Number(body.monthlySalary || 0),
      commissionRate: Number(body.commissionRate || 0),
      monthlyTarget: Number(body.monthlyTarget || 0),
      yearlyTarget: Number(body.yearlyTarget || 0),
      status: body.status || "active",
      note: body.note || "",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    await MarketingOfficerLedger.create({
      companyId: tenant.companyId,
      marketingOfficerId: officer._id,
      marketingOfficerName: officer.name,
      type: "adjustment",
      note: "Marketing officer created",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    return NextResponse.json({
      success: true,
      message: "Marketing officer saved",
      data: officer,
    });
  } catch (error) {
    console.error("MARKETING_OFFICER_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save marketing officer",
      },
      { status: 500 }
    );
  }
}