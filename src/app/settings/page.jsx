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
} from "lucide-react";

const settingSuggestions = [
  "Company Information",
  "Company Name",
  "Company Address",
  "Company Phone",
  "Company Email",
  "Company Slogan",
  "Owner Name",
  "Owner Role",
  "Logo",
  "Signature",
  "Stamp",
  "VAT",
  "AIT",
  "Low Stock Limit",
  "Currency",
  "Business Type",
  "Theme Color",
  "Invoice Terms",
  "Invoice Note",
  "Invoice Footer",
  "Default Due Mode",
  "Print Color",
  "PDF Download",
  "WhatsApp Number",
  "Invoice Template",
  "Stock Report Footer",
  "Credit Approval",
  "Default Credit Limit",
  "Owner PIN",
  "Credit Warning Message",
];

export default function SettingsPage() {
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const stampInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [settingsSearch, setSettingsSearch] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    companySlogan: "Your trusted business partner",

    ownerName: "Company User",
    ownerRole: "Admin / Owner",

    currency: "৳",
    vatPercent: 0,
    aitPercent: 0,
    lowStockLimit: 5,
    businessType: "shop",

    themeColor: "blue",

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
    whatsappNumber: "",
    invoiceTemplate: "modern",

    stockReportFooter: "This report is system generated.",

    creditApprovalRequired: true,
    defaultCreditLimit: 50000,
    ownerPin: "",
    allowCreditLimitOverride: true,
    creditWarningMessage:
      "Customer credit limit exceeded. Owner approval is required.",
  });

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

     const res = await fetch("/api/settings", {
      credentials: "include",
    });
          const data = await res.json();

      if (data.success) {
        setForm((prev) => ({
          ...prev,

          companyName: data.data.companyName || "",
          companyAddress: data.data.companyAddress || "",
          companyPhone: data.data.companyPhone || "",
          companyEmail: data.data.companyEmail || "",
          companySlogan:
            data.data.companySlogan || "Your trusted business partner",

          ownerName: data.data.ownerName || "Company User",
          ownerRole: data.data.ownerRole || "Admin / Owner",

          currency: data.data.currency || "৳",
          vatPercent: Number(data.data.vatPercent || 0),
          aitPercent: Number(data.data.aitPercent || 0),
          lowStockLimit: Number(data.data.lowStockLimit || 5),

          themeColor: data.data.themeColor || "blue",

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

          defaultDueMode: data.data.defaultDueMode || "show",
          printColor: data.data.printColor === false ? false : true,
          pdfEnabled: data.data.pdfEnabled === false ? false : true,
          whatsappNumber: data.data.whatsappNumber || "",
          invoiceTemplate: data.data.invoiceTemplate || "modern",

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
        }));
      }
    } catch (error) {
      console.error("SETTINGS_LOAD_ERROR:", error);
      alert("Settings load failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    try {

      const res = await fetch("/api/company", {
      credentials: "include",
    });

      const data = await res.json();

      if (data.success) {
      const company = data.data.company;

      setForm((prev) => ({
        ...prev,
        companyName: company?.name || prev.companyName,
        companyAddress: company?.address || prev.companyAddress,
        companyPhone: company?.phone || prev.companyPhone,
        companyEmail: company?.email || prev.companyEmail,
        businessType: company?.businessType || "shop",
      }));
    }

    } catch (error) {
      console.error("COMPANY_LOAD_ERROR:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCompany();
  }, []);

  const saveSettings = async () => {
    try {
      setLoading(true);

      const settingsRes = await fetch("/api/settings", {
        method: "POST",
        credentials: "include",
        headers: {
      "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

      const settingsData = await settingsRes.json();

      if (!settingsRes.ok || !settingsData.success) {
        throw new Error(settingsData.message || "Settings save failed");
      }

      const companyRes = await fetch("/api/company", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({

          name: form.companyName,
          address: form.companyAddress,
          phone: form.companyPhone,
          email: form.companyEmail,
          businessType: form.businessType,
        }),
      });

      const companyData = await companyRes.json();

      if (!companyRes.ok || !companyData.success) {
        throw new Error(companyData.message || "Company save failed");
      }

      alert("Settings saved ✅");
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
        setForm((prev) => ({ ...prev, [field]: data.url }));
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
                Company profile, invoice, stock, credit and report settings.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              fetchSettings();
              fetchCompany();
            }}
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
            placeholder="Search settings: logo, VAT, invoice, footer, credit, theme..."
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
        <div className="xl:col-span-2 bg-white border rounded-[30px] p-5 md:p-7 shadow-sm space-y-5">
          {showSection([
            "company",
            "information",
            "name",
            "phone",
            "email",
            "address",
            "slogan",
            "owner",
            "role",
            "currency",
          ]) && (
            <>
              <SectionTitle title="Company Information" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Company Name"
                  value={form.companyName}
                  onChange={(v) => update("companyName", v)}
                  placeholder="Company name"
                />

                <Input
                  label="Phone"
                  value={form.companyPhone}
                  onChange={(v) => update("companyPhone", v)}
                  placeholder="Phone number"
                />

                <Input
                  label="Email"
                  value={form.companyEmail}
                  onChange={(v) => update("companyEmail", v)}
                  placeholder="Email address"
                />

                <Input
                  label="Company Slogan"
                  value={form.companySlogan}
                  onChange={(v) => update("companySlogan", v)}
                  placeholder="Your trusted business partner"
                />

                <Input
                  label="Owner/Admin Name"
                  value={form.ownerName}
                  onChange={(v) => update("ownerName", v)}
                  placeholder="Owner name"
                />

                <Input
                  label="Owner Role"
                  value={form.ownerRole}
                  onChange={(v) => update("ownerRole", v)}
                  placeholder="Admin / Owner"
                />

                <Input
                  label="Currency"
                  value={form.currency}
                  onChange={(v) => update("currency", v)}
                  placeholder="৳"
                />

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Address</label>
                  <textarea
                    value={form.companyAddress}
                    onChange={(e) => update("companyAddress", e.target.value)}
                    placeholder="Company address"
                    className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[90px]"
                  />
                </div>
              </div>
            </>
          )}

          {showSection([
            "tax",
            "vat",
            "ait",
            "stock",
            "business",
            "theme",
            "low stock",
          ]) && (
            <>
              <SectionTitle title="Tax & ERP Rules" />

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

                <Select
                  label="Business Type"
                  value={form.businessType}
                  onChange={(v) => update("businessType", v)}
                  options={[
                    ["shop", "Shop"],
                    ["wholesale", "Wholesale"],
                    ["manufacturing", "Manufacturing"],
                  ]}
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
              </div>
            </>
          )}

          {showSection([
            "invoice",
            "terms",
            "note",
            "footer",
            "due",
            "print",
            "pdf",
            "whatsapp",
            "template",
          ]) && (
            <>
              <SectionTitle title="Invoice & Print Settings" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  label="Default Previous Due Mode"
                  value={form.defaultDueMode}
                  onChange={(v) => update("defaultDueMode", v)}
                  options={[
                    ["show", "Show Previous Due Only"],
                    ["add", "Add Previous Due to Invoice Total"],
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
                  label="WhatsApp Number"
                  value={form.whatsappNumber}
                  onChange={(v) => update("whatsappNumber", v)}
                  placeholder="Example: 88017xxxxxxxx"
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

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Invoice Terms</label>
                  <textarea
                    value={form.invoiceTerms}
                    onChange={(e) => update("invoiceTerms", e.target.value)}
                    placeholder="Invoice terms and conditions"
                    className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[90px]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Invoice Note</label>
                  <textarea
                    value={form.invoiceNote}
                    onChange={(e) => update("invoiceNote", e.target.value)}
                    placeholder="Default invoice note"
                    className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[80px]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Invoice Footer</label>
                  <textarea
                    value={form.invoiceFooter}
                    onChange={(e) => update("invoiceFooter", e.target.value)}
                    placeholder="Invoice footer text"
                    className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[80px]"
                  />
                </div>
              </div>
            </>
          )}

          {showSection(["stock", "report", "footer"]) && (
            <>
              <SectionTitle title="Stock Report Settings" />

              <textarea
                value={form.stockReportFooter}
                onChange={(e) => update("stockReportFooter", e.target.value)}
                placeholder="Stock report footer"
                className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[80px]"
              />
            </>
          )}

          {showSection([
            "credit",
            "limit",
            "owner",
            "pin",
            "approval",
            "warning",
          ]) && (
            <>
              <SectionTitle title="Credit Control" />

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

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">
                    Credit Warning Message
                  </label>
                  <textarea
                    value={form.creditWarningMessage}
                    onChange={(e) =>
                      update("creditWarningMessage", e.target.value)
                    }
                    className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[80px]"
                  />
                </div>
              </div>
            </>
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
            Search দিয়ে যেকোনো setting দ্রুত খুঁজুন। User নিজের logo,
            invoice terms, due mode, print/PDF, credit limit সব setup করতে পারবে।
          </div>
        </div>
      </div>
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

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
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