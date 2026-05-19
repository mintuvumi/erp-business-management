import mongoose from "mongoose";

const OfferItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      default: null,
    },

    itemName: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    brand: {
      type: String,
      default: "",
    },

    unit: {
      type: String,
      default: "pcs",
    },

    qty: {
      type: Number,
      default: 1,
    },

    purchasePrice: {
      type: Number,
    },

    marginPercent: {
      type: Number,
      default: 20,
    },

    unitPrice: {
      type: Number,
    },

    total: {
      type: Number,
    },

    profitAmount: {
      type: Number,
    },
  },
  { _id: false }
);

const EngineeringOfferSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    offerNo: {
      type: String,
      required: true,
      unique: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      default: "",
    },

    customerEmail: {
      type: String,
      default: "",
    },

    projectName: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      default: "",
    },

    reference: {
      type: String,
      default: "",
    },

    validity: {
      type: String,
      default: "7 Days",
    },

    deliveryTime: {
      type: String,
      default: "",
    },

    technicalDescription: {
      type: String,
      default: "",
    },

    commercialTerms: {
      type: String,
      default: "",
    },

    items: [OfferItemSchema],

    subtotal: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    vat: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    totalCosting: {
      type: Number,
      default: 0,
    },

    totalProfit: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "rejected",
      ],
      default: "draft",
    },

    createdBy: {
      userId: String,
      name: String,
      role: String,
    },
  },
  { timestamps: true }
);

const EngineeringOffer =
  mongoose.models.EngineeringOffer ||
  mongoose.model(
    "EngineeringOffer",
    EngineeringOfferSchema
  );

export default EngineeringOffer;