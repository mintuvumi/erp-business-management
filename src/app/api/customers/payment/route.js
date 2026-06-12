import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import BankAccount from "@/models/BankAccount";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return Number(value || 0);
}

function getPaymentType({ paidAmount, targetAmount }) {
  const paid = money(paidAmount);
  const target = money(targetAmount);

  if (paid <= 0) return "credit";
  if (paid >= target) return "cash";
  return "partial";
}

function nextInstallmentDate(currentDate, reminderType) {
  if (!currentDate) return "";

  const date = new Date(currentDate);
  if (Number.isNaN(date.getTime())) return "";

  if (reminderType === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (reminderType === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

async function addBankBalance({ bankId, amount, companyId }) {
  if (!bankId || money(amount) <= 0) return null;

  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
    status: { $ne: "inactive" },
  });

  if (!bank) {
    throw new Error("Bank account not found");
  }

  const balanceBefore = money(bank.currentBalance);
  const balanceAfter = balanceBefore + money(amount);

  bank.currentBalance = balanceAfter;
  await bank.save();

  return { bank, balanceBefore, balanceAfter };
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

    let user;

    try {
      user = await requirePermission(tenant, "dueCollection");
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Access denied",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const saleId = body.saleId;
    const amount = money(body.amount);
    const paymentDate = body.date || today();
    const note = body.note || "";
    const collectionComment =
      body.collectionComment || body.comment || note || "";

    const paymentTo = body.paymentTo || body.collectionTo || "cash";
    const bankId = body.bankId || null;

    if (!saleId) {
      return NextResponse.json(
        { success: false, message: "Sale ID required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Sale ID" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid payment amount required" },
        { status: 400 }
      );
    }

    if (paymentTo === "bank" && !bankId) {
      return NextResponse.json(
        { success: false, message: "Bank account required" },
        { status: 400 }
      );
    }

    const sale = await Sale.findOne({
      _id: saleId,
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 }
      );
    }

    if (
      user.role === "marketing_officer" &&
      String(sale.marketingOfficerId || "") !== String(tenant.user?.id || "")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. This customer is not assigned to you.",
        },
        { status: 403 }
      );
    }

    let marketingOfficerId = body.marketingOfficerId || sale.marketingOfficerId;
    let marketingOfficerName = sale.marketingOfficerName || "";

    if (!marketingOfficerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Marketing Officer is required for due collection",
        },
        { status: 400 }
      );
    }

    const officer = await MarketingOfficer.findOne({
      _id: marketingOfficerId,
      companyId: tenant.companyId,
      status: "active",
    });

    if (!officer) {
      return NextResponse.json(
        { success: false, message: "Valid Marketing Officer required" },
        { status: 400 }
      );
    }

    marketingOfficerId = officer._id;
    marketingOfficerName = officer.name;

    const previousPaidAmount = money(sale.paidAmount);
    const invoiceTotal = money(
      sale.invoiceTotal || sale.grossAmount || sale.netTotal
    );
    const netReceivable = money(
      sale.netReceivable || sale.statementDueAmount || sale.dueAmount
    );

    const currentStatementDue = money(
      sale.statementDueAmount || sale.dueAmount
    );

    if (currentStatementDue <= 0) {
      return NextResponse.json(
        { success: false, message: "This invoice is already fully paid" },
        { status: 400 }
      );
    }

    if (amount > currentStatementDue) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment amount cannot be greater than current due ৳ ${currentStatementDue.toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    let bankInfo = null;

    if (paymentTo === "bank") {
      bankInfo = await addBankBalance({
        bankId,
        amount,
        companyId: tenant.companyId,
      });
    }

    const newPaidAmount = previousPaidAmount + amount;

    const invoiceDueAmount = Math.max(invoiceTotal - newPaidAmount, 0);
    const statementDueAmount = Math.max(currentStatementDue - amount, 0);

    sale.paidAmount = newPaidAmount;
    sale.invoiceDueAmount = invoiceDueAmount;
    sale.statementDueAmount = statementDueAmount;
    sale.dueAmount = statementDueAmount;
    sale.collectedAmount = money(sale.collectedAmount) + amount;

    sale.paymentType = getPaymentType({
      paidAmount: newPaidAmount,
      targetAmount: invoiceTotal,
    });

    sale.marketingOfficerId = marketingOfficerId;
    sale.marketingOfficerName = marketingOfficerName;

    sale.lastCollectionComment = collectionComment;
    sale.collectionComment = collectionComment;
    sale.updatedByUserId = tenant.user?.id || null;
    sale.updatedBy = tenant.user?.name || "";

    if (sale.dueSchedule) {
      sale.dueSchedule.completedInstallments =
        money(sale.dueSchedule.completedInstallments) + 1;

      if (statementDueAmount <= 0) {
        sale.dueSchedule.isClosed = true;
        sale.nextCollectionDate = "";
      } else {
        const reminderType = sale.dueSchedule.reminderType || "none";

        const nextDate =
          body.nextCollectionDate ||
          body.nextDueDate ||
          body.promiseDate ||
          nextInstallmentDate(
            sale.nextCollectionDate || paymentDate,
            reminderType
          );

        sale.nextCollectionDate = nextDate || "";
        sale.dueSchedule.nextDueDate = nextDate || "";
        sale.dueSchedule.promiseDate =
          body.promiseDate || sale.dueSchedule.promiseDate || "";
        sale.dueSchedule.reminderNote =
          collectionComment || sale.dueSchedule.reminderNote || "";
      }
    } else {
      sale.nextCollectionDate = body.nextCollectionDate || "";
    }

    await sale.save();

    if (paymentTo === "bank") {
      await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        bankId,
        type: "in",
        category: "due_collection",
        title: `Bank due collection from ${sale.customerName}`,
        amount,

        paymentMethod: body.paymentMethod || "bank",
        chequeNo: body.chequeNo || "",
        transactionId: body.transactionId || "",

        personName: sale.customerName || "",
        personType: "customer",

        customerId: sale.customerId || null,
        customerName: sale.customerName || "",
        customerPhone: sale.customerPhone || "",

        saleId: sale._id,
        billNo: sale.billNo || "",

        marketingOfficerId,
        marketingOfficerName,

        date: paymentDate,
        note,
        comment: collectionComment,

        refType: "sale_due_collection",
        refId: sale._id.toString(),

        balanceBefore: bankInfo?.balanceBefore || 0,
        balanceAfter: bankInfo?.balanceAfter || 0,
        status: "active",
      });
    } else {
      await CashTransaction.create({
        companyId: tenant.companyId,
        type: "in",
        category: "due_collection",
        title: `Due collection from ${sale.customerName}`,
        amount,
        date: paymentDate,
        note,
        comment: collectionComment,

        refType: "sale_due_collection",
        refId: sale._id.toString(),

        customerId: sale.customerId || null,
        customerName: sale.customerName || "",
        customerPhone: sale.customerPhone || "",

        saleId: sale._id,
        billNo: sale.billNo || "",

        marketingOfficerId,
        marketingOfficerName,

        paymentType: "Cash",
        paymentFrom: "cash",

        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });
    }

    await MarketingOfficerLedger.create({
      companyId: tenant.companyId,

      marketingOfficerId,
      marketingOfficerName,

      date: paymentDate,
      type: "collection",

      referenceType: "sale_due_collection",
      referenceId: sale._id,

      invoiceNo: sale.billNo || "",
      customerId: sale.customerId || null,
      customerName: sale.customerName || "",

      totalSales: 0,
      cashSales: 0,
      dueSales: 0,
      collectionAmount: amount,
      dueAmount: statementDueAmount,
      profitAmount: 0,

      nextCollectionDate: sale.nextCollectionDate || "",
      collectionComment,

      note: note || `Due collection for invoice ${sale.billNo || ""}`,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment added successfully",
        data: {
          saleId: sale._id,
          customerName: sale.customerName,
          billNo: sale.billNo,

          marketingOfficerId,
          marketingOfficerName,

          receivedAmount: amount,
          paidAmount: newPaidAmount,

          invoiceTotal,
          invoiceDueAmount,

          netReceivable,
          statementDueAmount,

          dueAmount: sale.dueAmount,
          nextCollectionDate: sale.nextCollectionDate,
          collectionComment,

          paymentTo,
          paymentType: sale.paymentType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CUSTOMER_PAYMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to add payment",
      },
      { status: 500 }
    );
  }
}