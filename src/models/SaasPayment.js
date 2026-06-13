import mongoose from "mongoose";

const SaasPaymentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    billingMonth: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
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

    paymentMethod: {
      type: String,
      enum: ["bkash", "nagad", "rocket", "upay", "bank", "card", "cash", "manual"],
      default: "manual",
      index: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    paidDate: {
      type: String,
      default: "",
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "unpaid"],
      default: "pending",
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    approvedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

SaasPaymentSchema.pre("save", function () {
  this.dueAmount = Math.max(
    Number(this.amount || 0) - Number(this.paidAmount || 0),
    0
  );
});

export default mongoose.models.SaasPayment ||
  mongoose.model("SaasPayment", SaasPaymentSchema);