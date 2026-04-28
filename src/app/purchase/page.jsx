"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export default function PurchasePage() {
  const [form, setForm] = useState({
    itemName: "",
    qty: 1,
    price: 0,
    purchaseType: "stock",
    paymentType: "cash",
    supplierName: "",
    paidAmount: 0,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = form.qty * form.price;
  const due =
    form.paymentType === "credit"
      ? Math.max(total - form.paidAmount, 0)
      : 0;

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          date: new Date().toISOString().slice(0, 10),
        }),
      });

      setSaved(true);

      setForm({
        itemName: "",
        qty: 1,
        price: 0,
        purchaseType: "stock",
        paymentType: "cash",
        supplierName: "",
        paidAmount: 0,
      });
    } catch (err) {
      alert("Error saving purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

      {/* HEADER */}
      <h2 className="text-lg md:text-xl font-bold">
        New Purchase
      </h2>

      {/* FORM */}
      <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">

        {/* ITEM */}
        <Input
          label="Item Name"
          value={form.itemName}
          onChange={(v) => setForm({ ...form, itemName: v })}
        />

        {/* QTY + PRICE */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            value={form.qty}
            onChange={(v) => setForm({ ...form, qty: +v })}
          />

          <Input
            label="Price"
            type="number"
            value={form.price}
            onChange={(v) => setForm({ ...form, price: +v })}
          />
        </div>

        {/* PURCHASE TYPE */}
        <Select
          label="Purchase Type"
          value={form.purchaseType}
          options={[
            { label: "Stock Purchase", value: "stock" },
            { label: "Direct Purchase", value: "direct" },
          ]}
          onChange={(v) => setForm({ ...form, purchaseType: v })}
        />

        {/* PAYMENT TYPE */}
        <Select
          label="Payment Type"
          value={form.paymentType}
          options={[
            { label: "Cash", value: "cash" },
            { label: "Credit", value: "credit" },
          ]}
          onChange={(v) => setForm({ ...form, paymentType: v })}
        />

        {/* SUPPLIER */}
        {form.paymentType === "credit" && (
          <Input
            label="Supplier Name"
            value={form.supplierName}
            onChange={(v) => setForm({ ...form, supplierName: v })}
          />
        )}

        {/* PAID */}
        {form.paymentType === "credit" && (
          <Input
            label="Paid Amount"
            type="number"
            value={form.paidAmount}
            onChange={(v) => setForm({ ...form, paidAmount: +v })}
          />
        )}

        {/* SUMMARY */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
          <p>Total: ৳ {total}</p>
          <p>Due: ৳ {due}</p>
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`
            w-full py-3 rounded-xl flex items-center justify-center gap-2
            transition-all duration-300 text-white font-medium
            ${
              saved
                ? "bg-green-500"
                : saving
                ? "bg-blue-300"
                : "bg-blue-500 hover:bg-blue-600 active:scale-[0.98]"
            }
          `}
        >
          <Save size={16} />
          {saving
            ? "Saving..."
            : saved
            ? "Saved ✔"
            : "Save Purchase"}
        </button>

      </div>
    </div>
  );
}

/* INPUT */
function Input({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 outline-none text-sm
        focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
      />
    </div>
  );
}

/* SELECT */
function Select({ label, value, options, onChange }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 text-sm outline-none
        focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
      >
        {options.map((o, i) => (
          <option key={i} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}