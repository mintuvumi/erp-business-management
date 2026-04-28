import mongoose from "mongoose";

const AdvanceSalarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    employeeName: { type: String, required: true },

    amount: { type: Number, required: true, default: 0 },

    paidBy: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },

    bankId: { type: String, default: "" },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    adjustedAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["open", "adjusted"],
      default: "open",
    },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.AdvanceSalary ||
  mongoose.model("AdvanceSalary", AdvanceSalarySchema);