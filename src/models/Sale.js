import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true, default: 0 },

    sourceType: {
      type: String,
      enum: ["stock", "direct"],
      default: "stock",
    },

    purchasePrice: {
      type: Number,
      default: 0,
    },

    total: { type: Number, default: 0 },
    costTotal: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },

    customerName: { type: String, required: true },
    customerPhone: { type: String, default: "" },

    items: { type: [SaleItemSchema], required: true },

    // item subtotal before discount
    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    afterDiscount: { type: Number, default: 0 },

    // VAT/AIT calculation mode
    amountType: {
      type: String,
      enum: ["exclusive", "inclusive"],
      default: "exclusive",
    },

    // sales amount used for VAT/AIT calculation
    salesAmount: { type: Number, default: 0 },

    // VAT/AIT excluded actual sales amount
    baseSalesAmount: { type: Number, default: 0 },

    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },

    aitPercent: { type: Number, default: 0 },
    aitAmount: { type: Number, default: 0 },

    taxTotal: { type: Number, default: 0 },

    // amount including VAT/AIT where applicable
    grossAmount: { type: Number, default: 0 },

    // customer will pay after deducting VAT/AIT
    netReceivable: { type: Number, default: 0 },

    // dashboard Total Sales should use this value
    netSalesAmount: { type: Number, default: 0 },

    // old compatible field
    netTotal: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paymentType: {
      type: String,
      enum: ["cash", "credit", "partial"],
      default: "cash",
    },

    vatDocumentReceived: { type: Boolean, default: false },
    aitDocumentReceived: { type: Boolean, default: false },

    vatDocumentNote: { type: String, default: "" },
    aitDocumentNote: { type: String, default: "" },

    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },

    note: { type: String, default: "" },

    status: {
      type: String,
      enum: ["completed", "draft", "cancelled"],
      default: "completed",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);