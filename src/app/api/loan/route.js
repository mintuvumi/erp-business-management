import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Loan from "@/models/Loan";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function checkSubscription(req) {
  const tenant = getTenant(req);

  if (!tenant.companyId) {
    return {
      ok: false,
      tenant,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const sub = await requireActiveSubscription(tenant);

  if (!sub.ok) {
    return {
      ok: false,
      tenant,
      response: NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
      ),
    };
  }

  return { ok: true, tenant };
}

export async function POST(req) {
  try {
    await connectDB();

    const access = await checkSubscription(req);
    if (!access.ok) return access.response;

    const tenant = access.tenant;
    const body = await req.json();

    const amount = Number(body.amount) || 0;
    const paidAmount = Number(body.paidAmount) || 0;
    const dueAmount = Math.max(amount - paidAmount, 0);
    const date = body.date || today();

    if (!body.lenderName || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Lender name and valid amount required" },
        { status: 400 }
      );
    }

    const loan = await Loan.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",

      loanType: body.loanType || "personal",
      lenderName: body.lenderName,
      amount,
      paidAmount,
      dueAmount,
      date,
      note: body.note || "",
      status: body.status || "active",
    });

    if (body.receiveTo === "cash") {
      await CashTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        type: "in",
        category: "loan_receive",
        title: `Loan received from ${body.lenderName}`,
        amount,
        date,
        note: body.note || "",
        refType: "loan",
        refId: loan._id.toString(),
        status: "active",
      });
    }

    if (body.receiveTo === "bank" && body.bankId) {
      const bank = await BankAccount.findOne({
        _id: body.bankId,
        companyId: tenant.companyId,
        status: { $ne: "inactive" },
      });

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      const balanceBefore = Number(bank.currentBalance || 0);
      const balanceAfter = balanceBefore + amount;

      bank.currentBalance = balanceAfter;
      await bank.save();

      await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        bankId: bank._id,
        type: "in",
        category: "loan_receive",
        title: `Loan received from ${body.lenderName}`,
        amount,
        date,
        note: body.note || "",
        refType: "loan",
        refId: loan._id.toString(),
        balanceBefore,
        balanceAfter,
        status: "active",
      });
    }

    return NextResponse.json(
      { success: true, message: "Loan saved", data: loan },
      { status: 201 }
    );
  } catch (error) {
    console.error("LOAN_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to save loan" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const access = await checkSubscription(req);
    if (!access.ok) return access.response;

    const tenant = access.tenant;

    const loans = await Loan.find({
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: loans,
    });
  } catch (error) {
    console.error("LOAN_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load loans" },
      { status: 500 }
    );
  }
}