"use client";

import { useEffect, useState } from "react";
import { X, Save, Ban } from "lucide-react";

export default function EditBankTransactionModal({
  open,
  onClose,
  transaction,
  onUpdated,
}) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    date: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        title: transaction.title || "",
        amount: transaction.amount || "",
        date:
          transaction.date ||
          new Date(transaction.createdAt || Date.now()).toISOString().slice(0, 10),
        note: transaction.note || "",
      });
    }
  }, [transaction]);

  if (!open || !transaction) return null;

  const updateTransaction = async () => {
    if (!form.title.trim()) return alert("Title required");
    if (!form.amount || Number(form.amount) <= 0) {
      return alert("Valid amount required");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: transaction._id,
          title: form.title,
          amount: Number(form.amount),
          date: form.date,
          note: form.note,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        return alert(data.message || "Update failed");
      }

      alert("Transaction updated ✅");
      onUpdated?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelTransaction = async () => {
    const ok = confirm(
      "Are you sure? This transaction will be cancelled and bank balance will be reversed."
    );

    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch("/api/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: transaction._id,
          cancel: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        return alert(data.message || "Cancel failed");
      }

      alert("Transaction cancelled ✅");
      onUpdated?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-[28px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Edit Bank Transaction</h2>
            <p className="text-xs text-gray-500">
              Update or cancel transaction safely
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Amount"
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              value={transaction.type === "in" ? "Credit / In" : "Debit / Out"}
              readOnly
              className="border rounded-xl p-3 bg-gray-50 text-gray-500"
            />
          </div>

          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Note"
            className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px]"
          />

          <div className="bg-gray-50 border rounded-2xl p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span className="font-semibold">
                {transaction.bankId?.bankName || "-"}
              </span>
            </div>

            <div className="flex justify-between mt-2">
              <span className="text-gray-500">Category</span>
              <span className="font-semibold capitalize">
                {String(transaction.category || "-").replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex flex-col md:flex-row gap-2 md:justify-between">
          <button
            onClick={cancelTransaction}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 px-5 py-3 rounded-xl hover:bg-red-100 disabled:opacity-60"
          >
            <Ban size={16} />
            Cancel Transaction
          </button>

          <button
            onClick={updateTransaction}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}