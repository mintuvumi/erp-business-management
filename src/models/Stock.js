import mongoose from "mongoose";

const StockSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      default: "",
      trim: true,
    },

    barcode: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    unit: {
      type: String,
      default: "pcs",
    },

    qty: {
      type: Number,
      default: 0,
    },

    avgCost: {
      type: Number,
      default: 0,
    },

    salePrice: {
      type: Number,
      default: 0,
    },

    totalValue: {
      type: Number,
      default: 0,
    },

    lowStockLimit: {
      type: Number,
      default: 5,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

StockSchema.index({ companyId: 1, itemName: 1 }, { unique: true });
StockSchema.index({ companyId: 1, barcode: 1 });
StockSchema.index({ companyId: 1, sku: 1 });

export default mongoose.models.Stock ||
  mongoose.model("Stock", StockSchema);