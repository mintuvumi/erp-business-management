"use client";

import { useEffect, useState } from "react";
import { X, Save, Ban, ShoppingCart } from "lucide-react";

export default function EditPurchaseModal({
  open,
  onClose,
  purchase,
  onUpdated,
}) {
  const [form, setForm] = useState({
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    supplierBillNo: "",
    supplierInvoiceNo: "",
    date: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (purchase) {
      setForm({
        supplierName: purchase.supplierName || "",
        supplierPhone: purchase.supplierPhone || "",
        supplierAddress: purchase.supplierAddress || "",
        supplierBillNo: purchase.supplierBillNo || "",
        supplierInvoiceNo: purchase.supplierInvoiceNo || "",
        date: purchase.date || new Date().toISOString().slice(0, 10),
        note: purchase.note || "",
      });
    }
  }, [purchase]);

  if (!open || !purchase) return null;

  const updatePurchase = async () => {
    if (!form.supplierName.trim()) {
      return alert("Supplier name required");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/purchase", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: purchase._id,
          supplierName: form.supplierName,
          supplierPhone: form.supplierPhone,
          supplierAddress: form.supplierAddress,
          supplierBillNo: form.supplierBillNo,
          supplierInvoiceNo: form.supplierInvoiceNo,
          date: form.date,
          note: form.note,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Update failed");
        return;
      }

      alert("Purchase updated ✅");
      onUpdated?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert("Purchase update failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelPurchase = async () => {
    const ok = confirm(
      "Are you sure? This purchase will be cancelled from active records."
    );

    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch("/api/purchase", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: purchase._id,
          cancel: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Cancel failed");
        return;
      }

      alert("Purchase cancelled ✅");
      onUpdated?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert("Purchase cancel failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-[28px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden">
        <div className="p-5 border-b flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700">
              <ShoppingCart size={20} />
            </div>

            <div>
              <h2 className="font-bold text-lg">Edit Purchase</h2>
              <p className="text-xs text-gray-500">
                Update supplier bill, invoice, date and note
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <Info title="Purchase No" value={purchase.purchaseNo || "-"} />
            <Info title="Item" value={purchase.itemName || "-"} />
            <Info
              title="Grand Total"
              value={`৳ ${money(purchase.grandTotal || purchase.total)}`}
            />
            <Info title="Paid" value={`৳ ${money(purchase.paidAmount)}`} />
            <Info title="Due" value={`৳ ${money(purchase.dueAmount)}`} />
            <Info title="Payment" value={purchase.paymentType || "-"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Supplier Name"
              value={form.supplierName}
              onChange={(v) => setForm({ ...form, supplierName: v })}
            />

            <Input
              label="Supplier Phone"
              value={form.supplierPhone}
              onChange={(v) => setForm({ ...form, supplierPhone: v })}
            />

            <Input
              label="Supplier Bill No"
              value={form.supplierBillNo}
              onChange={(v) => setForm({ ...form, supplierBillNo: v })}
            />

            <Input
              label="Supplier Invoice No"
              value={form.supplierInvoiceNo}
              onChange={(v) => setForm({ ...form, supplierInvoiceNo: v })}
            />

            <Input
              label="Purchase Date"
              type="date"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />

            <Input
              label="Supplier Address"
              value={form.supplierAddress}
              onChange={(v) => setForm({ ...form, supplierAddress: v })}
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Note</p>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full border rounded-2xl p-3 outline-none min-h-[90px] focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="p-5 border-t flex flex-col md:flex-row gap-2 md:justify-between">
          <button
            onClick={cancelPurchase}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 px-5 py-3 rounded-xl hover:bg-red-100 disabled:opacity-60"
          >
            <Ban size={16} />
            Cancel Purchase
          </button>

          <button
            onClick={updatePurchase}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{title}</p>
      <p className="font-semibold mt-1">{value}</p>
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

function money(value) {
  return Number(value || 0).toFixed(2);
}