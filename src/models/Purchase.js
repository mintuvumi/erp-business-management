import mongoose from "mongoose";

const PurchaseItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      default: null,
    },
    qty: { type: Number, default: 1, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const PurchaseSchema = new mongoose.Schema(
  {
    purchaseNo: {
      type: String,
      default: "",
      index: true,
    },

    supplierBillNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    supplierInvoiceNo: {
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

    supplierName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    supplierPhone: {
      type: String,
      default: "",
      trim: true,
    },

    supplierAddress: {
      type: String,
      default: "",
      trim: true,
    },

    items: {
      type: [PurchaseItemSchema],
      default: [],
    },

    itemName: {
      type: String,
      default: "",
      trim: true,
    },

    qty: {
      type: Number,
      default: 1,
    },

    price: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },

    subTotal: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    transportCost: {
      type: Number,
      default: 0,
    },

    otherCost: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
    },

    purchaseType: {
      type: String,
      enum: ["stock", "direct"],
      default: "stock",
      index: true,
    },

    paymentType: {
      type: String,
      enum: ["cash", "credit", "partial"],
      default: "cash",
      index: true,
    },

    paymentFrom: {
      type: String,
      enum: ["cash", "bank", "none"],
      default: "cash",
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    paymentMethod: {
      type: String,
      default: "cash",
      trim: true,
    },

    chequeNo: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },

    createdBy: {
      type: String,
      default: "",
    },

    updatedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

PurchaseSchema.pre("save", function (next) {
  if (!this.purchaseNo) {
    this.purchaseNo = `PUR-${Date.now()}`;
  }

  if (this.items && this.items.length > 0) {
    this.items = this.items.map((item) => ({
      ...item,
      total: Number(item.qty || 0) * Number(item.price || 0),
    }));

    this.subTotal = this.items.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    this.itemName = this.items[0]?.itemName || "";
    this.qty = this.items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    this.price = this.items[0]?.price || 0;
    this.total = this.subTotal;
  } else {
    this.total = Number(this.qty || 0) * Number(this.price || 0);
    this.subTotal = this.total;
  }

  this.grandTotal =
    Number(this.subTotal || 0) -
    Number(this.discount || 0) +
    Number(this.transportCost || 0) +
    Number(this.otherCost || 0);

  this.dueAmount = Math.max(
    Number(this.grandTotal || 0) - Number(this.paidAmount || 0),
    0
  );

  if (this.dueAmount <= 0) {
    this.paymentType = "cash";
  } else if (Number(this.paidAmount || 0) > 0) {
    this.paymentType = "partial";
  } else {
    this.paymentType = "credit";
  }

  next();
});

export default mongoose.models.Purchase ||
  mongoose.model("Purchase", PurchaseSchema);