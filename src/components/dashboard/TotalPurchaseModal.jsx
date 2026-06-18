"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  CalendarDays,
  RefreshCcw,
  Sparkles,
  Building2,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function amountOf(p) {
  return Number(p.totalAmount || p.grandTotal || p.total || p.amount || 0);
}

function paidOf(p) {
  return Number(p.paidAmount || p.paid || p.cashPaidAmount || 0);
}

function isToday(dateString) {
  const today = new Date().toISOString().slice(0, 10);
  return String(dateString || "").slice(0, 10) === today;
}

function isSameMonth(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function TotalPurchaseModal({ open, onClose }) {
  const dateInputRef = useRef(null);

  const [stats, setStats] = useState({
    totalDuePurchase: 0,
    todayDuePurchase: 0,
    monthlyDuePurchase: 0,
    todayPaidPurchase: 0,
    monthlyPaidPurchase: 0,
    monthlyTotalPurchase: 0,
    purchases: [],
  });

  const [company, setCompany] = useState(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const purchases = Array.isArray(stats.purchases) ? stats.purchases : [];

  const localSummary = useMemo(() => {
    const todayPaid = purchases
      .filter((p) => isToday(p.date))
      .reduce((sum, p) => sum + paidOf(p), 0);

    const monthlyPaid = purchases
      .filter((p) => isSameMonth(p.date))
      .reduce((sum, p) => sum + paidOf(p), 0);

    const monthlyTotal = purchases
      .filter((p) => isSameMonth(p.date))
      .reduce((sum, p) => sum + amountOf(p), 0);

    return { todayPaid, monthlyPaid, monthlyTotal };
  }, [purchases]);

  const todayPaidPurchase =
    localSummary.todayPaid > 0 ? localSummary.todayPaid : stats.todayPaidPurchase;

  const monthlyPaidPurchase =
    localSummary.monthlyPaid > 0 ? localSummary.monthlyPaid : stats.monthlyPaidPurchase;

  const monthlyTotalPurchase =
    localSummary.monthlyTotal > 0 ? localSummary.monthlyTotal : stats.monthlyTotalPurchase;

  const aiInsight = useMemo(() => {
    const due = Number(stats.totalDuePurchase || 0);
    if (due > 0) {
      return `Supplier due is ৳ ${money(due)}. Please follow up supplier payment and review purchase cash flow.`;
    }
    return `Purchase payment is controlled. This month total purchase is ৳ ${money(monthlyTotalPurchase)} and paid amount is ৳ ${money(monthlyPaidPurchase)}.`;
  }, [stats.totalDuePurchase, monthlyTotalPurchase, monthlyPaidPurchase]);

  const loadCompany = () => {
    try {
      const active =
        JSON.parse(localStorage.getItem("activeCompany") || "null") ||
        JSON.parse(localStorage.getItem("selectedCompany") || "null") ||
        JSON.parse(localStorage.getItem("user") || "{}")?.company;

      setCompany(active || null);
    } catch {
      setCompany(null);
    }
  };

  const fetchPurchaseData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (date) params.set("date", date);

      const res = await fetch(`/api/dashboard/purchase?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "x-company-id": localStorage.getItem("selectedCompanyId") || "",
        },
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (data.success) {
        setStats({
          totalDuePurchase: Number(data.data?.totalDuePurchase || 0),
          todayDuePurchase: Number(data.data?.todayDuePurchase || 0),
          monthlyDuePurchase: Number(data.data?.monthlyDuePurchase || 0),
          todayPaidPurchase: Number(data.data?.todayPaidPurchase || 0),
          monthlyPaidPurchase: Number(data.data?.monthlyPaidPurchase || 0),
          monthlyTotalPurchase: Number(data.data?.monthlyTotalPurchase || 0),
          purchases: Array.isArray(data.data?.purchases) ? data.data.purchases : [],
        });
      }
    } catch (error) {
      console.error("PURCHASE_MODAL_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCompany();
      fetchPurchaseData();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(fetchPurchaseData, 400);
    return () => clearTimeout(timer);
  }, [search, date]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/30 backdrop-blur-[3px] p-3 md:p-6 overflow-y-auto">
      <div className="relative my-4 mx-auto w-full max-w-6xl rounded-[32px] bg-white/95 border shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden animate-floatCard">
        <button
          onClick={onClose}
          className="fixed top-5 right-5 z-[1000000] w-11 h-11 rounded-full bg-white border shadow-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <X size={20} />
        </button>

        <div className="relative p-5 md:p-7 border-b">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Total Purchase Due
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Supplier due, paid purchase and monthly purchase summary
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 border text-blue-700">
            <Building2 size={16} />
            <span className="text-sm font-semibold">
              {company?.name || company?.companyName || "Selected Company"}
            </span>
          </div>
        </div>

        <div className="relative p-5 md:p-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_210px_52px] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Supplier, Phone, Item, Bill No, Purchase No..."
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <div
              onClick={() => dateInputRef.current?.showPicker?.()}
              className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm cursor-pointer"
            >
              <CalendarDays size={18} className="text-gray-400" />
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full outline-none text-sm bg-transparent cursor-pointer"
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
            <PurchaseStatCard title="Total Due Purchase" value={stats.totalDuePurchase} highlight />
            <PurchaseStatCard title="Today Due Purchase" value={stats.todayDuePurchase} />
            <PurchaseStatCard title="Monthly Due Purchase" value={stats.monthlyDuePurchase} />
            <PurchaseStatCard title="Today Paid Purchase" value={todayPaidPurchase} />
            <PurchaseStatCard title="Monthly Paid Purchase" value={monthlyPaidPurchase} />
            <PurchaseStatCard title="Monthly Total Purchase" value={monthlyTotalPurchase} />
          </div>

          <div className="rounded-3xl p-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_18px_45px_rgba(37,99,235,0.28)]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} />
              <h3 className="font-bold">AI Business Insight</h3>
            </div>
            <p className="text-sm text-blue-50 leading-6">{aiInsight}</p>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Purchase Records</h3>
              <span className="text-xs text-gray-500">{purchases.length} records</span>
            </div>

            <div className="overflow-x-auto max-h-[330px]">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Payment</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Due</th>
                  </tr>
                </thead>

                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-5 text-center text-gray-500">
                        No purchase found
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p._id} className="border-t hover:bg-blue-50/40">
                        <td className="p-3">{p.date || "-"}</td>
                        <td className="p-3">{p.supplierName || p.supplierId?.name || "Cash Supplier"}</td>
                        <td className="p-3">{p.itemName || "-"}</td>
                        <td className="p-3 capitalize">{p.purchaseType || "-"}</td>
                        <td className="p-3 capitalize">{p.paymentFrom || p.paymentType || "-"}</td>
                        <td className="p-3 text-right">৳ {money(amountOf(p))}</td>
                        <td className="p-3 text-right text-green-600 font-semibold">৳ {money(paidOf(p))}</td>
                        <td className="p-3 text-right text-red-500 font-semibold">৳ {money(p.dueAmount)}</td>
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
      <p className={`text-xs md:text-sm ${highlight ? "text-blue-50" : "text-gray-500"}`}>
        {title}
      </p>

      <h3 className="text-xl md:text-2xl font-bold mt-3">
        ৳ {money(value)}
      </h3>
    </div>
  );
}