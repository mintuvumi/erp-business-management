import mongoose from "mongoose";

const CompanySettingSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "NextCore ERP" },
    companyAddress: { type: String, default: "" },
    companyPhone: { type: String, default: "" },
    companyEmail: { type: String, default: "" },

    ownerName: { type: String, default: "Company User" },
    ownerRole: { type: String, default: "Admin / Owner" },

    currency: { type: String, default: "৳" },
    vatPercent: { type: Number, default: 0 },
    aitPercent: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 5 },

    themeColor: { type: String, default: "blue" },
    invoiceFooter: {
      type: String,
      default: "Thank you for doing business with us.",
    },

    logo: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.CompanySetting ||
  mongoose.model("CompanySetting", CompanySettingSchema);