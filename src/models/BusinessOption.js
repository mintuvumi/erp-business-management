import mongoose from "mongoose";

const BusinessOptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["expense_head", "income_head", "payment_type"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
  },
  { timestamps: true }
);

BusinessOptionSchema.index({ type: 1, name: 1 }, { unique: true });

export default mongoose.models.BusinessOption ||
  mongoose.model("BusinessOption", BusinessOptionSchema);