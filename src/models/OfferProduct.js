import mongoose from "mongoose";

const OfferProductSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "",
      trim: true,
    },

    icu: {
      type: String,
      default: "",
    },

    tripUnit: {
      type: String,
      default: "",
    },

    productCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    unit: {
      type: String,
      default: "Nos.",
    },

    listedPrice: {
      type: Number,
      default: 0,
    },

    technicalDescription: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

OfferProductSchema.index({
  companyId: 1,
  productName: 1,
  brand: 1,
});

const OfferProduct =
  mongoose.models.OfferProduct ||
  mongoose.model("OfferProduct", OfferProductSchema);

export default OfferProduct;