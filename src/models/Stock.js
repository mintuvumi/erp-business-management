import mongoose from "mongoose";

const StockSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    productCode: {
      type: String,
      default: "",
      index: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    sku: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    barcode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    warehouse: {
      type: String,
      default: "Main Warehouse",
      trim: true,
    },

    rackNo: {
      type: String,
      default: "",
      trim: true,
    },

    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },

    qty: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    avgCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastPurchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    wholesalePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    lowStockLimit: {
      type: Number,
      default: 5,
      min: 0,
    },

    expiryDate: {
      type: String,
      default: "",
    },

    manufacturingDate: {
      type: String,
      default: "",
    },

    supplierName: {
      type: String,
      default: "",
      trim: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    image: {
      type: String,
      default: "",
    },

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
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

StockSchema.index(
  {
    companyId: 1,
    itemName: 1,
  },
  { unique: true }
);

StockSchema.index({
  companyId: 1,
  barcode: 1,
});

StockSchema.index({
  companyId: 1,
  sku: 1,
});

StockSchema.index({
  companyId: 1,
  category: 1,
});

StockSchema.pre("save", function () {
  if (!this.productCode) {
    this.productCode =
      "PRD-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  this.availableQty =
    Number(this.qty || 0) - Number(this.reservedQty || 0);

  this.totalValue =
    Number(this.qty || 0) * Number(this.avgCost || 0);
});

const Stock =
  mongoose.models.Stock || mongoose.model("Stock", StockSchema);

export default Stock;