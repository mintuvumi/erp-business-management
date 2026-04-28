import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    purchaseType: {
      type: String,
      enum: ["stock", "direct"],
      default: "stock",
    },

    paymentType: {
      type: String,
      enum: ["cash", "credit"],
      default: "cash",
    },

    supplierName: { type: String, default: "" },

    dueAmount: { type: Number, default: 0 },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Purchase ||
  mongoose.model("Purchase", PurchaseSchema);