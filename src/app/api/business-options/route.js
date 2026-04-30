import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BusinessOption from "@/models/BusinessOption";

const DEFAULT_OPTIONS = {
  expense_head: [
    "Conveyance",
    "Office Cost",
    "VAT/Tax",
    "Salary",
    "Utility Bill",
    "Rent",
    "Maintenance",
    "Marketing",
    "Internet Bill",
    "Others",
  ],
  income_head: ["Sales", "Service Income", "Investment", "Others"],
  payment_type: ["Cash", "Bank", "bKash", "Nagad", "Rocket"],
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { success: false, message: "Type is required" },
        { status: 400 }
      );
    }

    const count = await BusinessOption.countDocuments({ type });

    if (count === 0 && DEFAULT_OPTIONS[type]) {
      await BusinessOption.insertMany(
        DEFAULT_OPTIONS[type].map((name) => ({ type, name })),
        { ordered: false }
      ).catch(() => {});
    }

    const data = await BusinessOption.find({
      type,
      status: "active",
    }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const type = body.type;
    const name = body.name?.trim();

    if (!type || !name) {
      return NextResponse.json(
        { success: false, message: "Type and name are required" },
        { status: 400 }
      );
    }

    const exists = await BusinessOption.findOne({
      type,
      name: new RegExp(`^${name}$`, "i"),
    });

    if (exists) {
      return NextResponse.json(
        { success: false, message: "This option already exists" },
        { status: 409 }
      );
    }

    const data = await BusinessOption.create({ type, name });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}