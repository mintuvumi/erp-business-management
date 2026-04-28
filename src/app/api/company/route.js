import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";

async function getOrCreateCompany() {
  let company = await Company.findOne({ isActive: true });

  if (!company) {
    company = await Company.create({
      name: "NextCore ERP",
      businessType: "shop",
      isActive: true,
    });
  }

  return company;
}

export async function GET() {
  try {
    await connectDB();

    const company = await getOrCreateCompany();

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("COMPANY_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load company" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const company = await getOrCreateCompany();

    company.name = body.name || company.name;
    company.address = body.address || "";
    company.phone = body.phone || "";
    company.email = body.email || "";
    company.businessType = body.businessType || "shop";

    await company.save();

    return NextResponse.json({
      success: true,
      message: "Company saved",
      data: company,
    });
  } catch (error) {
    console.error("COMPANY_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save company" },
      { status: 500 }
    );
  }
}