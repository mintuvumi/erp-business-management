import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
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

    note: {
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

SupplierSchema.index({ name: 1, phone: 1 });

export default mongoose.models.Supplier ||
  mongoose.model("Supplier", SupplierSchema);