import mongoose from "mongoose";

const CompanySettingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    companyName: { type: String, default: "SeeERP", trim: true },
    companyCode: { type: String, default: "", trim: true },
    companyAddress: { type: String, default: "", trim: true },
    companyPhone: { type: String, default: "", trim: true },
    companyEmail: { type: String, default: "", trim: true, lowercase: true },
    companyWebsite: { type: String, default: "", trim: true },
    companySlogan: {
      type: String,
      default: "Your trusted business partner",
      trim: true,
    },

    businessType: {
      type: String,
      enum: [
        "retail",
        "wholesale",
        "pharmacy",
        "manufacturing",
        "shop",
        "restaurant",
        "service",
      ],
      default: "shop",
      index: true,
    },

    tradeLicense: { type: String, default: "", trim: true },
    tinNumber: { type: String, default: "", trim: true },
    binNumber: { type: String, default: "", trim: true },

    currency: { type: String, default: "৳" },
    currencyCode: { type: String, default: "BDT" },
    timezone: { type: String, default: "Asia/Dhaka" },
    language: { type: String, default: "bn" },
    dateFormat: { type: String, default: "DD/MM/YYYY" },
    timeFormat: { type: String, default: "12" },
    financialYearStart: { type: String, default: "01-01" },

    vatPercent: { type: Number, default: 0 },
    aitPercent: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 5 },
    allowNegativeStock: { type: Boolean, default: false },
    barcodeEnabled: { type: Boolean, default: false },

    themeColor: { type: String, default: "blue" },
    darkMode: { type: Boolean, default: false },

    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },
    signature: { type: String, default: "" },
    stamp: { type: String, default: "" },

    invoiceTerms: {
      type: String,
      default: "Goods once sold are not refundable without company approval.",
    },
    invoiceNote: { type: String, default: "" },
    invoiceFooter: {
      type: String,
      default: "Thank you for doing business with us.",
    },

    invoiceTemplate: {
      type: String,
      enum: ["modern", "classic", "simple"],
      default: "modern",
    },

    invoicePrefix: { type: String, default: "INV" },
    purchasePrefix: { type: String, default: "PUR" },
    customerPrefix: { type: String, default: "CUS" },
    supplierPrefix: { type: String, default: "SUP" },
    employeePrefix: { type: String, default: "EMP" },

    defaultDueMode: {
      type: String,
      enum: ["show", "hide"],
      default: "show",
    },

    printColor: { type: Boolean, default: true },
    pdfEnabled: { type: Boolean, default: true },
    whatsappEnabled: { type: Boolean, default: true },
    whatsappNumber: { type: String, default: "" },
    emailEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },

    stockReportFooter: {
      type: String,
      default: "This report is system generated.",
    },

    creditApprovalRequired: { type: Boolean, default: true },
    defaultCreditLimit: { type: Number, default: 50000 },
    ownerPin: { type: String, default: "1234" },
    allowCreditLimitOverride: { type: Boolean, default: true },
    creditWarningMessage: {
      type: String,
      default: "Customer credit limit exceeded. Owner approval is required.",
    },

    backupEnabled: { type: Boolean, default: true },
    autoBackupDaily: { type: Boolean, default: true },
    auditLogEnabled: { type: Boolean, default: true },
    loginAlertEnabled: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },

    aiEnabled: { type: Boolean, default: true },
    multiUserEnabled: { type: Boolean, default: true },
    attendanceEnabled: { type: Boolean, default: true },
    payrollEnabled: { type: Boolean, default: true },
    warehouseEnabled: { type: Boolean, default: false },

    manufacturingEnabled: { type: Boolean, default: false },
    pharmacyEnabled: { type: Boolean, default: false },

    posEnabled: { type: Boolean, default: true },
    ecommerceEnabled: { type: Boolean, default: false },

    offerEnabled: { type: Boolean, default: false },
    manufacturingProductEnabled: { type: Boolean, default: false },
    rawMaterialEnabled: { type: Boolean, default: false },
    productionEnabled: { type: Boolean, default: false },
    bomEnabled: { type: Boolean, default: false },
    wastageEnabled: { type: Boolean, default: false },
    factoryCostEnabled: { type: Boolean, default: false },
    finishedGoodsEnabled: { type: Boolean, default: false },

    dueReminderEnabled: { type: Boolean, default: true },
    allowDueInterest: { type: Boolean, default: false },
    dueInterestPercent: { type: Number, default: 0 },
    installmentEnabled: { type: Boolean, default: true },
    collectionReminderDays: { type: Number, default: 3 },

    salesNotification: { type: Boolean, default: true },
    purchaseNotification: { type: Boolean, default: true },
    stockNotification: { type: Boolean, default: true },
    dueNotification: { type: Boolean, default: true },
    collectionNotification: { type: Boolean, default: true },

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

    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

CompanySettingSchema.pre("save", function () {
  const isManufacturing = this.businessType === "manufacturing";
  const isPharmacy = this.businessType === "pharmacy";

  this.manufacturingEnabled = isManufacturing;
  this.pharmacyEnabled = isPharmacy;

  this.offerEnabled = isManufacturing;
  this.manufacturingProductEnabled = isManufacturing;
  this.rawMaterialEnabled = isManufacturing;
  this.productionEnabled = isManufacturing;
  this.bomEnabled = isManufacturing;
  this.wastageEnabled = isManufacturing;
  this.factoryCostEnabled = isManufacturing;
  this.finishedGoodsEnabled = isManufacturing;

  this.vatPercent = Math.max(Number(this.vatPercent || 0), 0);
  this.aitPercent = Math.max(Number(this.aitPercent || 0), 0);
  this.lowStockLimit = Math.max(Number(this.lowStockLimit || 5), 0);
  this.defaultCreditLimit = Math.max(Number(this.defaultCreditLimit || 0), 0);
  this.dueInterestPercent = Math.max(Number(this.dueInterestPercent || 0), 0);
  this.collectionReminderDays = Math.max(
    Number(this.collectionReminderDays || 3),
    0
  );

  if (!this.currencyCode) this.currencyCode = "BDT";
  if (!this.currency) this.currency = "৳";
  if (!this.timezone) this.timezone = "Asia/Dhaka";
  if (!this.language) this.language = "bn";
  if (!this.dateFormat) this.dateFormat = "DD/MM/YYYY";
  if (!this.timeFormat) this.timeFormat = "12";
});

CompanySettingSchema.index(
  { companyId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      companyId: { $exists: true },
    },
  }
);

CompanySettingSchema.index({ companyName: 1 });

const CompanySetting =
  mongoose.models.CompanySetting ||
  mongoose.model("CompanySetting", CompanySettingSchema);

export default CompanySetting;