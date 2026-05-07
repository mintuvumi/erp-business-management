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

    companySlogan: {
      type: String,
      default: "Your trusted business partner",
    },

    logo: { type: String, default: "" },
    signature: { type: String, default: "" },
    stamp: { type: String, default: "" },

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

    defaultDueMode: {
      type: String,
      enum: ["show", "add", "hide"],
      default: "show",
    },

    printColor: {
      type: Boolean,
      default: true,
    },

    pdfEnabled: {
      type: Boolean,
      default: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
    },

    invoiceTemplate: {
      type: String,
      enum: ["modern", "classic", "simple"],
      default: "modern",
    },

    stockReportFooter: {
      type: String,
      default: "This report is system generated.",
    },

    creditApprovalRequired: {
      type: Boolean,
      default: true,
    },

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