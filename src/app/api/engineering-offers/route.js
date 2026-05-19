import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import EngineeringOffer from "@/models/EngineeringOffer";
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

    const offers = await EngineeringOffer.find({
      companyId: tenant.companyId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error("ENGINEERING_OFFER_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load offers",
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

    const allowedRoles = ["owner", "admin", "offer_user", "sales_engineer"];

    if (!allowedRoles.includes(tenant.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const count = await EngineeringOffer.countDocuments({
      companyId: tenant.companyId,
    });

    const offerNo = `OFF-${String(count + 1).padStart(4, "0")}`;

    const items = (body.items || []).map((item) => {
      const qty = Number(item.qty || 0);
      const purchasePrice = Number(item.purchasePrice || 0);
      const marginPercent = Number(item.marginPercent || 0);

      const unitPrice =
        Number(item.unitPrice) ||
        purchasePrice + (purchasePrice * marginPercent) / 100;

      const total = qty * unitPrice;
      const profitAmount = (unitPrice - purchasePrice) * qty;

      return {
        ...item,

        stockItemId:
          item.stockItemId || null,

        qty,

        purchasePrice,

        marginPercent,

        unitPrice,

        total,

        profitAmount,
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const totalCosting = items.reduce(
      (sum, item) =>
        sum + Number(item.purchasePrice || 0) * Number(item.qty || 0),
      0
    );

    const totalProfit = items.reduce(
      (sum, item) => sum + Number(item.profitAmount || 0),
      0
    );

    const discount = Number(body.discount || 0);
    const vat = Number(body.vat || 0);
    const grandTotal = subtotal - discount + vat;

    const offer = await EngineeringOffer.create({
      ...body,
      offerNo,
      companyId: tenant.companyId,
      items,
      subtotal,
      discount,
      vat,
      grandTotal,
      totalCosting,
      totalProfit,
      createdBy: {
        userId: tenant.user?.id,
        name: tenant.user?.name,
        role: tenant.user?.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Offer created",
      data: offer,
    });
  } catch (error) {
    console.error("ENGINEERING_OFFER_CREATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create offer",
      },
      { status: 500 }
    );
  }
}