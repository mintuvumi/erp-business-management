import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  companyId: String,
  customer: String,
  total: Number,
  paid: Number,
  due: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Sale", saleSchema);