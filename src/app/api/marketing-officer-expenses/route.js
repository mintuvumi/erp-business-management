import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerExpense from "@/models/MarketingOfficerExpense";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import CashTransaction from "@/models/CashTransaction";
import { getTenant } from "@/lib/tenant";

function getLedgerExpenseFields(type, amount) {
  const value = Number(amount || 0);

  const fields = {
    expenseAmount: 0,
    salaryAmount: 0,
    conveyanceAmount: 0,
    commissionAmount: 0,
  };

  if (type === "salary") {
    fields.salaryAmount = value;
  } else if (type === "conveyance" || type === "travel" || type === "fuel") {
    fields.conveyanceAmount = value;
  } else if (type === "commission") {
    fields.commissionAmount = value;
  } else {
    fields.expenseAmount = value;
  }

  return fields;
}

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
    const officerId = searchParams.get("officerId") || "";
    const type = searchParams.get("type") || "";

    const filter = {
      companyId: tenant.companyId,
    };

    if (officerId) filter.marketingOfficerId = officerId;
    if (type) filter.expenseType = type;

    const expenses = await MarketingOfficerExpense.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error("MARKETING_OFFICER_EXPENSE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load officer expenses",
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

    if (!body.marketingOfficerId) {
      return NextResponse.json(
        { success: false, message: "Marketing Officer is required" },
        { status: 400 }
      );
    }

    if (!body.expenseType) {
      return NextResponse.json(
        { success: false, message: "Expense type is required" },
        { status: 400 }
      );
    }

    const amount = Number(body.amount || 0);

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount is required" },
        { status: 400 }
      );
    }

    const officer = await MarketingOfficer.findOne({
      _id: body.marketingOfficerId,
      companyId: tenant.companyId,
    });

    if (!officer) {
      return NextResponse.json(
        { success: false, message: "Marketing Officer not found" },
        { status: 404 }
      );
    }

    const expense = await MarketingOfficerExpense.create({
      companyId: tenant.companyId,
      marketingOfficerId: officer._id,
      marketingOfficerName: officer.name,
      date: body.date || new Date().toISOString().slice(0, 10),
      expenseType: body.expenseType,
      amount,
      paymentMethod: body.paymentMethod || "cash",
      bankId: body.paymentMethod === "bank" ? body.bankId || null : null,
      note: body.note || "",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    const ledgerFields = getLedgerExpenseFields(body.expenseType, amount);

    await MarketingOfficerLedger.create({
      companyId: tenant.companyId,
      marketingOfficerId: officer._id,
      marketingOfficerName: officer.name,
      date: body.date || new Date().toISOString().slice(0, 10),
      type:
        body.expenseType === "salary"
          ? "salary"
          : body.expenseType === "commission"
          ? "commission"
          : body.expenseType === "conveyance" ||
            body.expenseType === "travel" ||
            body.expenseType === "fuel"
          ? "conveyance"
          : "expense",
      referenceType: "marketing_officer_expense",
      referenceId: expense._id,
      invoiceNo: "",
      customerName: "",
      ...ledgerFields,
      note: body.note || `${body.expenseType} expense`,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    if (amount > 0) {
      await CashTransaction.create({
        companyId: tenant.companyId,
        type: "out",
        category: "marketing_officer_expense",
        title: `${officer.name} - ${body.expenseType}`,
        amount,
        date: body.date || new Date().toISOString().slice(0, 10),
        note: body.note || "",
        refType: "marketing_officer_expense",
        refId: expense._id.toString(),
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Officer expense saved",
        data: expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("MARKETING_OFFICER_EXPENSE_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save officer expense",
      },
      { status: 500 }
    );
  }
}