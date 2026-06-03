import mongoose from "mongoose";

const SalaryPaymentSchema = new mongoose.Schema(
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

    month: {
      type: String,
      required: true,
      index: true,
    },

    basicSalary: {
      type: Number,
      default: 0,
    },

    overtimeAmount: {
      type: Number,
      default: 0,
    },

    bonusAmount: {
      type: Number,
      default: 0,
    },

    absentDeduction: {
      type: Number,
      default: 0,
    },

    advanceDeduction: {
      type: Number,
      default: 0,
    },

    loanDeduction: {
      type: Number,
      default: 0,
    },

    finalSalary: {
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

    paymentStatus: {
  type: String,
  enum: ["paid", "partial", "due"],
  default: "due",
  index: true,
},

    approvalStatus: {
    type: String,
    enum: ["draft", "approved", "paid"],
    default: "draft",
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
  },
  { timestamps: true }
);

SalaryPaymentSchema.index({
  companyId: 1,
  employeeId: 1,
  month: 1,
});

SalaryPaymentSchema.index({
  companyId: 1,
  paymentStatus: 1,
});

export default mongoose.models.SalaryPayment ||
  mongoose.model("SalaryPayment", SalaryPaymentSchema);