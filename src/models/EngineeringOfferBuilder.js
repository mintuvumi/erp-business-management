import mongoose from "mongoose";

const EngineeringOfferBuilderSchema = new mongoose.Schema(
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
      index: true,
    },

    title: String,
    subject: String,
    description: String,

    profitPercent: {
      type: Number,
      default: 20,
    },

    offerData: {
      type: Object,
      default: {},
    },

    createdBy: {
      userId: String,
      name: String,
      role: String,
    },

    status: {
      type: String,
      default: "draft",
    },
  },
  { timestamps: true }
);

const EngineeringOfferBuilder =
  mongoose.models.EngineeringOfferBuilder ||
  mongoose.model("EngineeringOfferBuilder", EngineeringOfferBuilderSchema);

export default EngineeringOfferBuilder;