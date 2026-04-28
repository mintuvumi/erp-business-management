import mongoose from "mongoose";

const CashTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
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
    },

    title: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    note: { type: String, default: "" },

    // 🔥 NEW (IMPORTANT)
    refType: { type: String, default: "" }, // sale / purchase / manual
    refId: { type: String, default: "" },

    // optional future optimization
    balanceAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.CashTransaction ||
  mongoose.model("CashTransaction", CashTransactionSchema);