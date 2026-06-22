"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Save,
  Upload,
  RefreshCcw,
  Building2,
  Search,
  X,
  Settings,
  Bell,
  ShieldCheck,
  FileText,
  Package,
  DatabaseBackup,
} from "lucide-react";

const settingSuggestions = [
  "Company Information",
  "Logo",
  "Signature",
  "Stamp",
  "VAT",
  "AIT",
  "Low Stock",
  "Invoice",
  "Previous Due",
  "Due Collection",
  "Late Interest",
  "Installment",
  "Credit Approval",
  "Owner PIN",
  "WhatsApp",
  "SMS",
  "Email",
  "Prefix",
  "TIN",
  "BIN",
  "Trade License",
  "Date Format",
  "Time Format",
  "Negative Stock",
  "Barcode",
  "Backup",
];

export default function SettingsPage() {
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const stampInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [settingsSearch, setSettingsSearch] = useState("");

  const [form, setForm] = useState({
    companyCode: "",
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    companyWebsite: "",
    companySlogan: "Your trusted business partner",

    businessType: "shop",
    currency: "৳",
    currencyCode: "BDT",
    timezone: "Asia/Dhaka",
    language: "bn",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12",

    tradeLicense: "",
    tinNumber: "",
    binNumber: "",

    vatPercent: 0,
    aitPercent: 0,
    lowStockLimit: 5,
    allowNegativeStock: false,
    barcodeEnabled: false,
    themeColor: "blue",
    darkMode: false,

    logo: "",
    signature: "",
    stamp: "",

    invoiceTerms:
      "Goods once sold are not refundable without company approval.",
    invoiceNote: "",
    invoiceFooter: "Thank you for doing business with us.",
    defaultDueMode: "show",
    printColor: true,
    pdfEnabled: true,
    whatsappEnabled: true,
    whatsappNumber: "",
    emailEnabled: false,
    smsEnabled: false,
    invoiceTemplate: "modern",

    invoicePrefix: "INV",
    purchasePrefix: "PUR",
    customerPrefix: "CUS",
    supplierPrefix: "SUP",
    employeePrefix: "EMP",

    stockReportFooter: "This report is system generated.",

    creditApprovalRequired: true,
    defaultCreditLimit: 50000,
    ownerPin: "",
    allowCreditLimitOverride: true,
    creditWarningMessage:
      "Customer credit limit exceeded. Owner approval is required.",

    dueReminderEnabled: true,
    allowDueInterest: false,
    dueInterestPercent: 0,
    installmentEnabled: true,
    collectionReminderDays: 3,

    autoBackupDaily: true,
    backupEnabled: true,
    auditLogEnabled: true,
    loginAlertEnabled: false,
    twoFactorEnabled: false,
  });

  const isRetail = form.businessType === "retail";

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const showSection = (keywords) => {
    if (!settingsSearch.trim()) return true;
    const text = settingsSearch.toLowerCase();
    return keywords.some((k) => k.toLowerCase().includes(text));
  };

  const filteredSuggestions = useMemo(() => {
    const q = settingsSearch.trim().toLowerCase();
    if (!q) return [];
    return settingSuggestions
      .filter((item) => item.toLowerCase().includes(q))
      .slice(0, 10);
  }, [settingsSearch]);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/company-settings", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setForm((prev) => ({
          ...prev,

          companyCode: data.data.companyCode || "",
          companyName: data.data.companyName || "",
          companyAddress: data.data.companyAddress || "",
          companyPhone: data.data.companyPhone || "",
          companyEmail: data.data.companyEmail || "",
          companyWebsite: data.data.companyWebsite || "",
          companySlogan:
            data.data.companySlogan || "Your trusted business partner",

          businessType: data.data.businessType || "shop",
          currency: data.data.currency || "৳",
          currencyCode: data.data.currencyCode || "BDT",
          timezone: data.data.timezone || "Asia/Dhaka",
          language: data.data.language || "bn",
          dateFormat: data.data.dateFormat || "DD/MM/YYYY",
          timeFormat: data.data.timeFormat || "12",

          tradeLicense: data.data.tradeLicense || "",
          tinNumber: data.data.tinNumber || "",
          binNumber: data.data.binNumber || "",

          vatPercent: Number(data.data.vatPercent || 0),
          aitPercent: Number(data.data.aitPercent || 0),
          lowStockLimit: Number(data.data.lowStockLimit || 5),
          allowNegativeStock: data.data.allowNegativeStock === true,
          barcodeEnabled: data.data.barcodeEnabled === true,
          themeColor: data.data.themeColor || "blue",
          darkMode: data.data.darkMode === true,

          logo: data.data.logo || "",
          signature: data.data.signature || "",
          stamp: data.data.stamp || "",

          invoiceTerms:
            data.data.invoiceTerms ||
            "Goods once sold are not refundable without company approval.",
          invoiceNote: data.data.invoiceNote || "",
          invoiceFooter:
            data.data.invoiceFooter ||
            "Thank you for doing business with us.",
          defaultDueMode:
            data.data.defaultDueMode === "hide" ? "hide" : "show",
          printColor: data.data.printColor === false ? false : true,
          pdfEnabled: data.data.pdfEnabled === false ? false : true,
          whatsappEnabled: data.data.whatsappEnabled === false ? false : true,
          whatsappNumber: data.data.whatsappNumber || "",
          emailEnabled: data.data.emailEnabled === true,
          smsEnabled: data.data.smsEnabled === true,
          invoiceTemplate: data.data.invoiceTemplate || "modern",

          invoicePrefix: data.data.invoicePrefix || "INV",
          purchasePrefix: data.data.purchasePrefix || "PUR",
          customerPrefix: data.data.customerPrefix || "CUS",
          supplierPrefix: data.data.supplierPrefix || "SUP",
          employeePrefix: data.data.employeePrefix || "EMP",

          stockReportFooter:
            data.data.stockReportFooter ||
            "This report is system generated.",

          creditApprovalRequired:
            data.data.creditApprovalRequired === false ? false : true,
          defaultCreditLimit: Number(data.data.defaultCreditLimit || 50000),
          ownerPin: "",
          allowCreditLimitOverride:
            data.data.allowCreditLimitOverride === false ? false : true,
          creditWarningMessage:
            data.data.creditWarningMessage ||
            "Customer credit limit exceeded. Owner approval is required.",

          dueReminderEnabled:
            data.data.dueReminderEnabled === false ? false : true,
          allowDueInterest: data.data.allowDueInterest === true,
          dueInterestPercent: Number(data.data.dueInterestPercent || 0),
          installmentEnabled:
            data.data.installmentEnabled === false ? false : true,
          collectionReminderDays: Number(data.data.collectionReminderDays || 3),

          backupEnabled: data.data.backupEnabled === false ? false : true,
          autoBackupDaily: data.data.autoBackupDaily === false ? false : true,
          auditLogEnabled: data.data.auditLogEnabled === false ? false : true,
          loginAlertEnabled: data.data.loginAlertEnabled === true,
          twoFactorEnabled: data.data.twoFactorEnabled === true,
        }));
      }
    } catch (error) {
      console.error("SETTINGS_LOAD_ERROR:", error);
      alert("Settings load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      setLoading(true);

      const payload = {
        ...form,
        defaultDueMode: form.defaultDueMode === "hide" ? "hide" : "show",
        allowDueInterest:
          form.businessType === "retail" && form.allowDueInterest === true,
        dueInterestPercent:
          form.businessType === "retail" && form.allowDueInterest
            ? Number(form.dueInterestPercent || 0)
            : 0,
      };

      const res = await fetch("/api/company-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Settings save failed");
      }

      alert("Settings saved ✅");
      fetchSettings();
    } catch (error) {
      console.error("SETTINGS_SAVE_ERROR:", error);
      alert(error.message || "Settings save failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        update(field, data.url);
        alert(`${field} uploaded ✅`);
      } else {
        alert(`${field} upload failed`);
      }
    } catch (error) {
      console.error("UPLOAD_ERROR:", error);
      alert(`${field} upload failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[30px] p-5 md:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings size={22} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Company Settings
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Invoice, stock, credit, due collection, notification and
                branding settings.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSettings}
            className="px-4 py-2 rounded-xl border flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-5 relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={settingsSearch}
            onChange={(e) => setSettingsSearch(e.target.value)}
            placeholder="Search settings: logo, VAT, invoice, due, credit..."
            className="w-full border rounded-2xl pl-11 pr-12 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          {settingsSearch && (
            <button
              onClick={() => setSettingsSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <X size={18} />
            </button>
          )}

          {filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden text-sm">
              {filteredSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSettingsSearch(item)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white border rounded-[30px] p-5 md:p-7 shadow-sm space-y-7">
          {showSection(["company", "information", "name", "phone", "email"]) && (
            <SectionCard
              icon={Building2}
              title="General Settings"
              subtitle="Company identity and official information."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Company Name"
                  value={form.companyName}
                  onChange={(v) => update("companyName", v)}
                />

                <Input
                  label="Phone"
                  value={form.companyPhone}
                  onChange={(v) => update("companyPhone", v)}
                />

                <Input
                  label="Email"
                  value={form.companyEmail}
                  onChange={(v) => update("companyEmail", v)}
                />

                <Input
                  label="Website"
                  value={form.companyWebsite}
                  onChange={(v) => update("companyWebsite", v)}
                />

                <Input
                  label="Company Slogan"
                  value={form.companySlogan}
                  onChange={(v) => update("companySlogan", v)}
                />

                <Input
                  label="Company Code"
                  value={form.companyCode}
                  readOnly
                />

                <Input
                  label="Currency Symbol"
                  value={form.currency}
                  onChange={(v) => update("currency", v)}
                />

                <Input
                  label="Currency Code"
                  value={form.currencyCode}
                  onChange={(v) => update("currencyCode", v)}
                />

                <Select
                  label="Timezone"
                  value={form.timezone}
                  onChange={(v) => update("timezone", v)}
                  options={[
                    ["Asia/Dhaka", "Asia/Dhaka"],
                    ["Asia/Kolkata", "Asia/Kolkata"],
                    ["UTC", "UTC"],
                  ]}
                />

                <Select
                  label="Language"
                  value={form.language}
                  onChange={(v) => update("language", v)}
                  options={[
                    ["bn", "Bangla"],
                    ["en", "English"],
                  ]}
                />

                <Select
                  label="Date Format"
                  value={form.dateFormat}
                  onChange={(v) => update("dateFormat", v)}
                  options={[
                    ["DD/MM/YYYY", "DD/MM/YYYY"],
                    ["MM/DD/YYYY", "MM/DD/YYYY"],
                    ["YYYY-MM-DD", "YYYY-MM-DD"],
                  ]}
                />

                <Select
                  label="Time Format"
                  value={form.timeFormat}
                  onChange={(v) => update("timeFormat", v)}
                  options={[
                    ["12", "12 Hour"],
                    ["24", "24 Hour"],
                  ]}
                />

                <Input
                  label="Trade License"
                  value={form.tradeLicense}
                  onChange={(v) => update("tradeLicense", v)}
                />

                <Input
                  label="TIN Number"
                  value={form.tinNumber}
                  onChange={(v) => update("tinNumber", v)}
                />

                <Input
                  label="BIN / VAT Number"
                  value={form.binNumber}
                  onChange={(v) => update("binNumber", v)}
                />

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Address</label>
                  <textarea
                    value={form.companyAddress}
                    onChange={(e) => update("companyAddress", e.target.value)}
                    className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[90px]"
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {showSection(["tax", "vat", "ait", "stock", "theme"]) && (
            <SectionCard
              icon={Package}
              title="Tax & Inventory Settings"
              subtitle="VAT, AIT and stock alert settings."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input
                  type="number"
                  label="Default VAT %"
                  value={form.vatPercent}
                  onChange={(v) => update("vatPercent", Number(v) || 0)}
                />

                <Input
                  type="number"
                  label="Default AIT %"
                  value={form.aitPercent}
                  onChange={(v) => update("aitPercent", Number(v) || 0)}
                />

                <Input
                  type="number"
                  label="Low Stock Limit"
                  value={form.lowStockLimit}
                  onChange={(v) => update("lowStockLimit", Number(v) || 5)}
                />

                <Toggle
                  label="Allow Negative Stock"
                  checked={form.allowNegativeStock}
                  onChange={(v) => update("allowNegativeStock", v)}
                />

                <Toggle
                  label="Barcode Enabled"
                  checked={form.barcodeEnabled}
                  onChange={(v) => update("barcodeEnabled", v)}
                />

                <Select
                  label="Theme Color"
                  value={form.themeColor}
                  onChange={(v) => update("themeColor", v)}
                  options={[
                    ["blue", "Blue"],
                    ["green", "Green"],
                    ["purple", "Purple"],
                    ["red", "Red"],
                    ["orange", "Orange"],
                  ]}
                />

                <Toggle
                  label="Dark Mode"
                  checked={form.darkMode}
                  onChange={(v) => update("darkMode", v)}
                />

                <TextArea
                  label="Stock Report Footer"
                  value={form.stockReportFooter}
                  onChange={(v) => update("stockReportFooter", v)}
                />
              </div>
            </SectionCard>
          )}

          {showSection(["invoice", "terms", "note", "footer", "print", "pdf"]) && (
            <SectionCard
              icon={FileText}
              title="Invoice & Print Settings"
              subtitle="Invoice display, footer, terms and print controls."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  label="Previous Due Display"
                  value={form.defaultDueMode}
                  onChange={(v) => update("defaultDueMode", v)}
                  options={[
                    ["show", "Show Previous Due"],
                    ["hide", "Hide Previous Due"],
                  ]}
                />

                <Select
                  label="Invoice Template"
                  value={form.invoiceTemplate}
                  onChange={(v) => update("invoiceTemplate", v)}
                  options={[
                    ["modern", "Modern"],
                    ["classic", "Classic"],
                    ["simple", "Simple"],
                  ]}
                />

                <Input
                  label="Invoice Prefix"
                  value={form.invoicePrefix}
                  onChange={(v) => update("invoicePrefix", v)}
                />

                <Input
                  label="Purchase Prefix"
                  value={form.purchasePrefix}
                  onChange={(v) => update("purchasePrefix", v)}
                />

                <Input
                  label="Customer Prefix"
                  value={form.customerPrefix}
                  onChange={(v) => update("customerPrefix", v)}
                />

                <Input
                  label="Supplier Prefix"
                  value={form.supplierPrefix}
                  onChange={(v) => update("supplierPrefix", v)}
                />

                <Input
                  label="Employee Prefix"
                  value={form.employeePrefix}
                  onChange={(v) => update("employeePrefix", v)}
                />

                <Toggle
                  label="Enable Color Print"
                  checked={form.printColor}
                  onChange={(v) => update("printColor", v)}
                />

                <Toggle
                  label="Enable PDF Download"
                  checked={form.pdfEnabled}
                  onChange={(v) => update("pdfEnabled", v)}
                />

                <TextArea
                  label="Invoice Terms"
                  value={form.invoiceTerms}
                  onChange={(v) => update("invoiceTerms", v)}
                />

                <TextArea
                  label="Invoice Note"
                  value={form.invoiceNote}
                  onChange={(v) => update("invoiceNote", v)}
                />

                <TextArea
                  label="Invoice Footer"
                  value={form.invoiceFooter}
                  onChange={(v) => update("invoiceFooter", v)}
                />
              </div>
            </SectionCard>
          )}

          {showSection(["due", "collection", "interest", "installment"]) && (
            <SectionCard
              icon={ShieldCheck}
              title="Sales, Credit & Due Collection"
              subtitle="Credit approval, due reminder and EMI controls."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle
                  label="Credit Approval Required"
                  checked={form.creditApprovalRequired}
                  onChange={(v) => update("creditApprovalRequired", v)}
                />

                <Toggle
                  label="Allow Credit Limit Override"
                  checked={form.allowCreditLimitOverride}
                  onChange={(v) => update("allowCreditLimitOverride", v)}
                />

                <Input
                  type="number"
                  label="Default Credit Limit"
                  value={form.defaultCreditLimit}
                  onChange={(v) => update("defaultCreditLimit", Number(v) || 0)}
                />

                <Input
                  type="password"
                  label="Owner PIN"
                  value={form.ownerPin}
                  onChange={(v) => update("ownerPin", v)}
                  placeholder="Leave empty to keep old PIN"
                />

                <Toggle
                  label="Enable Due Reminder"
                  checked={form.dueReminderEnabled}
                  onChange={(v) => update("dueReminderEnabled", v)}
                />

                <Toggle
                  label="Enable Installment / EMI"
                  checked={form.installmentEnabled}
                  onChange={(v) => update("installmentEnabled", v)}
                />

                <Input
                  type="number"
                  label="Collection Reminder Days"
                  value={form.collectionReminderDays}
                  onChange={(v) =>
                    update("collectionReminderDays", Number(v) || 0)
                  }
                />

                {isRetail && (
                  <>
                    <Toggle
                      label="Allow Late Interest (Retail Only)"
                      checked={form.allowDueInterest}
                      onChange={(v) => update("allowDueInterest", v)}
                    />

                    {form.allowDueInterest && (
                      <Input
                        type="number"
                        label="Default Late Interest %"
                        value={form.dueInterestPercent}
                        onChange={(v) =>
                          update("dueInterestPercent", Number(v) || 0)
                        }
                      />
                    )}
                  </>
                )}

                {!isRetail && (
                  <div className="md:col-span-2 bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-sm text-yellow-700">
                    Late Interest শুধু Retail business type-এর জন্য available.
                    এই company type:{" "}
                    <b className="capitalize">{form.businessType}</b>
                  </div>
                )}

                <TextArea
                  label="Credit Warning Message"
                  value={form.creditWarningMessage}
                  onChange={(v) => update("creditWarningMessage", v)}
                />
              </div>
            </SectionCard>
          )}

          {showSection(["notification", "whatsapp", "sms", "email"]) && (
            <SectionCard
              icon={Bell}
              title="Notification Settings"
              subtitle="WhatsApp, SMS and email notification controls."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle
                  label="Enable WhatsApp"
                  checked={form.whatsappEnabled}
                  onChange={(v) => update("whatsappEnabled", v)}
                />

                <Input
                  label="WhatsApp Number"
                  value={form.whatsappNumber}
                  onChange={(v) => update("whatsappNumber", v)}
                  placeholder="Example: 88017xxxxxxxx"
                />

                <Toggle
                  label="Enable SMS"
                  checked={form.smsEnabled}
                  onChange={(v) => update("smsEnabled", v)}
                />

                <Toggle
                  label="Enable Email"
                  checked={form.emailEnabled}
                  onChange={(v) => update("emailEnabled", v)}
                />

                <Toggle
                  label="Login Alert"
                  checked={form.loginAlertEnabled}
                  onChange={(v) => update("loginAlertEnabled", v)}
                />
              </div>
            </SectionCard>
          )}

          {showSection(["backup", "restore", "audit", "security"]) && (
            <SectionCard
              icon={DatabaseBackup}
              title="Backup & Security"
              subtitle="Backup, audit log and account protection controls."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle
                  label="Backup Enabled"
                  checked={form.backupEnabled}
                  onChange={(v) => update("backupEnabled", v)}
                />

                <Toggle
                  label="Auto Backup Daily"
                  checked={form.autoBackupDaily}
                  onChange={(v) => update("autoBackupDaily", v)}
                />

                <Toggle
                  label="Audit Log Enabled"
                  checked={form.auditLogEnabled}
                  onChange={(v) => update("auditLogEnabled", v)}
                />

                <Toggle
                  label="Two Factor Authentication"
                  checked={form.twoFactorEnabled}
                  onChange={(v) => update("twoFactorEnabled", v)}
                />
              </div>
            </SectionCard>
          )}

          <button
            onClick={saveSettings}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-60"
          >
            <Save size={17} />
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="bg-white border rounded-[30px] p-5 md:p-7 shadow-sm h-fit space-y-5">
          {showSection(["logo", "signature", "stamp", "company"]) && (
            <>
              <SectionTitle title="Branding Preview" />

              <div className="rounded-[28px] border bg-gray-50 p-5 flex flex-col items-center justify-center text-center">
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Company Logo"
                    className="w-28 h-28 rounded-3xl object-cover border bg-white"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border">
                    <Building2 size={42} />
                  </div>
                )}

                <h3 className="font-bold mt-4">
                  {form.companyName || "Company Name"}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {form.companyPhone || "Phone number"}
                </p>

                <p className="text-xs text-blue-600 mt-2 capitalize">
                  {form.businessType} ERP
                </p>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadImage(e, "logo")}
                />

                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-blue-50 hover:text-blue-600"
                >
                  <Upload size={16} />
                  Upload Logo
                </button>
              </div>

              <ImageUrlBox
                title="Logo URL"
                value={form.logo}
                onChange={(v) => update("logo", v)}
              />

              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadImage(e, "signature")}
              />

              <ImageUrlBox
                title="Signature URL"
                value={form.signature}
                onChange={(v) => update("signature", v)}
                onUpload={() => signatureInputRef.current?.click()}
              />

              <input
                ref={stampInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadImage(e, "stamp")}
              />

              <ImageUrlBox
                title="Stamp URL"
                value={form.stamp}
                onChange={(v) => update("stamp", v)}
                onUpload={() => stampInputRef.current?.click()}
              />
            </>
          )}

          <div className="bg-blue-50 text-blue-700 rounded-2xl p-4 text-sm">
            Business Type Company Management থেকে সেট হবে। Settings শুধু
            configuration control করবে।
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="border rounded-[26px] p-4 md:p-5 bg-white space-y-4">
      <div className="flex items-start gap-3 border-b pb-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>

      {children}
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="border-b pb-2">
      <h2 className="font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", readOnly }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || label}
        className={`w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 ${
          readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="text-xs text-gray-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[80px]"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="border rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function ImageUrlBox({ title, value, onChange, onUpload }) {
  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-sm">{title}</h3>

        {onUpload && (
          <button
            onClick={onUpload}
            className="px-3 py-1 rounded-lg border text-xs hover:bg-blue-50"
          >
            Upload
          </button>
        )}
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={title}
        className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 text-sm"
      />

      {value ? (
        <img
          src={value}
          alt={title}
          className="max-h-20 rounded-xl border object-contain bg-white"
        />
      ) : null}
    </div>
  );
}