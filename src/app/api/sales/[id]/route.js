import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const sale = await Sale.findById(params.id);

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error("SALE_SINGLE_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load sale invoice" },
      { status: 500 }
    );
  }
}