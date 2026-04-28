import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import Stock from "@/models/Stock";
import connectDB from "@/lib/db";
import generateBillNo from "@/utils/generateBillNo";
import CashTransaction from "@/models/CashTransaction";

function calculateTax({ salesAmount, vatPercent, aitPercent, amountType }) {
  const amount = Number(salesAmount) || 0;
  const vatRate = Number(vatPercent) || 0;
  const aitRate = Number(aitPercent) || 0;

  let baseSalesAmount = 0;
  let vatAmount = 0;
  let aitAmount = 0;
  let grossAmount = 0;
  let netReceivable = 0;

  if (amountType === "inclusive") {
    baseSalesAmount = vatRate > 0 ? (amount * 100) / (100 + vatRate) : amount;
    vatAmount = amount - baseSalesAmount;
    aitAmount = (baseSalesAmount * aitRate) / 100;
    grossAmount = amount;
    netReceivable = grossAmount - vatAmount - aitAmount;
  } else {
    baseSalesAmount = amount;
    vatAmount = (baseSalesAmount * vatRate) / 100;
    aitAmount = (baseSalesAmount * aitRate) / 100;
    grossAmount = baseSalesAmount + vatAmount + aitAmount;
    netReceivable = grossAmount - vatAmount - aitAmount;
  }

  return {
    baseSalesAmount,
    vatAmount,
    aitAmount,
    taxTotal: vatAmount + aitAmount,
    grossAmount,
    netReceivable,
    netSalesAmount: baseSalesAmount,
  };
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Items required" },
        { status: 400 }
      );
    }

    for (const item of body.items) {
      if (item.sourceType === "stock") {
        const stock = await Stock.findOne({
          itemName: item.name,
        });

        if (!stock) {
          return NextResponse.json(
            {
              success: false,
              message: `Stock not found for ${item.name}`,
            },
            { status: 400 }
          );
        }

        if (Number(stock.qty) < Number(item.qty)) {
          return NextResponse.json(
            {
              success: false,
              message: `Not enough stock for ${item.name}`,
            },
            { status: 400 }
          );
        }

        stock.qty = Number(stock.qty) - Number(item.qty);
        stock.totalValue = Number(stock.qty) * Number(stock.avgCost || 0);

        await stock.save();
      }
    }

    const count = await Sale.countDocuments();
    const billNo = generateBillNo(count);

    const items = body.items.map((i) => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.price) || 0;
      const purchasePrice = Number(i.purchasePrice) || 0;

      const total = qty * price;
      const costTotal = qty * purchasePrice;
      const profit = total - costTotal;

      return {
        ...i,
        qty,
        price,
        purchasePrice,
        total,
        costTotal,
        profit,
      };
    });

    const subTotal = items.reduce((sum, i) => sum + i.total, 0);
    const totalCost = items.reduce((sum, i) => sum + i.costTotal, 0);
    const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);

    const discount = Number(body.discount) || 0;
    const afterDiscount = Math.max(subTotal - discount, 0);

    const amountType = body.amountType || "exclusive";

    const salesAmount =
      Number(body.salesAmount) > 0 ? Number(body.salesAmount) : afterDiscount;

    const vatPercent = Number(body.vatPercent) || 0;
    const aitPercent = Number(body.aitPercent) || 0;

    const tax = calculateTax({
      salesAmount,
      vatPercent,
      aitPercent,
      amountType,
    });

    const paidAmount = Number(body.paidAmount) || 0;
    const dueAmount = Math.max(tax.netReceivable - paidAmount, 0);

    const paymentType =
      paidAmount <= 0
        ? "credit"
        : paidAmount >= tax.netReceivable
        ? "cash"
        : "partial";

    const sale = await Sale.create({
      ...body,
      billNo,
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
      netReceivable: tax.netReceivable,
      netSalesAmount: tax.netSalesAmount,

      // old compatible field
      netTotal: tax.netReceivable,

      paidAmount,
      dueAmount,
      paymentType,

      vatDocumentReceived: Boolean(body.vatDocumentReceived),
      aitDocumentReceived: Boolean(body.aitDocumentReceived),
      vatDocumentNote: body.vatDocumentNote || "",
      aitDocumentNote: body.aitDocumentNote || "",

      totalCost,
      totalProfit,
    });

    if (paidAmount > 0) {
      await CashTransaction.create({
        type: "in",
        category: "cash_sale",
        title: `Cash received from sale ${billNo}`,
        amount: paidAmount,
        date: body.date || new Date().toISOString().slice(0, 10),
        note: body.note || "",
        refType: "sale",
        refId: sale._id.toString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sale created successfully",
        data: sale,
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

export async function GET() {
  try {
    await connectDB();

    const sales = await Sale.find().sort({ createdAt: -1 });

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