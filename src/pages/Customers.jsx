"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCcw,
  UserPlus,
  Eye,
  FileText,
  Edit3,
  Save,
  X,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

const emptyForm = {
  id: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  companyName: "",
  customerType: "retail",
  openingDue: "",
  creditLimit: "",
  note: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(form.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) =>
      [c.name, c.phone, c.email, c.customerCode, c.companyName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [customers, search]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setForm(emptyForm);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/customers?q=${encodeURIComponent(search)}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Customer load failed");
      }

      setCustomers(data.data || []);
    } catch (error) {
      alert(error.message || "Customer load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return alert("Customer name required");

    try {
      setLoading(true);

      const res = await fetch("/api/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          openingDue: Number(form.openingDue || 0),
          creditLimit: Number(form.creditLimit || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Customer save failed");
      }

      alert(isEdit ? "Customer updated ✅" : "Customer created ✅");
      resetForm();
      loadCustomers();
    } catch (error) {
      alert(error.message || "Customer save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c) => {
    setForm({
      id: c._id || c.id || "",
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      companyName: c.companyName || "",
      customerType: c.customerType || "retail",
      openingDue: c.openingDue || "",
      creditLimit: c.creditLimit || "",
      note: c.note || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goProfile = (c) => {
    window.location.href = `/customers/profile?id=${c._id || c.id}`;
  };

  const goStatement = (c) => {
    window.location.href = `/customers/statement?customer=${encodeURIComponent(
      c.name || ""
    )}&customerId=${c._id || c.id}`;
  };

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-6">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Customer Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customer profile, statement, ledger and due tracking.
          </p>
        </div>

        <button
          onClick={loadCustomers}
          disabled={loading}
          className="px-4 py-2 rounded-xl border bg-white flex items-center gap-2 hover:bg-gray-50"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-blue-600" />
              <h2 className="font-bold">{isEdit ? "Edit Customer" : "Add Customer"}</h2>
            </div>

            {isEdit && (
              <button onClick={resetForm} className="text-sm border px-3 py-2 rounded-xl flex items-center gap-1">
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <Input label="Customer Name *" value={form.name} onChange={(v) => update("name", v)} />
          <Input label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Input label="Email" value={form.email} onChange={(v) => update("email", v)} />
          <Input label="Company Name" value={form.companyName} onChange={(v) => update("companyName", v)} />

          <div>
            <label className="text-xs text-gray-500">Customer Type</label>
            <select
              value={form.customerType}
              onChange={(e) => update("customerType", e.target.value)}
              className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="dealer">Dealer</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <Input type="number" label="Opening Due" value={form.openingDue} onChange={(v) => update("openingDue", v)} />
          <Input type="number" label="Credit Limit" value={form.creditLimit} onChange={(v) => update("creditLimit", v)} />

          <div>
            <label className="text-xs text-gray-500">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[70px]"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {loading ? "Saving..." : isEdit ? "Update Customer" : "Save Customer"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="relative mb-4">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
              placeholder="Search customer name, phone, code..."
              className="w-full border rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-right">Opening Due</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No customer found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c._id || c.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-bold">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.customerCode || "-"}</p>
                      </td>
                      <td className="p-3">{c.phone || "-"}</td>
                      <td className="p-3 capitalize">{c.customerType || "retail"}</td>
                      <td className="p-3 text-right text-red-500">
                        ৳ {money(c.openingDue)}
                      </td>
                      <td className="p-3 text-right">
                        ৳ {money(c.creditLimit)}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button onClick={() => goProfile(c)} className="action-btn text-blue-600">
                            <Eye size={14} /> Profile
                          </button>
                          <button onClick={() => goStatement(c)} className="action-btn text-green-600">
                            <FileText size={14} /> Statement
                          </button>
                          <button onClick={() => handleEdit(c)} className="action-btn text-orange-600">
                            <Edit3 size={14} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .action-btn {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 7px 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          background: white;
        }
        .action-btn:hover {
          background: #f9fafb;
        }
      `}</style>
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
        className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}