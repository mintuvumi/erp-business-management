import mongoose from "mongoose";

const ChequeTemplateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    chequeWidthMm: {
      type: Number,
      default: 203,
    },

    chequeHeightMm: {
      type: Number,
      default: 92,
    },

    payTo: {
      topMm: { type: Number, default: 32 },
      leftMm: { type: Number, default: 20 },
      fontSize: { type: Number, default: 12 },
    },

    amountNumber: {
      topMm: { type: Number, default: 32 },
      leftMm: { type: Number, default: 155 },
      fontSize: { type: Number, default: 12 },
    },

    amountWords: {
      topMm: { type: Number, default: 48 },
      leftMm: { type: Number, default: 20 },
      fontSize: { type: Number, default: 11 },
      widthMm: { type: Number, default: 150 },
    },

    date: {
      topMm: { type: Number, default: 18 },
      leftMm: { type: Number, default: 150 },
      fontSize: { type: Number, default: 12 },
    },

    isDefault: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const ChequeTemplate =
  mongoose.models.ChequeTemplate ||
  mongoose.model("ChequeTemplate", ChequeTemplateSchema);

export default ChequeTemplate;