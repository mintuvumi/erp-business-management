"use client";

import { useEffect, useState } from "react";
import {
  X,
  Search,
  CalendarDays,
  Plus,
  Printer,
  Download,
  Share2,
} from "lucide-react";

export default function CashInHandModal({ open, onClose }) {
  const [data, setData] = useState({
    cashInHand: 0,
    totalIn: 0,
    totalOut: 0,
    bankBalance: 0,
    transactions: [],
  });

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    type: "out",
    category: "expense",
    title: "",
    amount: "",
    note: "",
  });

  const netCashInHand = Number(data.totalIn || 0) - Number(data.totalOut || 0);
  const totalBankBalance = Number(data.bankBalance || 0);
  const cashAndBankTotal = netCashInHand + totalBankBalance;

  const fetchCash = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (date) params.set("date", date);

    const res = await fetch(`/api/cash?${params.toString()}`);
    const json = await res.json();

    if (json.success) {
      setData({
        cashInHand: json.data?.cashInHand || 0,
        totalIn: json.data?.totalIn || 0,
        totalOut: json.data?.totalOut || 0,
        bankBalance: json.data?.bankBalance || 0,
        transactions: json.data?.transactions || [],
      });
    }
  };

  useEffect(() => {
    if (open) fetchCash();
  }, [open]);

  const saveTransaction = async () => {
    const res = await fetch("/api/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (json.success) {
      setShowAdd(false);
      setForm({
        type: "out",
        category: "expense",
        title: "",
        amount: "",
        note: "",
      });
      fetchCash();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-6xl max-h-[88vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-[32px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] animate-cashFloat">
        <div className="p-5 md:p-7 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Cash In Hand</h2>
            <p className="text-sm text-gray-500 mt-1">
              Company Name • Company Address • Phone Number
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 md:p-7 space-y-5 overflow-y-auto max-h-[calc(88vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_auto] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cash statement..."
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <CalendarDays size={18} className="text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <button
              onClick={fetchCash}
              className="px-5 py-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard title="Net Cash In Hand" value={netCashInHand} highlight />
            <StatCard title="Total Cash In" value={data.totalIn} />
            <StatCard title="Total Cash Out" value={data.totalOut} />
            <StatCard title="Cash + Bank Balance" value={cashAndBankTotal} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus size={16} />
              Add Expense / Payment
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50">
              <Download size={16} />
              PDF
            </button>

            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50">
              <Share2 size={16} />
              Share
            </button>
          </div>

          {showAdd && (
            <div className="bg-gray-50 border rounded-3xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border rounded-xl px-3 py-3 outline-none"
              >
                <option value="in">Cash In</option>
                <option value="out">Cash Out</option>
              </select>

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="border rounded-xl px-3 py-3 outline-none"
              >
                <option value="expense">Expense</option>
                <option value="supplier_payment">Supplier Payment</option>
                <option value="salary_payment">Salary Payment</option>
                <option value="other_income">Other Income</option>
                <option value="due_collection">Due Collection</option>
                <option value="bank_withdraw">Bank Withdraw</option>
                <option value="bank_deposit">Bank Deposit</option>
                <option value="refund_received">Refund Received</option>
                <option value="refund_paid">Refund Paid</option>
                <option value="cash_purchase">Cash Purchase</option>
              </select>

              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="border rounded-xl px-3 py-3 outline-none"
              />

              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount"
                className="border rounded-xl px-3 py-3 outline-none"
              />

              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Note"
                className="md:col-span-2 border rounded-xl px-3 py-3 outline-none"
              />

              <button
                onClick={saveTransaction}
                className="md:col-span-2 bg-blue-500 text-white rounded-xl py-3 hover:bg-blue-600"
              >
                Save Transaction
              </button>
            </div>
          )}

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-semibold">Cash Statement</h3>
              <span className="text-xs text-gray-500">
                {data.transactions?.length || 0} records
              </span>
            </div>

            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-left">Note</th>
                  </tr>
                </thead>

                <tbody>
                  {data.transactions?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-5 text-center text-gray-500">
                        No cash transaction found
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map((t) => (
                      <tr key={t._id} className="border-t hover:bg-blue-50/40">
                        <td className="p-3">{t.date}</td>
                        <td className="p-3">{t.title}</td>
                        <td className="p-3 capitalize">
                          {t.category?.replaceAll("_", " ")}
                        </td>
                        <td
                          className={`p-3 font-medium ${
                            t.type === "in"
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {t.type}
                        </td>
                        <td className="p-3 text-right">
                          ৳ {Number(t.amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3">{t.note || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes cashFloat {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-cashFloat {
          animation: cashFloat 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, highlight }) {
  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 ${
        highlight
          ? "bg-blue-500 text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
          : "bg-white hover:shadow-[0_14px_36px_rgba(59,130,246,0.12)]"
      }`}
    >
      <p
        className={`text-xs md:text-sm ${
          highlight ? "text-blue-50" : "text-gray-500"
        }`}
      >
        {title}
      </p>

      <h3 className="text-xl md:text-2xl font-bold mt-3">
        ৳ {Number(value || 0).toFixed(2)}
      </h3>
    </div>
  );
}