import mongoose from "mongoose";

const AdvanceSalarySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    employeeCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    salaryAmount: {
      type: Number,
      default: 0,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    adjustedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    voucherNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    receiptNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    paidBy: {
      type: String,
      enum: ["cash", "bank", "mobile_banking"],
      default: "cash",
      index: true,
    },

    paymentTo: {
      type: String,
      enum: ["cash", "bank", "mobile_banking"],
      default: "cash",
      index: true,
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
      index: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    mobileBankingType: {
      type: String,
      default: "",
      trim: true,
    },

    mobileBankingNo: {
      type: String,
      default: "",
      trim: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "cheque", "online", "mobile_banking"],
      default: "cash",
      index: true,
    },

    transactionNo: {
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

    chequeNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    cashTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashTransaction",
      default: null,
    },

    bankTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankTransaction",
      default: null,
    },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    month: {
      type: String,
      default: () => new Date().toISOString().slice(0, 7),
      index: true,
    },

    adjustmentMonth: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    salaryPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryPayment",
      default: null,
      index: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["open", "adjusted", "cancelled"],
      default: "open",
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
  },
  { timestamps: true }
);

AdvanceSalarySchema.pre("save", function () {
  const amount = Number(this.amount || 0);
  const adjusted = Number(this.adjustedAmount || 0);

  this.remainingAmount = Math.max(amount - adjusted, 0);

  if (this.remainingAmount <= 0 && this.status !== "cancelled") {
    this.status = "adjusted";
  }

  if (this.remainingAmount > 0 && this.status !== "cancelled") {
    this.status = "open";
  }

  if (!this.paymentTo) {
    this.paymentTo = this.paidBy || "cash";
  }

  if (!this.paidBy) {
    this.paidBy = this.paymentTo || "cash";
  }

  if (!this.paymentMethod) {
    this.paymentMethod =
      this.paymentTo === "bank"
        ? "bank"
        : this.paymentTo === "mobile_banking"
        ? "mobile_banking"
        : "cash";
  }

  if (!this.month && this.date) {
    this.month = String(this.date).slice(0, 7);
  }

  if (!this.voucherNo) {
    this.voucherNo =
      "ADV-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!this.receiptNo) {
    this.receiptNo =
      "AR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

AdvanceSalarySchema.index({ companyId: 1, employeeId: 1 });
AdvanceSalarySchema.index({ companyId: 1, employeeName: 1 });
AdvanceSalarySchema.index({ companyId: 1, phone: 1 });
AdvanceSalarySchema.index({ companyId: 1, status: 1 });
AdvanceSalarySchema.index({ companyId: 1, date: -1 });
AdvanceSalarySchema.index({ companyId: 1, month: 1 });
AdvanceSalarySchema.index({ companyId: 1, voucherNo: 1 });

export default mongoose.models.AdvanceSalary ||
  mongoose.model("AdvanceSalary", AdvanceSalarySchema);