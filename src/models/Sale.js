import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      default: null,
    },

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
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    billNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

    items: {
      type: [SaleItemSchema],
      required: true,
      default: [],
    },

    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    afterDiscount: { type: Number, default: 0 },

    amountType: {
      type: String,
      enum: ["exclusive", "inclusive"],
      default: "exclusive",
    },

    salesAmount: { type: Number, default: 0 },
    baseSalesAmount: { type: Number, default: 0 },

    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },

    aitPercent: { type: Number, default: 0 },
    aitAmount: { type: Number, default: 0 },

    taxTotal: { type: Number, default: 0 },

    invoiceTotal: { type: Number, default: 0 },
    invoiceDueAmount: { type: Number, default: 0 },

    netReceivable: { type: Number, default: 0 },
    statementDueAmount: { type: Number, default: 0 },

    netSalesAmount: { type: Number, default: 0 },

    grossAmount: { type: Number, default: 0 },
    netTotal: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },

    paymentType: {
      type: String,
      enum: ["cash", "credit", "partial"],
      default: "credit",
      index: true,
    },

    paymentTo: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

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

    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: String,
      default: "",
      trim: true,
    },

    updatedBy: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["completed", "draft", "cancelled"],
      default: "completed",
      index: true,
    },
  },
  { timestamps: true }
);

SaleSchema.index({ companyId: 1, customerName: 1 });
SaleSchema.index({ companyId: 1, date: -1 });
SaleSchema.index({ companyId: 1, billNo: 1 }, { unique: true });
SaleSchema.index({ companyId: 1, status: 1 });
SaleSchema.index({ companyId: 1, paymentType: 1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);