import mongoose from "mongoose";

const EmployeeLoanSchema = new mongoose.Schema(
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

    loanNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    loanAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    monthlyInstallment: {
      type: Number,
      default: 0,
    },

    issueDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    startMonth: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    paymentMethod: {
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
      enum: ["open", "closed", "cancelled"],
      default: "open",
      index: true,
    },
  },
  { timestamps: true }
);

EmployeeLoanSchema.index({
  companyId: 1,
  employeeId: 1,
});

EmployeeLoanSchema.index({
  companyId: 1,
  status: 1,
});

EmployeeLoanSchema.pre("save", function () {
  if (!this.loanNo) {
    this.loanNo =
      "LOAN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!this.remainingAmount) {
    this.remainingAmount = Number(this.loanAmount || 0);
  }

  if (!this.startMonth) {
    this.startMonth = new Date().toISOString().slice(0, 7);
  }
});

export default mongoose.models.EmployeeLoan ||
  mongoose.model("EmployeeLoan", EmployeeLoanSchema);