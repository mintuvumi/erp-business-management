"use client";

import { useEffect, useState } from "react";
import {
  X,
  Search,
  CalendarDays,
  RefreshCcw,
  Printer,
  Download,
  Share2,
  Plus,
} from "lucide-react";

import CompanyHeader from "@/components/common/CompanyHeader";
import { exportElementToPDF, shareText } from "@/utils/exportPDF";

export default function BankBalanceModal({ open, onClose }) {
  const [data, setData] = useState({
    totalBankBalance: 0,
    totalIn: 0,
    totalOut: 0,
    banks: [],
    transactions: [],
  });

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    bankId: "",
    type: "out",
    category: "bank_payment",
    title: "",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchBank = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (date) params.set("date", date);

      const res = await fetch(`/api/bank?${params.toString()}`);
      const json = await res.json();

      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
      alert("Bank data load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchBank();
  }, [open]);

  const saveTransaction = async () => {
    if (!form.bankId) return alert("Select bank");
    if (!form.title.trim()) return alert("Title required");
    if (!form.amount || Number(form.amount) <= 0)
      return alert("Valid amount required");

    try {
      setLoading(true);

      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          action: "transaction",
          amount: Number(form.amount),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      setShowAdd(false);
      setForm({
        bankId: "",
        type: "out",
        category: "bank_payment",
        title: "",
        amount: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
      });

      fetchBank();
    } catch (err) {
      alert(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur flex items-center justify-center p-3 md:p-6">

      {/* ✅ UPDATED WRAPPER WITH ID */}
      <div
        id="bank-statement-pdf"
        className="w-full max-w-6xl max-h-[88vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-[32px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
      >

        {/* HEADER */}
        <div className="border-b p-5 flex justify-between items-start">
          <CompanyHeader title="Bank Statement" />

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full border hover:bg-red-50 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(88vh-100px)]">

          {/* FILTER */}
          <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full outline-none text-sm"
              />
            </div>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm"
            />

            <button
              onClick={fetchBank}
              className="bg-blue-500 text-white px-4 rounded-xl flex items-center justify-center"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard title="Total Balance" value={data.totalBankBalance} highlight />
            <StatCard title="Total In" value={data.totalIn} />
            <StatCard title="Total Out" value={data.totalOut} />
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
              <Plus size={16} /> Add
            </button>

            <button onClick={() => window.print()} className="btn-outline">
              <Printer size={16} /> Print
            </button>

            {/* ✅ UPDATED PDF */}
            <button
              onClick={() =>
                exportElementToPDF({
                  elementId: "bank-statement-pdf",
                  fileName: "bank-statement.pdf",
                })
              }
              className="btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              <Download size={16} />
              PDF
            </button>

            {/* ✅ UPDATED SHARE */}
            <button
              onClick={() =>
                shareText({
                  title: "Bank Statement",
                  text: "Bank statement report is ready.",
                })
              }
              className="btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>

          {/* BANK LIST */}
          <div className="grid md:grid-cols-3 gap-3">
            {data.banks.map((b) => (
              <div key={b._id} className="border p-4 rounded-xl">
                <h3 className="font-bold">{b.bankName}</h3>
                <p className="text-sm text-gray-500">{b.accountNo}</p>
                <p className="text-blue-600 font-bold mt-2">
                  ৳ {Number(b.currentBalance).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* TABLE */}
          <div className="border rounded-2xl overflow-hidden">
            <div className="p-3 border-b font-semibold">Bank Statement</div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t._id} className="border-t">
                    <td className="p-2">{t.date}</td>
                    <td className="p-2">{t.title}</td>
                    <td className="p-2 text-right">
                      ৳ {Number(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

/* reusable */
function StatCard({ title, value, highlight }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? "bg-blue-500 text-white" : ""}`}>
      <p className="text-xs">{title}</p>
      <h3 className="text-xl font-bold mt-2">
        ৳ {Number(value).toFixed(2)}
      </h3>
    </div>
  );
}