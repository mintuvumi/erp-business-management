import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import Stock from "@/models/Stock";
import Customer from "@/models/Customer";
import CompanySetting from "@/models/CompanySetting";
import CashTransaction from "@/models/CashTransaction";
import connectDB from "@/lib/db";
import generateBillNo from "@/utils/generateBillNo";
import { getTenant } from "@/lib/tenant";

function calculateTax({ salesAmount, vatPercent, aitPercent, amountType }) {
  const amount = Number(salesAmount) || 0;
  const vatRate = Number(vatPercent) || 0;
  const aitRate = Number(aitPercent) || 0;

  let baseSalesAmount = 0;
  let vatAmount = 0;

  if (amountType === "inclusive") {
    baseSalesAmount = vatRate > 0 ? (amount * 100) / (100 + vatRate) : amount;
    vatAmount = amount - baseSalesAmount;
  } else {
    baseSalesAmount = amount;
    vatAmount = (baseSalesAmount * vatRate) / 100;
  }

  const aitAmount = (baseSalesAmount * aitRate) / 100;
  const invoiceTotal = baseSalesAmount + vatAmount;
  const netReceivable = baseSalesAmount - vatAmount - aitAmount;

  return {
    baseSalesAmount,
    vatAmount,
    aitAmount,
    taxTotal: vatAmount + aitAmount,
    invoiceTotal,
    grossAmount: invoiceTotal,
    netReceivable,
    netSalesAmount: baseSalesAmount,
  };
}

function getPaymentType({ paidAmount, targetAmount }) {
  const paid = Number(paidAmount || 0);
  const target = Number(targetAmount || 0);

  if (paid <= 0) return "credit";
  if (paid >= target) return "cash";
  return "partial";
}

async function getCustomerPreviousDue(customerName, companyId) {
  const sales = await Sale.find({
    companyId,
    customerName: { $regex: `^${customerName}$`, $options: "i" },
    status: { $ne: "cancelled" },
  });

  return sales.reduce(
    (sum, sale) => sum + Number(sale.statementDueAmount || sale.dueAmount || 0),
    0
  );
}

