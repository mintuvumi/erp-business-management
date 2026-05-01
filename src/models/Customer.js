import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },

    creditLimit: {
      type: Number,
      default: 0, // 0 হলে settings defaultCreditLimit ব্যবহার হবে
    },

    note: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 1 });

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);