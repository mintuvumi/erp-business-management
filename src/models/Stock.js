import mongoose from "mongoose";

const StockSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, unique: true },

    qty: { type: Number, default: 0 }, // total pcs

    avgCost: { type: Number, default: 0 }, // average purchase price

    totalValue: { type: Number, default: 0 }, // qty * avgCost

    lowStockLimit: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export default mongoose.models.Stock ||
  mongoose.model("Stock", StockSchema);