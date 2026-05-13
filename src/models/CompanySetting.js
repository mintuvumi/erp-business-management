import mongoose from "mongoose";

const CompanySettingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
      index: true,
    },

    companyName: {
      type: String,
      default: "NextCore ERP",
      trim: true,
    },

    companyCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    companyAddress: {
      type: String,
      default: "",
      trim: true,
    },

    companyPhone: {
      type: String,
      default: "",
      trim: true,
    },

    companyEmail: {
      type: String,
      default: "",
      trim: true,
    },

    companyWebsite: {
      type: String,
      default: "",
      trim: true,
    },

    tradeLicense: {
      type: String,
      default: "",
      trim: true,
    },

    tinNumber: {
      type: String,
      default: "",
      trim: true,
    },

    binNumber: {
      type: String,
      default: "",
      trim: true,
    },

    ownerName: {
      type: String,
      default: "Company User",
      trim: true,
    },

    ownerRole: {
      type: String,
      default: "Admin / Owner",
      trim: true,
    },

    currency: {
      type: String,
      default: "৳",
    },

    currencyCode: {
      type: String,
      default: "BDT",
    },

    vatPercent: {
      type: Number,
      default: 0,
    },

    aitPercent: {
      type: Number,
      default: 0,
    },

    lowStockLimit: {
      type: Number,
      default: 5,
    },

    themeColor: {
      type: String,
      default: "blue",
    },

    darkMode: {
      type: Boolean,
      default: false,
    },

    companySlogan: {
      type: String,
      default: "Your trusted business partner",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    favicon: {
      type: String,
      default: "",
    },

    signature: {
      type: String,
      default: "",
    },

    stamp: {
      type: String,
      default: "",
    },

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
      default:
        "Thank you for doing business with us.",
    },

    invoiceTemplate: {
      type: String,
      enum: ["modern", "classic", "simple"],
      default: "modern",
    },

    invoicePrefix: {
      type: String,
      default: "INV",
    },

    purchasePrefix: {
      type: String,
      default: "PUR",
    },

    customerPrefix: {
      type: String,
      default: "CUS",
    },

    supplierPrefix: {
      type: String,
      default: "SUP",
    },

    employeePrefix: {
      type: String,
      default: "EMP",
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

    whatsappEnabled: {
      type: Boolean,
      default: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
    },

    emailEnabled: {
      type: Boolean,
      default: false,
    },

    smsEnabled: {
      type: Boolean,
      default: false,
    },

    stockReportFooter: {
      type: String,
      default:
        "This report is system generated.",
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

    timezone: {
      type: String,
      default: "Asia/Dhaka",
    },

    language: {
      type: String,
      default: "bn",
    },

    financialYearStart: {
      type: String,
      default: "01-01",
    },

    backupEnabled: {
      type: Boolean,
      default: true,
    },

    autoBackupDaily: {
      type: Boolean,
      default: true,
    },

    aiEnabled: {
      type: Boolean,
      default: true,
    },

    multiUserEnabled: {
      type: Boolean,
      default: true,
    },

    attendanceEnabled: {
      type: Boolean,
      default: true,
    },

    payrollEnabled: {
      type: Boolean,
      default: true,
    },

    warehouseEnabled: {
      type: Boolean,
      default: false,
    },

    manufacturingEnabled: {
      type: Boolean,
      default: false,
    },

    pharmacyEnabled: {
      type: Boolean,
      default: false,
    },

    posEnabled: {
      type: Boolean,
      default: true,
    },

    ecommerceEnabled: {
      type: Boolean,
      default: false,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: String,
      default: "",
    },

    updatedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

CompanySettingSchema.index({
  companyId: 1,
});

CompanySettingSchema.index({
  companyCode: 1,
});

export default mongoose.models.CompanySetting ||
  mongoose.model(
    "CompanySetting",
    CompanySettingSchema
  );