"use client";

import { useEffect, useState } from "react";
import { Search, X, CalendarDays, RefreshCcw } from "lucide-react";

export default function TotalPurchaseModal({ open, onClose }) {
  const [stats, setStats] = useState({
    totalDuePurchase: 0,
    todayDuePurchase: 0,
    monthlyDuePurchase: 0,
    todayCashPurchase: 0,
    monthlyCashPurchase: 0,
    monthlyTotalPurchase: 0,
    purchases: [],
  });

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPurchaseData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (date) params.set("date", date);

      const res = await fetch(`/api/dashboard/purchase?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPurchaseData();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-3 md:p-6">
      <div className="relative w-full max-w-5xl rounded-[32px] bg-white/95 border shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden animate-floatCard">
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-cyan-200/30 rounded-full blur-3xl" />

        <div className="relative p-5 md:p-7 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Total Purchase Due
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Supplier due, cash purchase and monthly purchase summary
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative p-5 md:p-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_48px] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search supplier or item..."
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
              onClick={fetchPurchaseData}
              className="h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all shadow-sm"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <PurchaseStatCard
              title="Total Due Purchase"
              value={stats.totalDuePurchase}
              highlight
            />
            <PurchaseStatCard
              title="Today Due Purchase"
              value={stats.todayDuePurchase}
            />
            <PurchaseStatCard
              title="Monthly Due Purchase"
              value={stats.monthlyDuePurchase}
            />
            <PurchaseStatCard
              title="Today Cash Purchase"
              value={stats.todayCashPurchase}
            />
            <PurchaseStatCard
              title="Monthly Cash Purchase"
              value={stats.monthlyCashPurchase}
            />
            <PurchaseStatCard
              title="Monthly Total Purchase"
              value={stats.monthlyTotalPurchase}
            />
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Purchase Records</h3>
              <span className="text-xs text-gray-500">
                {stats.purchases?.length || 0} records
              </span>
            </div>

            <div className="overflow-x-auto max-h-[280px]">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Payment</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Due</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.purchases?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-5 text-center text-gray-500">
                        No purchase found
                      </td>
                    </tr>
                  ) : (
                    stats.purchases.map((p) => (
                      <tr key={p._id} className="border-t hover:bg-blue-50/40">
                        <td className="p-3">{p.date || "-"}</td>
                        <td className="p-3">{p.supplierName || "Cash Supplier"}</td>
                        <td className="p-3">{p.itemName}</td>
                        <td className="p-3 capitalize">{p.purchaseType}</td>
                        <td className="p-3 capitalize">{p.paymentType}</td>
                        <td className="p-3 text-right">
                          ৳ {Number(p.total || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-red-500 font-semibold">
                          ৳ {Number(p.dueAmount || 0).toFixed(2)}
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
        @keyframes floatCard {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-floatCard {
          animation: floatCard 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function PurchaseStatCard({ title, value, highlight }) {
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