import mongoose from "mongoose";

const EmployeeLoanInstallmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeLoan",
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

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    salaryPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryPayment",
      default: null,
      index: true,
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
  },
  { timestamps: true }
);

EmployeeLoanInstallmentSchema.index({
  companyId: 1,
  loanId: 1,
  month: 1,
});

EmployeeLoanInstallmentSchema.index({
  companyId: 1,
  employeeId: 1,
  month: 1,
});

export default mongoose.models.EmployeeLoanInstallment ||
  mongoose.model("EmployeeLoanInstallment", EmployeeLoanInstallmentSchema);