"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  Search,
  RefreshCcw,
  Printer,
  FileDown,
  Share2,
  Sparkles,
  Pencil,
  Trash2,
  X,
  Users,
} from "lucide-react";

export default function SupplierMasterPage() {
  const emptyForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
    companyName: "",
    contactPerson: "",
    openingDue: 0,
    note: "",
  };

  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/suppliers?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error(error);
      alert("Supplier load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;

    const q = search.toLowerCase();

    return suppliers.filter((item) =>
      [
        item.name,
        item.phone,
        item.email,
        item.address,
        item.companyName,
        item.contactPerson,
        item.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [suppliers, search]);

  const summary = useMemo(() => {
    const openingDue = suppliers.reduce(
      (sum, item) => sum + Number(item.openingDue || 0),
      0
    );

    const currentDue = suppliers.reduce(
      (sum, item) => sum + Number(item.currentDue || 0),
      0
    );

    return {
      totalSupplier: suppliers.length,
      openingDue,
      currentDue,
    };
  }, [suppliers]);

  const saveSupplier = async () => {
    if (!form.name.trim()) return alert("Supplier name required");

    try {
      setSaving(true);

      const method = editingId ? "PATCH" : "POST";

      const payload = editingId
        ? { ...form, _id: editingId }
        : { ...form };

      const res = await fetch("/api/suppliers", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Supplier save failed");
        return;
      }

      alert(editingId ? "Supplier updated ✅" : "Supplier created ✅");

      setForm(emptyForm);
      setEditingId("");
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      alert("Supplier save failed");
    } finally {
      setSaving(false);
    }
  };

  const editSupplier = (supplier) => {
    setEditingId(supplier._id);
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      companyName: supplier.companyName || "",
      contactPerson: supplier.contactPerson || "",
      openingDue: supplier.openingDue || 0,
      note: supplier.note || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSupplier = async (supplier) => {
    const ok = confirm(`Delete supplier "${supplier.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch("/api/suppliers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: supplier._id,
          delete: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Delete failed");
        return;
      }

      alert("Supplier deleted ✅");
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(emptyForm);
  };

  const applyAISearch = () => {
    const text = aiSearch.trim();
    if (!text) return;

    setSearch(text);

    const lower = text.toLowerCase();

    if (lower.includes("new") || lower.includes("create")) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || text.replace(/new|create/gi, "").trim(),
      }));
    }
  };

  const printPage = () => window.print();

  const shareData = async () => {
    const text = `Supplier Master
Total Supplier: ${summary.totalSupplier}
Opening Due: ৳ ${money(summary.openingDue)}
Current Due: ৳ ${money(summary.currentDue)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Supplier Master",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Supplier summary copied");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Supplier Master</h1>
              <p className="text-sm text-gray-500 mt-1">
                Supplier profile, contact, opening due and purchase connection
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchSuppliers}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={printPage}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={printPage}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <FileDown size={16} />
              PDF
            </button>

            <button
              onClick={shareData}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          <SummaryCard title="Total Supplier" value={summary.totalSupplier} text />
          <SummaryCard title="Opening Due" value={summary.openingDue} danger />
          <SummaryCard title="Current Due" value={summary.currentDue} danger />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-purple-600" />
          <h2 className="font-bold">AI Supplier Search</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
          <input
            value={aiSearch}
            onChange={(e) => setAiSearch(e.target.value)}
            placeholder="Example: Rahim supplier / phone 017 / create new ABC Traders"
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={applyAISearch}
            className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
          >
            AI Apply
          </button>

          <button
            onClick={() => {
              setAiSearch("");
              setSearch("");
            }}
            className="border px-5 py-3 rounded-xl hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-5 print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">
              {editingId ? "Edit Supplier" : "Create Supplier"}
            </h2>
            <p className="text-xs text-gray-500">
              Supplier information will be used in purchase and supplier ledger
            </p>
          </div>

          {editingId && (
            <button
              onClick={cancelEdit}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <X size={16} />
              Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Input
            label="Supplier Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />

          <Input
            label="Company Name"
            value={form.companyName}
            onChange={(v) => setForm({ ...form, companyName: v })}
          />

          <Input
            label="Contact Person"
            value={form.contactPerson}
            onChange={(v) => setForm({ ...form, contactPerson: v })}
          />

          <Input
            label="Opening Due"
            type="number"
            value={form.openingDue}
            onChange={(v) => setForm({ ...form, openingDue: Number(v) })}
          />

          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-xs text-gray-500 mb-1">Address</p>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-xs text-gray-500 mb-1">Note</p>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
            />
          </div>
        </div>

        <button
          onClick={saveSupplier}
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60"
        >
          {editingId ? <Pencil size={17} /> : <Plus size={17} />}
          {saving
            ? "Saving..."
            : editingId
            ? "Update Supplier"
            : "Create Supplier"}
        </button>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-bold">Supplier List</h2>
            <p className="text-xs text-gray-500">
              Search, edit and manage all suppliers
            </p>
          </div>

          <div className="relative print:hidden">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier..."
              className="border rounded-xl pl-9 pr-3 py-2 w-full md:w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Supplier</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Company</th>
                <th className="p-4 text-left">Contact Person</th>
                <th className="p-4 text-left">Address</th>
                <th className="p-4 text-right">Opening Due</th>
                <th className="p-4 text-right">Current Due</th>
                <th className="p-4 text-center print:hidden">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    No supplier found
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier._id}
                    className="border-t hover:bg-blue-50/40"
                  >
                    <td className="p-4 font-medium">{supplier.name}</td>
                    <td className="p-4">{supplier.phone || "-"}</td>
                    <td className="p-4">{supplier.companyName || "-"}</td>
                    <td className="p-4">{supplier.contactPerson || "-"}</td>
                    <td className="p-4">{supplier.address || "-"}</td>
                    <td className="p-4 text-right text-red-500 font-semibold">
                      ৳ {money(supplier.openingDue)}
                    </td>
                    <td className="p-4 text-right text-red-500 font-semibold">
                      ৳ {money(supplier.currentDue)}
                    </td>
                    <td className="p-4 print:hidden">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => editSupplier(supplier)}
                          className="px-3 py-2 rounded-xl border hover:bg-blue-50 hover:text-blue-600 inline-flex items-center gap-1"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => deleteSupplier(supplier)}
                          className="px-3 py-2 rounded-xl border hover:bg-red-50 hover:text-red-600 inline-flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {filteredSuppliers.length > 0 && (
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan="5" className="p-4 text-right font-bold">
                    Total
                  </td>
                  <td className="p-4 text-right font-bold text-red-500">
                    ৳ {money(summary.openingDue)}
                  </td>
                  <td className="p-4 text-right font-bold text-red-500">
                    ৳ {money(summary.currentDue)}
                  </td>
                  <td className="p-4 print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-2xl px-3 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}

function SummaryCard({ title, value, danger, text }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger ? "bg-red-50 text-red-600" : "bg-white"
      }`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3 className="text-xl font-bold mt-2">
        {text ? Number(value || 0) : `৳ ${money(value)}`}
      </h3>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}