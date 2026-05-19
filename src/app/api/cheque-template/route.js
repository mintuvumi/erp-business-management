import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChequeTemplate from "@/models/ChequeTemplate";
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

    let template = await ChequeTemplate.findOne({
      companyId: tenant.companyId,
      status: "active",
      isDefault: true,
    }).lean();

    if (!template) {
      template = await ChequeTemplate.create({
        companyId: tenant.companyId,
        bankName: "Demo Bank",
      });
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("CHEQUE_TEMPLATE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load cheque template",
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

    const template = await ChequeTemplate.findOneAndUpdate(
      {
        companyId: tenant.companyId,
        isDefault: true,
      },
      {
        companyId: tenant.companyId,
        bankName: body.bankName || "Demo Bank",
        chequeWidthMm: Number(body.chequeWidthMm || 203),
        chequeHeightMm: Number(body.chequeHeightMm || 92),
        payTo: body.payTo,
        amountNumber: body.amountNumber,
        amountWords: body.amountWords,
        date: body.date,
        isDefault: true,
        status: "active",
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Cheque template saved",
      data: template,
    });
  } catch (error) {
    console.error("CHEQUE_TEMPLATE_SAVE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save cheque template",
      },
      { status: 500 }
    );
  }
}