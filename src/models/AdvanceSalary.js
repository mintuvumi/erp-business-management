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
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    paidBy: {
      type: String,
      enum: ["cash", "bank", "mobile_banking"],
      default: "cash",
      index: true,
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    mobileBankingType: {
      type: String,
      default: "",
      trim: true,
    },

    transactionNo: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    adjustedAmount: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    adjustmentMonth: {
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
      enum: ["open", "adjusted", "cancelled"],
      default: "open",
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

AdvanceSalarySchema.index({
  companyId: 1,
  employeeId: 1,
});

AdvanceSalarySchema.index({
  companyId: 1,
  status: 1,
});

export default mongoose.models.AdvanceSalary ||
  mongoose.model("AdvanceSalary", AdvanceSalarySchema);