import mongoose from "mongoose";

const LoanSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    loanCode: {
      type: String,
      default: "",
      index: true,
    },

    loanType: {
      type: String,
      enum: ["bank", "personal", "investor", "microfinance"],
      default: "personal",
      index: true,
    },

    lenderName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    lenderPhone: {
      type: String,
      default: "",
      trim: true,
    },

    lenderAddress: {
      type: String,
      default: "",
      trim: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    interestPercent: {
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

    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "mobile_banking"],
      default: "cash",
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    monthlyInstallment: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    endDate: {
      type: String,
      default: "",
    },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
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
      enum: ["active", "closed", "cancelled"],
      default: "active",
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

LoanSchema.index({
  companyId: 1,
  lenderName: 1,
});

LoanSchema.index({
  companyId: 1,
  loanCode: 1,
});

LoanSchema.pre("save", function () {
  if (!this.loanCode) {
    this.loanCode =
      "LOAN-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  this.dueAmount = Math.max(
    Number(this.amount || 0) - Number(this.paidAmount || 0),
    0
  );
});

const Loan =
  mongoose.models.Loan || mongoose.model("Loan", LoanSchema);

export default Loan;