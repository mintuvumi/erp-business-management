import mongoose from "mongoose";

const SalaryPaymentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    employeeName: { type: String, required: true },

    month: { type: String, required: true }, // 2026-05

    basicSalary: { type: Number, default: 0 },
    overtimeAmount: { type: Number, default: 0 },
    bonusAmount: { type: Number, default: 0 },
    absentDeduction: { type: Number, default: 0 },

    advanceDeduction: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },

    finalSalary: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },

    bankId: { type: String, default: "" },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.SalaryPayment ||
  mongoose.model("SalaryPayment", SalaryPaymentSchema);