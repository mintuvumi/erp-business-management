import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AccountCategory from "@/models/AccountCategory";

function makeSlug(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const transactionType = searchParams.get("transactionType") || "";
    const direction = searchParams.get("direction") || "";

    const query = { isActive: true };

    if (type) query.type = type;
    if (transactionType) query.transactionType = transactionType;
    if (direction) query.direction = direction;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const categories = await AccountCategory.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Category GET Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Category load failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const name = body.name?.trim();
    const type = body.type || "others";
    const transactionType = body.transactionType || "others";
    const direction = body.direction || "out";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required",
        },
        { status: 400 }
      );
    }

    const slug = body.slug ? makeSlug(body.slug) : makeSlug(name);

    const exists = await AccountCategory.findOne({
      slug,
      type,
      isActive: true,
    });

    if (exists) {
      return NextResponse.json(
        {
          success: false,
          message: "This category already exists",
        },
        { status: 409 }
      );
    }

    const category = await AccountCategory.create({
      name,
      slug,
      type,
      transactionType,
      direction,
      icon: body.icon || "wallet",
      color: body.color || "#2563eb",
      description: body.description || "",
      isSystem: false,
      isActive: true,
      sortOrder: body.sortOrder || 0,
      createdBy: body.createdBy || "",
    });

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Category POST Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Category create failed",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category id is required",
        },
        { status: 400 }
      );
    }

    const category = await AccountCategory.findById(body._id);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    if (category.isSystem && body.delete) {
      return NextResponse.json(
        {
          success: false,
          message: "System category cannot be deleted",
        },
        { status: 403 }
      );
    }

    if (body.delete) {
      category.isActive = false;
      await category.save();

      return NextResponse.json({
        success: true,
        message: "Category deleted successfully",
      });
    }

    if (body.name) {
      category.name = body.name.trim();
    }

    if (body.slug || body.name) {
      category.slug = makeSlug(body.slug || body.name);
    }

    if (body.type) category.type = body.type;
    if (body.transactionType) category.transactionType = body.transactionType;
    if (body.direction) category.direction = body.direction;
    if (body.icon) category.icon = body.icon;
    if (body.color) category.color = body.color;
    if (body.description !== undefined) category.description = body.description;
    if (body.sortOrder !== undefined) category.sortOrder = body.sortOrder;
    if (body.updatedBy !== undefined) category.updatedBy = body.updatedBy;

    await category.save();

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Category PATCH Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Category update failed",
      },
      { status: 500 }
    );
  }
}