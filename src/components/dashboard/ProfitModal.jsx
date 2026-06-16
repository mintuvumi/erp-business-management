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
  Sparkles,
} from "lucide-react";

export default function ProfitModal({ open, onClose }) {
  const [data, setData] = useState({});
  const [owners, setOwners] = useState([]);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [newOwner, setNewOwner] = useState({
    name: "",
    sharePercent: "",
  });

  const fetchProfit = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/dashboard/profit?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Profit data load failed");
      }

      setData(json.data || {});
    } catch (error) {
      console.error(error);
      alert(error.message || "Profit data load failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await fetch("/api/owners", { cache: "no-store" });
      const json = await res.json();

      if (json.success) setOwners(json.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProfit();
      fetchOwners();
    }
  }, [open]);

  const addOwner = async () => {
    if (!newOwner.name.trim()) return alert("Owner name required");
    if (!newOwner.sharePercent || Number(newOwner.sharePercent) <= 0) {
      return alert("Valid share percent required");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/owners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newOwner.name,
          sharePercent: Number(newOwner.sharePercent),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Owner save failed");
      }

      setNewOwner({ name: "", sharePercent: "" });
      fetchOwners();
    } catch (error) {
      alert(error.message || "Owner save failed");
    } finally {
      setLoading(false);
    }
  };

  const netProfit = Number(data.netProfit || 0);

  const getAIInsight = () => {
    const netProfit = Number(data.netProfit || 0);
    const totalExpense = Number(data.totalExpense || 0);
    const salesProfit = Number(data.salesProfit || 0);
    const monthlyProfit = Number(data.monthlyProfit || 0);

    if (netProfit < 0) {
      return {
        title: "AI Warning",
        message:
          "বর্তমানে business loss এ আছে। খরচ কমানো, slow moving product check করা এবং due collection বাড়ানো দরকার।",
        color: "bg-red-50 text-red-700 border-red-100",
      };
    }

    if (salesProfit > 0 && totalExpense > salesProfit * 0.5) {
      return {
        title: "AI Expense Alert",
        message:
          "Expense তুলনামূলক বেশি। Salary, office expense, conveyance এবং supplier payment review করুন।",
        color: "bg-orange-50 text-orange-700 border-orange-100",
      };
    }

    if (monthlyProfit > 0) {
      return {
        title: "AI Good Performance",
        message:
          "এই মাসে profit positive আছে। Best selling product ধরে রাখুন এবং unnecessary expense control করুন।",
        color: "bg-green-50 text-green-700 border-green-100",
      };
    }

    return {
      title: "AI Business Insight",
      message:
        "Business position stable আছে। Regular sales, expense এবং stock profit analysis করলে আরও ভালো decision নেওয়া যাবে।",
      color: "bg-blue-50 text-blue-700 border-blue-100",
    };
  };

  const aiInsight = getAIInsight();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-6xl max-h-[88vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-[32px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] animate-profitFloat">
        <div className="p-5 md:p-7 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Profit Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">
              {data.companyName || "Company Name"} •{" "}
              {data.companyAddress || "Company Address"} •{" "}
              {data.companyPhone || "Phone Number"}
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
            <div
              className={`rounded-3xl p-5 border ${
                data.celebrationType?.includes("loss")
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-blue-50 text-blue-700 border-blue-100"
              }`}
            >
              <h3 className="text-lg font-bold">{data.profitCardTitle}</h3>
              <p className="font-semibold mt-1">{data.profitCardValue}</p>
              <p className="text-sm mt-2">{data.message}</p>
            </div>
          )}

          <div className={`rounded-3xl p-5 border ${aiInsight.color}`}>
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="text-lg font-bold">{aiInsight.title}</h3>
            </div>

            <p className="text-sm mt-2">{aiInsight.message}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_auto] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchProfit();
                }}
                placeholder="Search product, customer, bill no, officer..."
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
              onClick={fetchProfit}
              className="h-12 px-5 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ProfitCard title="Today Profit" value={data.todayProfit} />
            <ProfitCard title="Monthly Profit" value={data.monthlyProfit} />
            <ProfitCard title="Yearly Profit" value={data.yearlyProfit} />
            <ProfitCard title="Net Profit" value={data.netProfit} highlight />
            <ProfitCard title="Sales Profit" value={data.salesProfit} />
            <ProfitCard title="Total Expense" value={data.totalExpense} danger />
            <ProfitCard title="Monthly Expense" value={data.monthlyExpense} danger />
            <ProfitCard title="Yearly Expense" value={data.yearlyExpense} danger />
            <ProfitCard title="Gross Sales" value={data.grossSales} />
            <ProfitCard title="Total Cost" value={data.totalCost} danger />
            <ProfitCard title="Net Loss" value={data.netLoss} danger />
            <ProfitCard
              title="Profit Margin"
              value={Number(data.profitMargin || 0)}
              suffix="%"
            />
          </div>

          <div className="flex flex-wrap gap-2">
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

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-semibold">Owner Profit Share</h3>
              <span className="text-xs text-gray-500">
                Net Profit ৳ {money(netProfit)}
              </span>
            </div>

            <div className="bg-gray-50 border-b p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
              <input
                value={newOwner.name}
                onChange={(e) =>
                  setNewOwner({ ...newOwner, name: e.target.value })
                }
                placeholder="Owner Name"
                className="border rounded-xl px-3 py-3 outline-none"
              />

              <input
                type="number"
                value={newOwner.sharePercent}
                onChange={(e) =>
                  setNewOwner({ ...newOwner, sharePercent: e.target.value })
                }
                placeholder="Share %"
                className="border rounded-xl px-3 py-3 outline-none"
              />

              <button
                onClick={addOwner}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
              >
                <Plus size={16} />
                Add Owner
              </button>
            </div>

            <div className="overflow-x-auto max-h-[260px]">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Owner Name</th>
                    <th className="p-3 text-right">Share %</th>
                    <th className="p-3 text-right">Profit Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {owners.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-5 text-center text-gray-500">
                        No owner found
                      </td>
                    </tr>
                  ) : (
                    owners.map((owner) => {
                      const shareAmount =
                        (netProfit * Number(owner.sharePercent || 0)) / 100;

                      return (
                        <tr key={owner._id} className="border-t hover:bg-blue-50/40">
                          <td className="p-3 font-medium">{owner.name}</td>
                          <td className="p-3 text-right">
                            {Number(owner.sharePercent || 0).toFixed(2)}%
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              shareAmount >= 0 ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            ৳ {money(shareAmount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-semibold">Product-wise Profit</h3>
              <span className="text-xs text-gray-500">
                {data.productWiseProfit?.length || 0} items
              </span>
            </div>

            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Sales</th>
                    <th className="p-3 text-right">Cost</th>
                    <th className="p-3 text-right">Profit / Loss</th>
                  </tr>
                </thead>

                <tbody>
                  {!data.productWiseProfit?.length ? (
                    <tr>
                      <td colSpan="5" className="p-5 text-center text-gray-500">
                        No profit data found
                      </td>
                    </tr>
                  ) : (
                    data.productWiseProfit.map((item) => (
                      <tr key={item.name} className="border-t hover:bg-blue-50/40">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-right">{item.qty}</td>
                        <td className="p-3 text-right">৳ {money(item.sales)}</td>
                        <td className="p-3 text-right">৳ {money(item.cost)}</td>
                        <td
                          className={`p-3 text-right font-bold ${
                            Number(item.profit) >= 0
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          ৳ {money(item.profit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-semibold">Expense Category Analysis</h3>
              <span className="text-xs text-gray-500">
                {data.expenseCategoryAnalysis?.length || 0} categories
              </span>
            </div>

            <div className="overflow-x-auto max-h-[260px]">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {!data.expenseCategoryAnalysis?.length ? (
                    <tr>
                      <td colSpan="2" className="p-5 text-center text-gray-500">
                        No expense data found
                      </td>
                    </tr>
                  ) : (
                    data.expenseCategoryAnalysis.map((item) => (
                      <tr key={item.category} className="border-t hover:bg-blue-50/40">
                        <td className="p-3">{item.category}</td>
                        <td className="p-3 text-right font-bold text-red-500">
                          ৳ {money(item.amount)}
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

      <style jsx>{`
        @keyframes profitFloat {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-profitFloat {
          animation: profitFloat 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function ProfitCard({ title, value, highlight, danger, suffix = "" }) {
  const isLoss = Number(value || 0) < 0;

  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 ${
        highlight
          ? isLoss
            ? "bg-red-500 text-white shadow-[0_18px_40px_rgba(239,68,68,0.25)]"
            : "bg-blue-500 text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
          : danger || isLoss
          ? "bg-red-50 text-red-600"
          : "bg-white hover:shadow-[0_14px_36px_rgba(59,130,246,0.12)]"
      }`}
    >
      <p
        className={`text-xs md:text-sm ${
          highlight ? "text-white/90" : "text-gray-500"
        }`}
      >
        {title}
      </p>

      <h3 className="text-xl md:text-2xl font-bold mt-3">
        {suffix === "%" ? `${money(value)}%` : `৳ ${money(value)}`}
      </h3>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}