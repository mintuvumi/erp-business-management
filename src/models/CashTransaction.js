import mongoose from "mongoose";

const CashTransactionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "cash_sale",
        "due_collection",
        "other_income",
        "bank_withdraw",
        "refund_received",

        "cash_purchase",
        "expense",
        "supplier_payment",
        "salary_payment",
        "bank_deposit",
        "refund_paid",
      ],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
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

    head: {
      type: String,
      default: "",
      trim: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    employeeName: {
      type: String,
      default: "",
      trim: true,
    },

    paymentType: {
      type: String,
      default: "Cash",
      trim: true,
    },

    paymentFrom: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    refType: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    refId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    balanceAfter: {
      type: Number,
      default: 0,
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
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

CashTransactionSchema.index({ companyId: 1, date: -1 });
CashTransactionSchema.index({ companyId: 1, category: 1 });
CashTransactionSchema.index({ companyId: 1, type: 1 });
CashTransactionSchema.index({ companyId: 1, status: 1 });

export default mongoose.models.CashTransaction ||
  mongoose.model("CashTransaction", CashTransactionSchema);