import mongoose from "mongoose";

const LoanSchema = new mongoose.Schema(
  {
    loanType: {
      type: String,
      enum: ["bank", "personal"],
      default: "personal",
    },
    lenderName: { type: String, required: true },
    amount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    }, 
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Loan || mongoose.model("Loan", LoanSchema);