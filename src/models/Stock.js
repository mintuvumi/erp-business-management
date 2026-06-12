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
      trim: true,
    },

    code: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    productName: {
      type: String,
      default: "",
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
      index: true,
    },

    model: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    productType: {
      type: String,
      enum: ["trading", "raw_material", "finished_goods", "service"],
      default: "trading",
      index: true,
    },

    warehouse: {
      type: String,
      default: "Main Warehouse",
      trim: true,
      index: true,
    },

    rackNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
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

    quantity: {
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

    lastPurchaseDate: {
      type: String,
      default: "",
      index: true,
    },

    lastSupplierName: {
      type: String,
      default: "",
      trim: true,
    },

    lastSupplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    lastProductionCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    avgProductionCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastProductionDate: {
      type: String,
      default: "",
      index: true,
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
      index: true,
    },

    manufacturingDate: {
      type: String,
      default: "",
    },

    supplierName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
      index: true,
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
      index: true,
    },

    createdBy: {
      type: String,
      default: "",
      trim: true,
    },

    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

StockSchema.pre("save", function () {
  if (!this.productCode) {
    this.productCode =
      "PRD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!this.code) {
    this.code = this.productCode;
  }

  if (!this.productName) {
    this.productName = this.itemName;
  }

  if (!this.itemName && this.productName) {
    this.itemName = this.productName;
  }

  this.qty = Number(this.qty || 0);
  this.quantity = this.qty;

  this.reservedQty = Number(this.reservedQty || 0);
  this.availableQty = Math.max(this.qty - this.reservedQty, 0);

  const cost =
    this.productType === "finished_goods"
      ? Number(this.avgProductionCost || this.lastProductionCost || 0)
      : Number(this.avgCost || this.lastPurchasePrice || 0);

  this.totalValue = Number(this.qty || 0) * cost;
});

StockSchema.index({ companyId: 1, itemName: 1 }, { unique: true });
StockSchema.index({ companyId: 1, productName: 1 });
StockSchema.index({ companyId: 1, productCode: 1 });
StockSchema.index({ companyId: 1, code: 1 });
StockSchema.index({ companyId: 1, barcode: 1 });
StockSchema.index({ companyId: 1, sku: 1 });
StockSchema.index({ companyId: 1, category: 1 });
StockSchema.index({ companyId: 1, productType: 1 });
StockSchema.index({ companyId: 1, status: 1 });
StockSchema.index({ companyId: 1, supplierId: 1 });

const Stock = mongoose.models.Stock || mongoose.model("Stock", StockSchema);

export default Stock;