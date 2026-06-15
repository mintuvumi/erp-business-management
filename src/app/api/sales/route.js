import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import Stock from "@/models/Stock";
import Customer from "@/models/Customer";
import CompanySetting from "@/models/CompanySetting";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankTransaction from "@/models/BankTransaction";
import BankAccount from "@/models/BankAccount";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import Notification from "@/models/Notification";
import connectDB from "@/lib/db";
import generateBillNo from "@/utils/generateBillNo";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function cleanString(value) {
  return String(value || "").trim();
}

function toNumber(value) {
  return Number(value || 0) || 0;
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calculateTax({ salesAmount, vatPercent, aitPercent, amountType }) {
  const amount = toNumber(salesAmount);
  const vatRate = toNumber(vatPercent);
  const aitRate = toNumber(aitPercent);

  let baseSalesAmount = 0;
  let vatAmount = 0;
  let invoiceTotal = 0;

  if (amountType === "inclusive") {
    baseSalesAmount = vatRate > 0 ? (amount * 100) / (100 + vatRate) : amount;
    vatAmount = amount - baseSalesAmount;
    invoiceTotal = amount;
  } else {
    baseSalesAmount = amount;
    vatAmount = (baseSalesAmount * vatRate) / 100;
    invoiceTotal = baseSalesAmount + vatAmount;
  }

  const aitAmount = (baseSalesAmount * aitRate) / 100;
  const netReceivable = invoiceTotal - aitAmount;

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
  const paid = toNumber(paidAmount);
  const target = toNumber(targetAmount);

  if (paid <= 0) return "credit";
  if (paid >= target) return "cash";
  return "partial";
}

async function getCustomerPreviousDue(customerName, companyId) {
  const safeName = escapeRegex(customerName);

  const sales = await Sale.find({
    companyId,
    customerName: { $regex: `^${safeName}$`, $options: "i" },
    status: { $ne: "cancelled" },
  });

  return sales.reduce(
    (sum, sale) => sum + toNumber(sale.statementDueAmount || sale.dueAmount),
    0
  );
}

async function getOrCreateCustomer(body, tenant) {
  const customerName = cleanString(body.customerName);
  const safeName = escapeRegex(customerName);

  let customer = await Customer.findOne({
    companyId: tenant.companyId,
    name: { $regex: `^${safeName}$`, $options: "i" },
  });

  if (!customer) {
    return await Customer.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
      name: customerName,
      phone: body.customerPhone || "",
      email: body.customerEmail || "",
      address: body.customerAddress || "",
      status: "active",
    });
  }

  let changed = false;

  if (body.customerPhone && body.customerPhone !== customer.phone) {
    customer.phone = body.customerPhone;
    changed = true;
  }

  if (body.customerEmail && body.customerEmail !== customer.email) {
    customer.email = body.customerEmail;
    changed = true;
  }

  if (body.customerAddress && body.customerAddress !== customer.address) {
    customer.address = body.customerAddress;
    changed = true;
  }

  if (changed) await customer.save();

  return customer;
}

async function addBankBalance({ bankId, amount, companyId }) {
  if (!bankId || toNumber(amount) <= 0) return null;

  const bank = await BankAccount.findOne({
    _id: bankId,
    companyId,
    status: { $ne: "inactive" },
  });

  if (!bank) throw new Error("Bank account not found");

  const balanceBefore = toNumber(bank.currentBalance);
  const balanceAfter = balanceBefore + toNumber(amount);

  bank.currentBalance = balanceAfter;
  bank.balance = balanceAfter;
  await bank.save();

  return { bank, balanceBefore, balanceAfter };
}

async function addCashBalance({ amount, companyId }) {
  if (toNumber(amount) <= 0) return null;

  let cash = await Cash.findOne({ companyId });

  if (!cash) {
    cash = await Cash.create({
      companyId,
      currentBalance: 0,
      balance: 0,
    });
  }

  const balanceBefore = toNumber(cash.currentBalance || cash.balance);
  const balanceAfter = balanceBefore + toNumber(amount);

  cash.currentBalance = balanceAfter;
  cash.balance = balanceAfter;
  await cash.save();

  return { cash, balanceBefore, balanceAfter };
}

