import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    customerCode: {
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

    customerType: {
      type: String,
      enum: ["retail", "wholesale", "dealer", "corporate"],
      default: "retail",
      index: true,
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

    totalSales: {
      type: Number,
      default: 0,
    },

    totalPaid: {
      type: Number,
      default: 0,
    },

    creditLimit: {
      type: Number,
      default: 0,
    },

    lastSaleDate: {
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

CustomerSchema.index(
  {
    companyId: 1,
    name: 1,
    phone: 1,
  },
  { unique: true }
);

CustomerSchema.index({
  companyId: 1,
  customerCode: 1,
});

CustomerSchema.pre("save", function () {
  if (!this.customerCode) {
    this.customerCode =
      "CUS-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

const Customer =
  mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);

export default Customer;