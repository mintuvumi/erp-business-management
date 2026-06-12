import React, { useState } from "react";
import { useCompany } from "../context/CompanyContext";

const Company = () => {
  const {
    companies,
    addCompany,
    setActiveCompany,
    activeCompany,
    loadingCompanies,
    switchingCompany,
  } = useCompany();

  const [form, setForm] = useState({
    name: "",
    businessType: "shop",
    phone: "",
    email: "",
    address: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      businessType: "shop",
      phone: "",
      email: "",
      address: "",
    });
  };

  const handleAdd = async () => {
    const companyName = form.name.trim();

    if (!companyName) {
      alert("Enter company name");
      return;
    }

    try {
      setSaving(true);

      await addCompany({
        name: companyName,
        companyName,
        businessType: form.businessType || "shop",
        phone: form.phone || "",
        email: form.email || "",
        address: form.address || "",
      });

      resetForm();
      alert("Company added successfully ✅");
    } catch (error) {
      console.error("COMPANY_ADD_PAGE_ERROR:", error);
      alert(error.message || "Company create failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (company) => {
    setActiveCompany(company);
    window.dispatchEvent(new Event("companyChanged"));
  };

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Company Management
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Enter company name..."
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            name="businessType"
            value={form.businessType}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="shop">Shop</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="restaurant">Restaurant</option>
            <option value="service">Service</option>
          </select>

          <input
            name="phone"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
          />

          <input
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
          />

          <textarea
            name="address"
            placeholder="Company address"
            value={form.address}
            onChange={handleChange}
            className="md:col-span-2 w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px]"
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={saving}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white py-2 rounded-lg transition"
        >
          {saving ? "Saving..." : "+ Add Company"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-600">
          Your Companies
        </h2>

        {loadingCompanies && (
          <p className="text-gray-400">Loading companies...</p>
        )}

        {!loadingCompanies && companies.length === 0 && (
          <p className="text-gray-400">No company added yet</p>
        )}

        {companies.map((c) => {
          const companyId = String(c.id || c._id);
          const activeId = String(activeCompany?.id || activeCompany?._id || "");
          const isActive = activeId === companyId;

          return (
            <div
              key={companyId}
              className={`flex justify-between items-center p-3 mb-2 rounded-xl cursor-pointer transition ${
                isActive
                  ? "bg-blue-100 border border-blue-400"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleSelect(c)}
            >
              <div>
                <p className="font-medium text-gray-700">{c.name}</p>

                <p className="text-xs text-gray-400 capitalize">
                  {c.businessType || "shop"}
                </p>

                {isActive && (
                  <span className="text-xs text-blue-500">
                    Active Company
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={switchingCompany}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(c);
                  }}
                  className="text-green-500 text-sm disabled:opacity-60"
                >
                  Select
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Company;