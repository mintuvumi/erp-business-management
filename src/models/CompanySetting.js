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

    invoiceTerms: {
    type: String,
    default:
    "Goods once sold are not refundable without company approval.",
   },

    invoiceNote: {
    type: String,
    default: "",
    },

    invoiceFooter: {
      type: String,
      default: "Thank you for doing business with us.",
    },

    companySlogan: {
      type: String,
      default: "Your trusted business partner",
    },

    logo: { type: String, default: "" },

    /*
      Credit Control Settings
      ছোট ব্যবসা: 30,000 / 50,000
      মাঝারি ব্যবসা: 1,00,000 - 5,00,000
      বড় ব্যবসা: 10,00,000 - 50,00,000+
    */
    creditApprovalRequired: { type: Boolean, default: true },

    defaultCreditLimit: {
      type: Number,
      default: 50000,
    },

    ownerPin: {
      type: String,
      default: "1234",
    },

    allowCreditLimitOverride: {
      type: Boolean,
      default: true,
    },

    creditWarningMessage: {
      type: String,
      default:
        "Customer credit limit exceeded. Owner approval is required.",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CompanySetting ||
  mongoose.model("CompanySetting", CompanySettingSchema);