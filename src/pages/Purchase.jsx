"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Save,
  RefreshCcw,
  Banknote,
  CreditCard,
  Trash2,
  Search,
} from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function arrayOfBanks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.banks)) return data.data.banks;
  if (Array.isArray(data?.banks)) return data.banks;
  return [];
}

function arrayOfSuppliers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.suppliers)) return data.data.suppliers;
  if (Array.isArray(data?.suppliers)) return data.suppliers;
  return [];
}

const emptyForm = {
  supplierId: "",
  supplierName: "",
  supplierPhone: "",
  supplierAddress: "",
  supplierBillNo: "",
  itemName: "",
  qty: "1",
  price: "",
  paidAmount: "",
  purchaseType: "stock",
  paymentFrom: "cash",
  bankId: "",
  note: "",
  date: today(),
};

export default function Purchase() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierSuggest, setShowSupplierSuggest] = useState(false);

  const [banks, setBanks] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const total = useMemo(() => {
    return Number(form.qty || 0) * Number(form.price || 0);
  }, [form.qty, form.price]);

  const due = useMemo(() => {
    return Math.max(total - Number(form.paidAmount || 0), 0);
  }, [total, form.paidAmount]);

  const bankList = useMemo(() => arrayOfBanks(banks), [banks]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadSuppliers = async (q = "") => {
    try {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(q)}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      const list = arrayOfSuppliers(data);

      setSuppliers(list);
      setSupplierSuggestions(list.slice(0, 8));
    } catch (error) {
      console.error("SUPPLIER_LOAD_ERROR:", error);
      setSupplierSuggestions([]);
    }
  };

  const loadBanks = async () => {
    try {
      const res = await fetch("/api/bank?limit=100", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      setBanks(arrayOfBanks(data));
    } catch (error) {
      console.error("BANK_LOAD_ERROR:", error);
      setBanks([]);
    }
  };

  const loadPurchases = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/purchase", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setPurchases(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error("PURCHASE_LOAD_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers("");
    loadBanks();
    loadPurchases();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.supplierName.trim().length >= 2) {
        loadSuppliers(form.supplierName);
        setShowSupplierSuggest(true);
      } else {
        setSupplierSuggestions([]);
        setShowSupplierSuggest(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [form.supplierName]);

  const selectSupplier = (s) => {
    setForm((prev) => ({
      ...prev,
      supplierId: s._id || s.id || "",
      supplierName: s.name || s.supplierName || "",
      supplierPhone: s.phone || s.supplierPhone || "",
      supplierAddress: s.address || s.supplierAddress || "",
    }));

    setShowSupplierSuggest(false);
    setSupplierSuggestions([]);
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      date: today(),
    });
    setShowSupplierSuggest(false);
    setSupplierSuggestions([]);
  };

  const savePurchase = async () => {
    if (saving) return;

    if (!form.supplierName.trim()) return alert("Supplier name required");
    if (!form.itemName.trim()) return alert("Item name required");

    const qty = Number(form.qty || 0);
    const price = Number(form.price || 0);
    const paidAmount = Number(form.paidAmount || 0);

    if (qty <= 0) return alert("Valid quantity required");
    if (price <= 0) return alert("Valid price required");
    if (paidAmount < 0) return alert("Paid amount cannot be negative");
    if (paidAmount > total) return alert("Paid amount cannot exceed total");

    if (paidAmount > 0 && form.paymentFrom === "bank" && !form.bankId) {
      return alert("Select bank account");
    }

    try {
      setSaving(true);

      const payload = {
        supplierId: form.supplierId || null,
        supplierName: form.supplierName,
        supplierPhone: form.supplierPhone,
        supplierAddress: form.supplierAddress,
        supplierBillNo: form.supplierBillNo,

        itemName: form.itemName,
        qty,
        price,
        subTotal: total,
        grandTotal: total,
        paidAmount,
        dueAmount: due,

        purchaseType: form.purchaseType,
        paymentFrom: form.paymentFrom,
        paymentMethod: form.paymentFrom,
        bankId: form.paymentFrom === "bank" ? form.bankId : null,

        date: form.date || today(),
        note: form.note,

        items: [
          {
            itemName: form.itemName,
            qty,
            price,
            total,
          },
        ],
      };

      const res = await fetch("/api/purchase", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Purchase save failed");
      }

      window.dispatchEvent(new Event("dashboard:update"));
      window.dispatchEvent(new Event("purchase:saved"));
      window.dispatchEvent(new Event("cashbank:update"));

      alert("Purchase saved successfully ✅");

      resetForm();
      await loadPurchases();
    } catch (error) {
      alert(error.message || "Purchase save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      savePurchase();
    }

    if (e.key === "Escape") {
      resetForm();
    }
  };

  const deleteLocalRow = (id) => {
    setPurchases((prev) => prev.filter((p) => String(p._id) !== String(id)));
  };

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-blue-600" />
            Purchase Entry
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ctrl+Enter save, Esc clear. Supplier, cash/bank payment and stock update.
          </p>
        </div>

        <button
          onClick={loadPurchases}
          className="px-4 py-2 rounded-xl border bg-white flex items-center gap-2 hover:bg-blue-50"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[430px_1fr] gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
          <h2 className="font-bold">Quick Purchase</h2>

          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Supplier Name *
            </label>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3.5 text-gray-400"
              />
              <input
                value={form.supplierName}
                onChange={(e) => {
                  update("supplierName", e.target.value);
                  update("supplierId", "");
                }}
                onFocus={() => {
                  if (form.supplierName) setShowSupplierSuggest(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search / type supplier name..."
                className="w-full border rounded-xl pl-10 p-3 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {showSupplierSuggest && supplierSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-2xl shadow-xl z-[9999] overflow-hidden">
                {supplierSuggestions.map((s, index) => (
                  <button
                    type="button"
                    key={s._id || s.id || `${s.name}-${index}`}
                    onClick={() => selectSupplier(s)}
                    className="w-full text-left p-3 border-b last:border-b-0 hover:bg-blue-50"
                  >
                    <p className="font-semibold text-sm">
                      {s.name || s.supplierName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.phone || s.supplierPhone || "No phone"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Supplier Phone"
            value={form.supplierPhone}
            onChange={(v) => update("supplierPhone", v)}
            placeholder="Supplier phone"
            onKeyDown={handleKeyDown}
          />

          <Input
            label="Supplier Address"
            value={form.supplierAddress}
            onChange={(v) => update("supplierAddress", v)}
            placeholder="Supplier address"
            onKeyDown={handleKeyDown}
          />

          <Input
            label="Supplier Bill No"
            value={form.supplierBillNo}
            onChange={(v) => update("supplierBillNo", v)}
            placeholder="Supplier invoice / challan no"
            onKeyDown={handleKeyDown}
          />

          <Input
            label="Item Name *"
            value={form.itemName}
            onChange={(v) => update("itemName", v)}
            placeholder="Product / raw material name"
            onKeyDown={handleKeyDown}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Qty"
              value={form.qty}
              onChange={(v) => update("qty", v)}
              onKeyDown={handleKeyDown}
            />

            <Input
              type="number"
              label="Price"
              value={form.price}
              onChange={(v) => update("price", v)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Total" value={money(total)} readOnly />

            <Input label="Due" value={money(due)} readOnly />
          </div>

          <Input
            type="number"
            label="Paid Amount"
            value={form.paidAmount}
            onChange={(v) => update("paidAmount", v)}
            placeholder="Enter paid amount"
            onKeyDown={handleKeyDown}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                update("paymentFrom", "cash");
                update("bankId", "");
              }}
              className={`border rounded-xl p-3 flex items-center justify-center gap-2 font-semibold ${
                form.paymentFrom === "cash"
                  ? "bg-blue-600 text-white"
                  : "bg-white"
              }`}
            >
              <Banknote size={16} /> Cash
            </button>

            <button
              type="button"
              onClick={() => update("paymentFrom", "bank")}
              className={`border rounded-xl p-3 flex items-center justify-center gap-2 font-semibold ${
                form.paymentFrom === "bank"
                  ? "bg-blue-600 text-white"
                  : "bg-white"
              }`}
            >
              <CreditCard size={16} /> Bank
            </button>
          </div>

          {form.paymentFrom === "bank" && (
            <select
              value={form.bankId}
              onChange={(e) => update("bankId", e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
            >
              <option value="">Select Bank</option>
              {bankList.map((b, index) => (
                <option
                  key={b._id || b.id || `${b.bankName}-${index}`}
                  value={b._id || b.id}
                >
                  {b.bankName || b.accountName || b.accountNo || "Bank"}
                </option>
              ))}
            </select>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Purchase Type
            </label>
            <select
              value={form.purchaseType}
              onChange={(e) => update("purchaseType", e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
            >
              <option value="stock">Stock</option>
              <option value="raw_material">Raw Material</option>
              <option value="direct">Direct</option>
              <option value="factory_cost">Factory Cost</option>
            </select>
          </div>

          <Input
            type="date"
            label="Date"
            value={form.date}
            onChange={(v) => update("date", v)}
            onKeyDown={handleKeyDown}
          />

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Note
            </label>
            <textarea
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === "Enter") {
                  e.preventDefault();
                  savePurchase();
                }
              }}
              placeholder="Purchase note..."
              className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[80px]"
            />
          </div>

          <button
            onClick={savePurchase}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center gap-3">
            <div>
              <h2 className="font-bold">Recent Purchases</h2>
              <p className="text-xs text-gray-500">
                Last saved purchase entries.
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {purchases.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Purchase No</th>
                  <th className="p-3 text-left">Supplier</th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Due</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      No purchase found.
                    </td>
                  </tr>
                ) : (
                  purchases.slice(0, 80).map((p, index) => (
                    <tr
                      key={p._id || `${p.purchaseNo}-${index}`}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-3">{String(p.date || "").slice(0, 10)}</td>
                      <td className="p-3 font-semibold">
                        {p.purchaseNo || p.billNo || p.supplierBillNo || "-"}
                      </td>
                      <td className="p-3">{p.supplierName || "-"}</td>
                      <td className="p-3">{p.itemName || "-"}</td>
                      <td className="p-3 text-right">{p.qty || 0}</td>
                      <td className="p-3 text-right">৳ {money(p.grandTotal)}</td>
                      <td className="p-3 text-right text-green-600">
                        ৳ {money(p.paidAmount)}
                      </td>
                      <td className="p-3 text-right text-red-500 font-bold">
                        ৳ {money(p.dueAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => deleteLocalRow(p._id)}
                          className="w-9 h-9 rounded-xl border text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                          title="Remove from this list only"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  onKeyDown,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">
        {label}
      </label>

      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder || label}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        className={`w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 ${
          readOnly ? "bg-gray-50 text-gray-500" : "bg-white"
        }`}
      />
    </div>
  );
}