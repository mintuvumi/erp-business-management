import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    qty: { type: Number, required: true, default: 1 },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },

    price: { type: Number, required: true, default: 0 },

    sourceType: {
      type: String,
      enum: ["stock", "direct"],
      default: "stock",
    },

    purchasePrice: { type: Number, default: 0 },

    total: { type: Number, default: 0 },
    costTotal: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    // Invoice info
    billNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    manualBillNo: {
      type: String,
      default: "",
      trim: true,
    },

    poWoNo: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    // Customer info
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    customerAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // Product items
    items: {
      type: [SaleItemSchema],
      required: true,
      default: [],
    },

    // Sales calculation
    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    afterDiscount: { type: Number, default: 0 },

    amountType: {
      type: String,
      enum: ["exclusive", "inclusive"],
      default: "exclusive",
    },

    // Main sales amount after discount
    salesAmount: { type: Number, default: 0 },
    baseSalesAmount: { type: Number, default: 0 },

    // VAT
    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },

    // AIT
    aitPercent: { type: Number, default: 0 },
    aitAmount: { type: Number, default: 0 },

    taxTotal: { type: Number, default: 0 },

    /*
      Invoice / Bill Logic:
      Invoice Total = Sales Amount + VAT
      AIT invoice total-e add hobe na
    */
    invoiceTotal: { type: Number, default: 0 },
    invoiceDueAmount: { type: Number, default: 0 },

    /*
      Customer Statement Logic:
      Net Receivable = Sales Amount - VAT - AIT
      Statement Due = Net Receivable - Paid
    */
    netReceivable: { type: Number, default: 0 },
    statementDueAmount: { type: Number, default: 0 },

    // Dashboard Total Sales unchanged
    netSalesAmount: { type: Number, default: 0 },

    // Old compatible fields
    grossAmount: { type: Number, default: 0 },
    netTotal: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    // Payment
    paidAmount: { type: Number, default: 0 },

    paymentType: {
      type: String,
      enum: ["cash", "credit", "partial"],
      default: "credit",
    },

    // VAT / AIT document tracking
    vatDocumentReceived: { type: Boolean, default: false },
    aitDocumentReceived: { type: Boolean, default: false },

    vatDocumentNote: {
      type: String,
      default: "",
      trim: true,
    },

    aitDocumentNote: {
      type: String,
      default: "",
      trim: true,
    },

    // Profit
    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["completed", "draft", "cancelled"],
      default: "completed",
    },
  },
  { timestamps: true }
);

SaleSchema.index({ customerName: 1 });
SaleSchema.index({ date: 1 });
SaleSchema.index({ billNo: 1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);