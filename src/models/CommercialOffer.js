import mongoose from "mongoose";

const CommercialOfferSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    offerNo: {
      type: String,
      default: "",
      index: true,
    },

    referenceNo: { type: String, default: "" },
    customerName: { type: String, default: "" },
    customerAddress: { type: String, default: "" },
    kindAttention: { type: String, default: "" },
    subject: { type: String, default: "" },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    validDate: { type: String, default: "" },
    requisitionNo: { type: String, default: "N/A" },

    items: { type: Array, default: [] },
    extraRows: { type: Array, default: [] },
    terms: { type: Array, default: [] },

    discount: { type: Number, default: 0 },
    vatPercent: { type: Number, default: 0 },

    totals: { type: Object, default: {} },
    status: {
      type: String,
      enum: ["draft", "final", "cancelled"],
      default: "draft",
    },
  },
  { timestamps: true }
);

CommercialOfferSchema.index({ companyId: 1, offerNo: 1 });

const CommercialOffer =
  mongoose.models.CommercialOffer ||
  mongoose.model("CommercialOffer", CommercialOfferSchema);

export default CommercialOffer;