function stockQueryForItem(item, tenant, name) {
  if (item.productId) {
    return {
      _id: item.productId,
      companyId: tenant.companyId,
      status: "active",
    };
  }

  return {
    companyId: tenant.companyId,
    itemName: name,
    status: "active",
  };
}

async function buildSaleItems({ bodyItems, tenant }) {
  const result = [];

  for (const item of bodyItems) {
    const name = cleanString(item.name || item.itemName || item.productName);
    const qty = toNumber(item.qty || item.quantity);
    const price = toNumber(item.price || item.rate);
    const sourceType = item.sourceType || "stock";

    if (!name || qty <= 0) continue;

    let stock = null;
    let displayPurchasePrice = toNumber(item.purchasePrice);
    let profitCost = toNumber(item.purchasePrice);

    if (sourceType === "stock" || sourceType === "finished_goods") {
      stock = await Stock.findOne(stockQueryForItem(item, tenant, name));

      if (!stock) throw new Error(`Stock not found for ${name}`);
      if (toNumber(stock.qty) < qty) throw new Error(`Not enough stock for ${name}`);

      if (stock.productType === "finished_goods" || sourceType === "finished_goods") {
        displayPurchasePrice = toNumber(
          stock.lastProductionCost || stock.avgProductionCost || stock.avgCost
        );
        profitCost = toNumber(
          stock.avgProductionCost || stock.lastProductionCost || stock.avgCost
        );
      } else {
        displayPurchasePrice = toNumber(stock.lastPurchasePrice || stock.avgCost);
        profitCost = toNumber(stock.avgCost || stock.lastPurchasePrice);
      }
    }

    const total = qty * price;
    const costTotal = qty * profitCost;
    const profit = total - costTotal;

    result.push({
      ...item,
      name,
      itemName: item.itemName || name,
      productName: item.productName || name,
      productId: item.productId || stock?._id || null,
      description: cleanString(item.description),
      unit: item.unit || stock?.unit || "pcs",
      sourceType,
      qty,
      quantity: qty,
      price,
      rate: price,
      purchasePrice: displayPurchasePrice,
      avgCostUsed: profitCost,
      total,
      amount: total,
      costTotal,
      profit,
    });
  }

  return result;
}

async function reduceStockAfterSale({ items, tenant }) {
  for (const item of items) {
    if (item.sourceType !== "stock" && item.sourceType !== "finished_goods") continue;

    const stock = await Stock.findOne(stockQueryForItem(item, tenant, item.name));
    if (!stock) continue;

    stock.qty = Math.max(toNumber(stock.qty) - toNumber(item.qty), 0);
    stock.quantity = stock.qty;
    stock.availableQty = Math.max(stock.qty - toNumber(stock.reservedQty), 0);

    const cost =
      stock.productType === "finished_goods"
        ? toNumber(stock.avgProductionCost || stock.lastProductionCost)
        : toNumber(stock.avgCost || stock.lastPurchasePrice);

    stock.totalValue = toNumber(stock.qty) * cost;
    stock.updatedByUserId = tenant.user?.id || null;
    stock.updatedBy = tenant.user?.name || "";

    await stock.save();
  }
}

