"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit3,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";

const businessTypes = [
  ["shop", "Shop"],
  ["retail", "Retail"],
  ["wholesale", "Wholesale"],
  ["manufacturing", "Manufacturing"],
  ["pharmacy", "Pharmacy"],
  ["restaurant", "Restaurant"],
  ["service", "Service"],
];

const currencies = [
  ["BDT", "BDT - ৳"],
  ["USD", "USD - $"],
  ["EUR", "EUR - €"],
];

const timezones = [
  ["Asia/Dhaka", "Asia/Dhaka"],
  ["UTC", "UTC"],
];

const emptyForm = {
  id: "",
  _id: "",
  name: "",
  businessType: "shop",
  phone: "",
  email: "",
  address: "",
  logo: "",
  website: "",
  currency: "BDT",
  timezone: "Asia/Dhaka",
};

export default function Company() {
  const {
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    switchCompany,
    activeCompany,
    loadingCompanies,
    switchingCompany,
    loadCompanies,
  } = useCompany();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const isEditMode = Boolean(form.id || form._id);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const handleEdit = (company) => {
    setForm({
      id: company.id || company._id || "",
      _id: company._id || company.id || "",
      name: company.name || "",
      businessType: company.businessType || "shop",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      logo: company.logo || "",
      website: company.website || "",
      currency: company.currency || "BDT",
      timezone: company.timezone || "Asia/Dhaka",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    const companyName = String(form.name || "").trim();

    if (!companyName) {
      alert("Company name required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id: form.id || form._id || undefined,
        _id: form._id || form.id || undefined,
        name: companyName,
        companyName,
        businessType: form.businessType || "shop",
        phone: form.phone || "",
        email: form.email || "",
        address: form.address || "",
        logo: form.logo || "",
        website: form.website || "",
        currency: form.currency || "BDT",
        timezone: form.timezone || "Asia/Dhaka",
      };

      if (isEditMode) {
        await updateCompany(payload);
        alert("Company updated successfully ✅");
      } else {
        await addCompany(payload);
        alert("Company added successfully ✅");
      }

      resetForm();
      await loadCompanies?.();
    } catch (error) {
      console.error("COMPANY_SAVE_PAGE_ERROR:", error);
      alert(error.message || "Company save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (company) => {
    const companyId = company?.id || company?._id;
    if (!companyId) return;

    await switchCompany(companyId);
  };

  const handleDelete = async (company) => {
    const companyId = company?.id || company?._id;
    if (!companyId) return;

    const activeId = String(activeCompany?.id || activeCompany?._id || "");

    if (String(companyId) === activeId) {
      alert("Active company delete/archive করা যাবে না। আগে অন্য company select করুন।");
      return;
    }

    try {
      setDeletingId(String(companyId));
      await deleteCompany(companyId);
      alert("Company archived successfully ✅");
      await loadCompanies?.();

      if (String(form.id || form._id) === String(companyId)) {
        resetForm();
      }
    } catch (error) {
      console.error("COMPANY_DELETE_PAGE_ERROR:", error);
      alert(error.message || "Company archive failed");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-6">
      <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Company Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit, select and archive companies under one owner account.
          </p>
        </div>

        <button
          onClick={loadCompanies}
          disabled={loadingCompanies}
          className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCcw
            size={16}
            className={loadingCompanies ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
        <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={22} />
              </div>

              <div>
                <h2 className="font-bold text-lg">
                  {isEditMode ? "Edit Company" : "Add Company"}
                </h2>
                <p className="text-xs text-gray-500">
                  Business type এখানেই set হবে। Settings শুধু configuration.
                </p>
              </div>
            </div>

            {isEditMode && (
              <button
                onClick={resetForm}
                className="px-3 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <X size={15} />
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Company Name *"
              value={form.name}
              onChange={(v) => update("name", v)}
              placeholder="Example: Mintu Vumi"
            />

            <Select
              label="Business Type *"
              value={form.businessType}
              onChange={(v) => update("businessType", v)}
              options={businessTypes}
            />

            <Input
              label="Mobile Number"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="01XXXXXXXXX"
            />

            <Input
              label="Email"
              value={form.email}
              onChange={(v) => update("email", v)}
              placeholder="company@email.com"
            />

            <Input
              label="Website"
              value={form.website}
              onChange={(v) => update("website", v)}
              placeholder="https://example.com"
            />

            <Input
              label="Logo URL"
              value={form.logo}
              onChange={(v) => update("logo", v)}
              placeholder="/logo/company.png"
            />

            <Select
              label="Currency"
              value={form.currency}
              onChange={(v) => update("currency", v)}
              options={currencies}
            />

            <Select
              label="Timezone"
              value={form.timezone}
              onChange={(v) => update("timezone", v)}
              options={timezones}
            />

            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Company address"
                className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-4 focus:ring-blue-100 min-h-[90px]"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
          >
            {saving
              ? "Saving..."
              : isEditMode
              ? "Update Company"
              : "+ Add Company"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b pb-3 mb-4">
            <div>
              <h2 className="font-bold text-lg">Your Companies</h2>
              <p className="text-xs text-gray-500">
                Select a company to work with its own data and settings.
              </p>
            </div>
          </div>

          {loadingCompanies && (
            <p className="text-gray-400">Loading companies...</p>
          )}

          {!loadingCompanies && companies.length === 0 && (
            <p className="text-gray-400">No company added yet.</p>
          )}

          <div className="space-y-3">
            {companies.map((c) => {
              const companyId = String(c.id || c._id);
              const activeId = String(
                activeCompany?.id || activeCompany?._id || ""
              );
              const isActive = activeId === companyId;
              const isDeleting = deletingId === companyId;

              return (
                <div
                  key={companyId}
                  className={`p-4 rounded-2xl border transition ${
                    isActive
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => handleSelect(c)}
                    disabled={switchingCompany}
                    className="w-full text-left disabled:opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {c.logo ? (
                          <img
                            src={c.logo}
                            alt={c.name}
                            className="w-12 h-12 rounded-2xl object-cover border bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-500 border flex items-center justify-center">
                            <Building2 size={22} />
                          </div>
                        )}

                        <div>
                          <p className="font-bold text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {c.businessType || "shop"} ERP
                            {c.phone ? ` • ${c.phone}` : ""}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 font-semibold">
                          Select
                        </span>
                      )}
                    </div>

                    {c.address && (
                      <p className="text-xs text-gray-400 mt-3">{c.address}</p>
                    )}
                  </button>

                  <div className="flex justify-end gap-4 mt-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(c);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={isActive || isDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c);
                      }}
                      className={`text-xs font-semibold inline-flex items-center gap-1 ${
                        isActive || isDeleting
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-red-600 hover:underline"
                      }`}
                      title={
                        isActive
                          ? "Active company cannot be archived"
                          : "Archive company"
                      }
                    >
                      <Trash2 size={13} />
                      {isDeleting ? "Archiving..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
        placeholder={placeholder || label}
        className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
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
        className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
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