import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import OfferProduct from "@/models/OfferProduct";
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

    const products = await OfferProduct.find({
      companyId: tenant.companyId,
      status: "active",
    })
      .sort({ productName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("OFFER_PRODUCTS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load products",
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

    if (!body.productName) {
      return NextResponse.json(
        { success: false, message: "Product name is required" },
        { status: 400 }
      );
    }

    const product = await OfferProduct.create({
      companyId: tenant.companyId,
      productName: body.productName,
      brand: body.brand || "",
      country: body.country || "",
      icu: body.icu || "",
      tripUnit: body.tripUnit || "",
      productCode: body.productCode || "",
      unit: body.unit || "Nos.",
      listedPrice: Number(body.listedPrice || 0),
      technicalDescription: body.technicalDescription || "",
    });

    return NextResponse.json({
      success: true,
      message: "Product saved",
      data: product,
    });
  } catch (error) {
    console.error("OFFER_PRODUCT_CREATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save product",
      },
      { status: 500 }
    );
  }
}