function buildDueSchedule({
  body,
  dueAmount,
  installmentEnabled,
  installmentMonths,
  installmentAmount,
}) {
  const reminderType =
    body.dueSchedule?.reminderType ||
    body.reminderType ||
    (installmentEnabled ? "monthly" : "none");

  const promiseDate =
    body.dueSchedule?.promiseDate ||
    body.promiseDate ||
    body.nextCollectionDate ||
    "";

  const nextDueDate =
    body.dueSchedule?.nextDueDate ||
    body.nextDueDate ||
    body.nextCollectionDate ||
    promiseDate ||
    "";

  return {
    enabled: Boolean(
      toNumber(dueAmount) > 0 &&
        (nextDueDate || promiseDate || installmentEnabled)
    ),
    reminderType,
    nextDueDate,
    promiseDate,
    installmentAmount: toNumber(
      body.dueSchedule?.installmentAmount ||
        body.installmentAmount ||
        installmentAmount
    ),
    totalInstallments: toNumber(
      body.dueSchedule?.totalInstallments ||
        body.totalInstallments ||
        installmentMonths
    ),
    completedInstallments: toNumber(body.dueSchedule?.completedInstallments),
    reminderNote:
      body.dueSchedule?.reminderNote ||
      body.reminderNote ||
      body.collectionComment ||
      "",
    isClosed: toNumber(dueAmount) <= 0,
  };
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

    const sub = await requireActiveSubscription(tenant);

    if (!sub.ok) {
      return NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
      );
    }

    const body = await req.json();

    if (!cleanString(body.customerName)) {
      return NextResponse.json(
        { success: false, message: "Customer name required" },
        { status: 400 }
      );
    }

    if (!body.marketingOfficerId) {
      return NextResponse.json(
        { success: false, message: "Marketing Officer is required" },
        { status: 400 }
      );
    }

    const marketingOfficer = await MarketingOfficer.findOne({
      _id: body.marketingOfficerId,
      companyId: tenant.companyId,
      status: "active",
    });

    if (!marketingOfficer) {
      return NextResponse.json(
        { success: false, message: "Valid Marketing Officer required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Items required" },
        { status: 400 }
      );
    }

    const customerName = cleanString(body.customerName);
    const manualBillNo = cleanString(body.manualBillNo);

    if (manualBillNo) {
      const exists = await Sale.findOne({
        companyId: tenant.companyId,
        $or: [
          { billNo: manualBillNo },
          { manualBillNo },
          { invoiceNo: manualBillNo },
        ],
      });

      if (exists) {
        return NextResponse.json(
          { success: false, message: "Invoice number already exists" },
          { status: 400 }
        );
      }
    }

    const validBodyItems = body.items.filter(
      (item) =>
        item &&
        cleanString(item.name || item.itemName || item.productName) &&
        toNumber(item.qty || item.quantity) > 0
    );

    if (validBodyItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one valid item required" },
        { status: 400 }
      );
    }

    for (const item of validBodyItems) {
      if (toNumber(item.price || item.rate) < 0) {
        return NextResponse.json(
          { success: false, message: `Invalid price for ${item.name}` },
          { status: 400 }
        );
      }
    }

    const items = await buildSaleItems({
      bodyItems: validBodyItems,
      tenant,
    });

    const subTotal = items.reduce((sum, i) => sum + toNumber(i.total), 0);
    const totalCost = items.reduce((sum, i) => sum + toNumber(i.costTotal), 0);
    const discount = toNumber(body.discount);

    if (discount < 0) {
      return NextResponse.json(
        { success: false, message: "Discount cannot be negative" },
        { status: 400 }
      );
    }

    const grossProfit = items.reduce((sum, i) => sum + toNumber(i.profit), 0);
    const totalProfit = grossProfit - discount;

    const afterDiscount = Math.max(subTotal - discount, 0);
    const amountType = body.amountType || "exclusive";
    const salesAmount =
      toNumber(body.salesAmount) > 0 ? toNumber(body.salesAmount) : afterDiscount;

    const vatPercent = toNumber(body.vatPercent);
    const aitPercent = toNumber(body.aitPercent);

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

    const paidAmount = toNumber(body.paidAmount);

    if (paidAmount < 0) {
      return NextResponse.json(
        { success: false, message: "Payment amount cannot be negative" },
        { status: 400 }
      );
    }

    if (paidAmount > tax.invoiceTotal) {
      return NextResponse.json(
        { success: false, message: "Paid amount cannot exceed invoice total" },
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
    const previousDue = await getCustomerPreviousDue(customerName, tenant.companyId);
    const totalDueAfterSale = previousDue + statementDueAmount;

    const creditApprovalRequired =
      settings?.creditApprovalRequired === false ? false : true;

    const defaultCreditLimit = toNumber(settings?.defaultCreditLimit || 50000);

    const customerCreditLimit =
      toNumber(customer?.creditLimit) > 0
        ? toNumber(customer.creditLimit)
        : defaultCreditLimit;

    if (
      creditApprovalRequired &&
      statementDueAmount > 0 &&
      totalDueAfterSale > customerCreditLimit
    ) {
      const ownerPin = cleanString(body.ownerPin);
      const savedOwnerPin = cleanString(settings?.ownerPin || "1234");

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

    const count = await Sale.countDocuments({ companyId: tenant.companyId });
    const autoBillNo = generateBillNo(count);
    const billNo = manualBillNo || autoBillNo;

    const paymentType = getPaymentType({
      paidAmount,
      targetAmount: tax.invoiceTotal,
    });

    const installmentEnabled = Boolean(body.installmentEnabled);
    const installmentMonths = toNumber(body.installmentMonths);
    const installmentAmount =
      installmentMonths > 0 ? toNumber(dueAmount) / installmentMonths : 0;

    const dueInterestPercent = toNumber(
      body.dueInterestPercent || settings?.dueInterestPercent
    );

    const dueInterestAmount = toNumber(body.dueInterestAmount);
    const date = body.date || today();

    const dueSchedule = buildDueSchedule({
      body,
      dueAmount,
      installmentEnabled,
      installmentMonths,
      installmentAmount,
    });

    let bankInfo = null;
    let cashInfo = null;

    if (paidAmount > 0 && body.paymentTo === "bank") {
      if (!body.bankId) {
        return NextResponse.json(
          { success: false, message: "Bank account required" },
          { status: 400 }
        );
      }

      bankInfo = await addBankBalance({
        bankId: body.bankId,
        amount: paidAmount,
        companyId: tenant.companyId,
      });
    }

    if (paidAmount > 0 && body.paymentTo !== "bank") {
      cashInfo = await addCashBalance({
        amount: paidAmount,
        companyId: tenant.companyId,
      });
    }

    const nextCollectionDate = dueSchedule.nextDueDate || "";
    const collectionComment =
      body.collectionComment || dueSchedule.reminderNote || "";

    const sale = await Sale.create({
      ...body,

      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",

      billNo,
      manualBillNo,
      autoBillNo,
      date,

      customerId: customer?._id || null,
      customerName,
      customerPhone: body.customerPhone || customer?.phone || "",
      customerEmail: body.customerEmail || customer?.email || "",
      customerAddress: body.customerAddress || customer?.address || "",

      marketingOfficerId: marketingOfficer._id,
      marketingOfficerName: marketingOfficer.name,

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
      total: tax.invoiceTotal,
      dueAmount,

      paidAmount,
      paymentType,

      paymentTo: body.paymentTo || "cash",
      bankId: body.paymentTo === "bank" ? body.bankId : null,

      dueSchedule,

      installmentEnabled,
      installmentMonths,
      installmentAmount,

      nextCollectionDate,
      collectionComment,

      dueInterestPercent,
      dueInterestAmount,
      interestApplied: false,
      interestAppliedAt: null,

      vatDocumentReceived: Boolean(body.vatDocumentReceived),
      aitDocumentReceived: Boolean(body.aitDocumentReceived),
      vatDocumentNote: body.vatDocumentNote || "",
      aitDocumentNote: body.aitDocumentNote || "",

      totalCost,
      totalProfit,

      note: body.note || "",
      status: body.status || "completed",
    });

    await reduceStockAfterSale({ items, tenant });

    await MarketingOfficerLedger.create({
      companyId: tenant.companyId,
      marketingOfficerId: marketingOfficer._id,
      marketingOfficerName: marketingOfficer.name,
      date,
      type: "sale",
      referenceType: "sale",
      referenceId: sale._id,
      invoiceNo: billNo,
      customerId: customer?._id || null,
      customerName,
      totalSales: tax.invoiceTotal,
      cashSales: paidAmount,
      dueSales: statementDueAmount,
      collectionAmount: paidAmount,
      dueAmount: statementDueAmount,
      profitAmount: totalProfit,
      nextCollectionDate,
      collectionComment,
      note: body.note || "",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    if (sale.nextCollectionDate && Number(sale.dueAmount || 0) > 0) {
      await Notification.create({
        companyId: tenant.companyId,
        type: "warning",
        title: "Customer Due Reminder",
        message: `${sale.customerName} এর due collection date ${
          sale.nextCollectionDate
        }. Due ৳ ${Number(sale.dueAmount || 0).toFixed(2)}`,
        refType: "sale_due",
        refId: sale._id,
        path: "/customers/statement?dueToday=true",
        read: false,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });
    }

    if (paidAmount > 0 && body.paymentTo === "bank") {
      await BankTransaction.create({
        companyId: tenant.companyId,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",

        bankId: body.bankId,
        type: "in",
        category: paymentType === "cash" ? "cash_sale" : "due_collection",
        title: `Bank received from sale ${billNo}`,
        amount: paidAmount,

        paymentMethod: body.paymentMethod || "bank",
        chequeNo: body.chequeNo || "",
        transactionId: body.transactionId || "",

        personName: customerName,
        personType: "customer",

        customerId: customer?._id || null,
        customerName,
        customerPhone: body.customerPhone || customer?.phone || "",

        saleId: sale._id,
        billNo,

        marketingOfficerId: marketingOfficer._id,
        marketingOfficerName: marketingOfficer.name,

        date,
        note: body.note || "",

        refType: "sale",
        refId: sale._id.toString(),

        balanceBefore: bankInfo?.balanceBefore || 0,
        balanceAfter: bankInfo?.balanceAfter || 0,
        status: "active",
      });
    }

    if (paidAmount > 0 && body.paymentTo !== "bank") {
      await CashTransaction.create({
        companyId: tenant.companyId,
        type: "in",
        category: paymentType === "cash" ? "cash_sale" : "due_collection",
        title: `Cash received from sale ${billNo}`,
        amount: paidAmount,

        balanceBefore: cashInfo?.balanceBefore || 0,
        balanceAfter: cashInfo?.balanceAfter || 0,

        date,
        note: body.note || "",
        refType: "sale",
        refId: sale._id.toString(),

        customerId: customer?._id || null,
        customerName,
        customerPhone: body.customerPhone || customer?.phone || "",

        saleId: sale._id,
        billNo,

        marketingOfficerId: marketingOfficer._id,
        marketingOfficerName: marketingOfficer.name,

        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
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

    const sub = await requireActiveSubscription(tenant);

    if (!sub.ok) {
      return NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
      );
    }

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const customerId = searchParams.get("customerId") || "";
    const marketingOfficerId = searchParams.get("marketingOfficerId") || "";
    const dueOnly = searchParams.get("dueOnly") || "";
    const collectionStatus = searchParams.get("collectionStatus") || "";
    const dueDate = searchParams.get("dueDate") || "";
    const dueBefore = searchParams.get("dueBefore") || "";
    const dueToday = searchParams.get("dueToday") || "";

    const query = {
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    };

    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };

      query.$or = [
        { billNo: regex },
        { manualBillNo: regex },
        { invoiceNo: regex },
        { customerName: regex },
        { customerPhone: regex },
        { marketingOfficerName: regex },
        { note: regex },
        { collectionComment: regex },
        { lastCollectionComment: regex },
        { "dueSchedule.reminderNote": regex },
        { "items.name": regex },
        { "items.itemName": regex },
        { "items.productName": regex },
      ];
    }

    if (date) query.date = date;
    if (customerId) query.customerId = customerId;
    if (marketingOfficerId) query.marketingOfficerId = marketingOfficerId;
    if (dueOnly === "true") query.dueAmount = { $gt: 0 };
    if (collectionStatus) query.collectionStatus = collectionStatus;

    if (dueDate) {
      query.nextCollectionDate = dueDate;
    }

    if (dueBefore) {
      query.nextCollectionDate = { $lte: dueBefore };
      query.dueAmount = { $gt: 0 };
    }

    if (dueToday === "true") {
      query.nextCollectionDate = { $lte: today() };
      query.dueAmount = { $gt: 0 };
    }

    const sales = await Sale.find(query).sort({
      nextCollectionDate: 1,
      createdAt: -1,
    });

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