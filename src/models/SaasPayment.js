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

    invoiceNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "bkash",
        "nagad",
        "rocket",
        "upay",
        "bank",
        "card",
        "cash",
        "manual",
      ],
      default: "manual",
      index: true,
    },

    senderNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    paymentScreenshot: {
      type: String,
      default: "",
      trim: true,
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

    rejectReason: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    submittedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    submittedBy: {
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

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

SaasPaymentSchema.pre("save", function () {
  this.amount = Number(this.amount || 0);
  this.paidAmount = Number(this.paidAmount || 0);

  this.dueAmount = Math.max(this.amount - this.paidAmount, 0);

  if (!this.invoiceNo) {
    const ym = this.billingMonth
      ? this.billingMonth.replace("-", "")
      : new Date().toISOString().slice(0, 7).replace("-", "");

    this.invoiceNo =
      "SINV-" + ym + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  }
});

SaasPaymentSchema.index({ companyId: 1, billingMonth: 1 });
SaasPaymentSchema.index({ companyId: 1, status: 1 });
SaasPaymentSchema.index({ transactionId: 1, paymentMethod: 1 });

export default mongoose.models.SaasPayment ||
  mongoose.model("SaasPayment", SaasPaymentSchema);