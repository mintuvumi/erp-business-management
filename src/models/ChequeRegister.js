import mongoose from "mongoose";

const ChequeRegisterSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
      index: true,
    },

    bankName: { type: String, default: "", trim: true, index: true },
    chequeNo: { type: String, required: true, trim: true, index: true },
    payTo: { type: String, default: "", trim: true, index: true },
    amount: { type: Number, default: 0, min: 0 },

    chequeDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    sourceType: {
      type: String,
      enum: ["bank", "supplier", "customer", "expense", "salary", "loan", "owner", "other"],
      default: "bank",
      index: true,
    },

    transactionId: { type: String, default: "", trim: true, index: true },

    status: {
      type: String,
      enum: ["pending", "printed", "issued", "cleared", "cancelled", "void"],
      default: "pending",
      index: true,
    },

    printCount: { type: Number, default: 0 },
    lastPrintedAt: { type: Date, default: null },

    note: { type: String, default: "", trim: true },

    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: String, default: "", trim: true },
    updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

ChequeRegisterSchema.index(
  { companyId: 1, bankId: 1, chequeNo: 1 },
  { unique: true }
);

export default mongoose.models.ChequeRegister ||
  mongoose.model("ChequeRegister", ChequeRegisterSchema);