async function getOrCreateCustomer(body, tenant) {
  const customerName = String(body.customerName || "").trim();

  let customer = await Customer.findOne({
    companyId: tenant.companyId,
    name: { $regex: `^${customerName}$`, $options: "i" },
  });

  if (!customer) {
    customer = await Customer.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user.id,
      createdBy: tenant.user.name || "",
      name: customerName,
      phone: body.customerPhone || "",
      address: body.customerAddress || "",
      status: "active",
    });

    return customer;
  }

  let changed = false;

  if (body.customerPhone && body.customerPhone !== customer.phone) {
    customer.phone = body.customerPhone;
    changed = true;
  }

  if (body.customerAddress && body.customerAddress !== customer.address) {
    customer.address = body.customerAddress;
    changed = true;
  }

  if (changed) await customer.save();

  return customer;
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

    if (!body.customerName || !String(body.customerName).trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Items required" },
        { status: 400 }
      );
    }

    const customerName = String(body.customerName || "").trim();
    const manualBillNo = String(body.manualBillNo || "").trim();

    if (manualBillNo) {
      const exists = await Sale.findOne({
        companyId: tenant.companyId,
        billNo: manualBillNo,
      });

      if (exists) {
        return NextResponse.json(
          { success: false, message: "Invoice number already exists" },
          { status: 400 }
        );
      }
    }

    const validBodyItems = (body.items || []).filter(
      (item) =>
        item &&
        String(item.name || "").trim() &&
        Number(item.qty || 0) > 0
    );

    if (validBodyItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one valid item required" },
        { status: 400 }
      );
    }

    for (const item of validBodyItems) {
      if (Number(item.price || 0) < 0) {
        return NextResponse.json(
          { success: false, message: `Invalid price for ${item.name}` },
          { status: 400 }
        );
      }

      if (item.sourceType === "stock") {
        const stock = await Stock.findOne({
          companyId: tenant.companyId,
          itemName: item.name,
        });

        if (!stock) {
          return NextResponse.json(
            { success: false, message: `Stock not found for ${item.name}` },
            { status: 400 }
          );
        }

        if (Number(stock.qty || 0) < Number(item.qty || 0)) {
          return NextResponse.json(
            { success: false, message: `Not enough stock for ${item.name}` },
            { status: 400 }
          );
        }
      }
    }

    const items = validBodyItems.map((i) => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.price) || 0;
      const purchasePrice = Number(i.purchasePrice) || 0;

      const total = qty * price;
      const costTotal = qty * purchasePrice;
      const profit = total - costTotal;

      return {
        ...i,
        name: String(i.name || "").trim(),
        description: String(i.description || "").trim(),
        unit: i.unit || "pcs",
        sourceType: i.sourceType || "stock",
        qty,
        price,
        purchasePrice,
        total,
        costTotal,
        profit,
      };
    });

    const subTotal = items.reduce((sum, i) => sum + Number(i.total || 0), 0);
    const totalCost = items.reduce((sum, i) => sum + Number(i.costTotal || 0), 0);
    const totalProfit = items.reduce((sum, i) => sum + Number(i.profit || 0), 0);

    const discount = Number(body.discount) || 0;

    if (discount < 0) {
      return NextResponse.json(
        { success: false, message: "Discount cannot be negative" },
        { status: 400 }
      );
    }

    const afterDiscount = Math.max(subTotal - discount, 0);
    const amountType = body.amountType || "exclusive";
    const salesAmount =
      Number(body.salesAmount) > 0 ? Number(body.salesAmount) : afterDiscount;

    const vatPercent = Number(body.vatPercent) || 0;
    const aitPercent = Number(body.aitPercent) || 0;

    if (vatPercent < 0 || aitPercent < 0) {
      return NextResponse.json(
        { success: false, message: "VAT/AIT percent cannot be negative" },
        { status: 400 }
      );
    }

    const tax = calculateTax({
      salesAmount,
      vatPercent,
      aitPercent,
      amountType,
    });

    const paidAmount = Number(body.paidAmount) || 0;

    if (paidAmount < 0) {
      return NextResponse.json(
        { success: false, message: "Payment amount cannot be negative" },
        { status: 400 }
      );
    }

    const invoiceDueAmount = Math.max(tax.invoiceTotal - paidAmount, 0);
    const statementDueAmount = Math.max(tax.netReceivable - paidAmount, 0);
    const dueAmount = statementDueAmount;

    const settings = await CompanySetting.findOne({
      companyId: tenant.companyId,
    });

    const customer = await getOrCreateCustomer(body, tenant);

    const previousDue = await getCustomerPreviousDue(
      customerName,
      tenant.companyId
    );

    const totalDueAfterSale = previousDue + statementDueAmount;

    const creditApprovalRequired =
      settings?.creditApprovalRequired === false ? false : true;

    const defaultCreditLimit = Number(settings?.defaultCreditLimit || 50000);
    const customerCreditLimit =
      Number(customer?.creditLimit || 0) > 0
        ? Number(customer.creditLimit)
        : defaultCreditLimit;

    if (
      creditApprovalRequired &&
      statementDueAmount > 0 &&
      totalDueAfterSale > customerCreditLimit
    ) {
      const ownerPin = String(body.ownerPin || "").trim();
      const savedOwnerPin = String(settings?.ownerPin || "1234").trim();

      if (!ownerPin || ownerPin !== savedOwnerPin) {
        return NextResponse.json(
          {
            success: false,
            requirePin: true,
            message:
              settings?.creditWarningMessage ||
              "Customer credit limit exceeded. Owner approval required.",
            data: {
              previousDue,
              newDue: statementDueAmount,
              totalDueAfterSale,
              creditLimit: customerCreditLimit,
            },
          },
          { status: 403 }
        );
      }
    }

    for (const item of items) {
      if (item.sourceType === "stock") {
        const stock = await Stock.findOne({
          companyId: tenant.companyId,
          itemName: item.name,
        });

        if (stock) {
          stock.qty = Number(stock.qty || 0) - Number(item.qty || 0);
          stock.totalValue = Number(stock.qty || 0) * Number(stock.avgCost || 0);
          await stock.save();
        }
      }
    }

    const count = await Sale.countDocuments({
      companyId: tenant.companyId,
    });

    const autoBillNo = generateBillNo(count);
    const billNo = manualBillNo || autoBillNo;

    const paymentType = getPaymentType({
      paidAmount,
      targetAmount: tax.invoiceTotal,
    });

    const sale = await Sale.create({
      ...body,

      companyId: tenant.companyId,
      createdByUserId: tenant.user.id,
      createdBy: tenant.user.name || "",

      billNo,
      manualBillNo,
      autoBillNo,

      customerId: customer?._id || null,
      customerName,
      customerPhone: body.customerPhone || customer?.phone || "",
      customerAddress: body.customerAddress || customer?.address || "",

      items,

      subTotal,
      discount,
      afterDiscount,

      amountType,
      salesAmount,
      baseSalesAmount: tax.baseSalesAmount,

      vatPercent,
      vatAmount: tax.vatAmount,

      aitPercent,
      aitAmount: tax.aitAmount,

      taxTotal: tax.taxTotal,

      grossAmount: tax.grossAmount,
      invoiceTotal: tax.invoiceTotal,
      invoiceDueAmount,

      netReceivable: tax.netReceivable,
      statementDueAmount,

      netSalesAmount: tax.netSalesAmount,

      netTotal: tax.invoiceTotal,
      dueAmount,

      paidAmount,
      paymentType,

      paymentTo: body.paymentTo || "cash",
      bankId: body.paymentTo === "bank" ? body.bankId : null,

      vatDocumentReceived: Boolean(body.vatDocumentReceived),
      aitDocumentReceived: Boolean(body.aitDocumentReceived),
      vatDocumentNote: body.vatDocumentNote || "",
      aitDocumentNote: body.aitDocumentNote || "",

      totalCost,
      totalProfit,

      note: body.note || "",
      status: body.status || "completed",
    });

    if (paidAmount > 0) {
      await CashTransaction.create({
        companyId: tenant.companyId,
        type: "in",
        category: paymentType === "cash" ? "cash_sale" : "due_collection",
        title: `Cash received from sale ${billNo}`,
        amount: paidAmount,
        date: body.date || new Date().toISOString().slice(0, 10),
        note: body.note || "",
        refType: "sale",
        refId: sale._id.toString(),
        createdByUserId: tenant.user.id,
        createdBy: tenant.user.name || "",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sale created successfully",
        data: {
          ...sale.toObject(),
          previousDue,
          currentDueAmount: statementDueAmount,
          totalDueAfterSale,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SALE_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Server Error",
      },
      { status: 500 }
    );
  }
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

    const sales = await Sale.find({
      companyId: tenant.companyId,
    }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: sales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SALE_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}