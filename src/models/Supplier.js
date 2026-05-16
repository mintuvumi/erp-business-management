import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    supplierCode: {
      type: String,
      default: "",
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
    },

    contactPerson: {
      type: String,
      default: "",
      trim: true,
    },

    tradeLicense: {
      type: String,
      default: "",
      trim: true,
    },

    taxNumber: {
      type: String,
      default: "",
      trim: true,
    },

    openingDue: {
      type: Number,
      default: 0,
    },

    currentDue: {
      type: Number,
      default: 0,
    },

    totalPurchase: {
      type: Number,
      default: 0,
    },

    totalPaid: {
      type: Number,
      default: 0,
    },

    lastPurchaseDate: {
      type: String,
      default: "",
    },

    photo: {
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

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

SupplierSchema.index(
  {
    companyId: 1,
    name: 1,
    phone: 1,
  },
  { unique: true }
);

SupplierSchema.index({
  companyId: 1,
  supplierCode: 1,
});

SupplierSchema.pre("save", function () {
  if (!this.supplierCode) {
    this.supplierCode =
      "SUP-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

const Supplier =
  mongoose.models.Supplier ||
  mongoose.model("Supplier", SupplierSchema);

export default Supplier;