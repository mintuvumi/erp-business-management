import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";

function isSameMonth(dateString) {
  const now = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isToday(dateString) {
  const today = new Date().toISOString().slice(0, 10);
  return dateString === today;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";

    const query = {};

    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: "i" } },
        { itemName: { $regex: search, $options: "i" } },
      ];
    }

    if (date) {
      query.date = date;
    }

    const purchases = await Purchase.find(query).sort({ createdAt: -1 });

    const allPurchases = await Purchase.find();

    const totalDuePurchase = allPurchases.reduce(
      (sum, p) => sum + (Number(p.dueAmount) || 0),
      0
    );

    const todayDuePurchase = allPurchases
      .filter((p) => isToday(p.date))
      .reduce((sum, p) => sum + (Number(p.dueAmount) || 0), 0);

    const monthlyDuePurchase = allPurchases
      .filter((p) => isSameMonth(p.date))
      .reduce((sum, p) => sum + (Number(p.dueAmount) || 0), 0);

    const todayCashPurchase = allPurchases
      .filter((p) => isToday(p.date) && p.paymentType === "cash")
      .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    const monthlyCashPurchase = allPurchases
      .filter((p) => isSameMonth(p.date) && p.paymentType === "cash")
      .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    const monthlyTotalPurchase = monthlyDuePurchase + monthlyCashPurchase;

    return NextResponse.json({
      success: true,
      data: {
        totalDuePurchase,
        todayDuePurchase,
        monthlyDuePurchase,
        todayCashPurchase,
        monthlyCashPurchase,
        monthlyTotalPurchase,
        purchases,
      },
    });
  } catch (error) {
    console.error("PURCHASE_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load purchase dashboard",
      },
      { status: 500 }
    );
  }
}