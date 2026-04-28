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

export default function ExpenseModal({ open, onClose }) {
  const [data, setData] = useState({
    todayExpense: 0,
    monthlyExpense: 0,
    yearlyExpense: 0,
    totalExpense: 0,
    categoryWise: [],
    rows: [],
  });

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    type: "out",
    category: "expense",
    title: "",
    amount: "",
    note: "",
  });

  const fetchExpense = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (date) params.set("date", date);

      const res = await fetch(`/api/dashboard/expense?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error(error);
      alert("Expense data load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchExpense();
  }, [open]);

  const saveExpense = async () => {
    if (!form.title.trim()) return alert("Title required");
    if (!form.amount || Number(form.amount) <= 0) {
      return alert("Valid amount required");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/cash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          refType: "manual",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Expense save failed");
      }

      setShowAdd(false);
      setForm({
        type: "out",
        category: "expense",
        title: "",
        amount: "",
        note: "",
      });

      fetchExpense();
    } catch (error) {
      alert(error.message || "Expense save failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-6xl max-h-[88vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-[32px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] animate-expenseFloat">
        <div className="p-5 md:p-7 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Expense Statement</h2>
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
          {data.message && (
            <div className="rounded-3xl p-5 border bg-blue-50 text-blue-700 border-blue-100">
              <h3 className="font-bold">
                {data.celebrationType === "yearly"
                  ? "Yearly Expense Review"
                  : "Monthly Expense Review"}
              </h3>
              <p className="text-sm mt-2">{data.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_auto] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expense statement..."
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
              onClick={fetchExpense}
              className="h-12 px-5 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ExpenseCard title="Today Expense" value={data.todayExpense} />
            <ExpenseCard title="Monthly Expense" value={data.monthlyExpense} />
            <ExpenseCard title="Yearly Expense" value={data.yearlyExpense} />
            <ExpenseCard title="Total Expense" value={data.totalExpense} danger />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus size={16} />
              Add Expense
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
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="border rounded-xl px-3 py-3 outline-none"
              >
                <option value="expense">General Expense</option>
                <option value="salary_payment">Salary Payment</option>
                <option value="refund_paid">Refund Paid</option>
              </select>

              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Expense Title"
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
                onClick={saveExpense}
                disabled={loading}
                className="md:col-span-2 bg-blue-500 text-white rounded-xl py-3 hover:bg-blue-600 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Expense"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border rounded-3xl overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Category-wise Expense</h3>
              </div>

              <div className="divide-y">
                {data.categoryWise?.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    No category found
                  </div>
                ) : (
                  data.categoryWise?.map((cat) => (
                    <div key={cat.category} className="p-4 flex justify-between">
                      <div>
                        <p className="font-medium capitalize">
                          {cat.category?.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cat.count} records
                        </p>
                      </div>
                      <p className="font-bold text-red-500">
                        ৳ {money(cat.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border rounded-3xl overflow-hidden">
              <div className="p-4 border-b flex justify-between">
                <h3 className="font-semibold">Expense Details</h3>
                <span className="text-xs text-gray-500">
                  {data.rows?.length || 0} records
                </span>
              </div>

              <div className="overflow-x-auto max-h-[360px]">
                <table className="w-full min-w-[780px] text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Source</th>
                      <th className="p-3 text-left">Title</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-left">Note</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.rows?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-5 text-center text-gray-500">
                          No expense found
                        </td>
                      </tr>
                    ) : (
                      data.rows?.map((row) => (
                        <tr key={row._id} className="border-t hover:bg-blue-50/40">
                          <td className="p-3">{row.date}</td>
                          <td className="p-3 capitalize">{row.source}</td>
                          <td className="p-3">{row.title}</td>
                          <td className="p-3 capitalize">
                            {row.category?.replaceAll("_", " ")}
                          </td>
                          <td className="p-3 text-right text-red-500 font-semibold">
                            ৳ {money(row.amount)}
                          </td>
                          <td className="p-3">{row.note || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes expenseFloat {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-expenseFloat {
          animation: expenseFloat 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function ExpenseCard({ title, value, danger }) {
  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 ${
        danger
          ? "bg-red-50 text-red-600"
          : "bg-white hover:shadow-[0_14px_36px_rgba(59,130,246,0.12)]"
      }`}
    >
      <p className="text-xs md:text-sm text-gray-500">{title}</p>
      <h3 className="text-xl md:text-2xl font-bold mt-3">৳ {money(value)}</h3>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}