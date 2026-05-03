"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  CalendarDays,
  RefreshCcw,
  Printer,
  PackageCheck,
} from "lucide-react";

export default function StockModal({ open, onClose }) {
  const [data, setData] = useState({
    stocks: [],
    lowStock: [],
  });

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [printMode, setPrintMode] = useState("filtered");

  const fetchStock = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/dashboard/stock");
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error(error);
      alert("Stock data load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchStock();
  }, [open]);

  const filteredStocks = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (data.stocks || []).filter((s) => {
      const searchText = `
        ${s.itemName || ""}
        ${s.qty || ""}
        ${s.avgCost || ""}
        ${s.totalValue || ""}
        ${s.lowStockLimit || ""}
      `.toLowerCase();

      const matchSearch = q ? searchText.includes(q) : true;
      const matchDate = date ? s.date === date || s.createdAt?.slice(0, 10) === date : true;

      return matchSearch && matchDate;
    });
  }, [data.stocks, search, date]);

  const printStocks = printMode === "all" ? data.stocks || [] : filteredStocks;

  const totals = useMemo(() => {
    return filteredStocks.reduce(
      (sum, item) => {
        sum.qty += Number(item.qty || 0);
        sum.value += Number(item.totalValue || 0);
        return sum;
      },
      { qty: 0, value: 0 }
    );
  }, [filteredStocks]);

  const allTotals = useMemo(() => {
    return (data.stocks || []).reduce(
      (sum, item) => {
        sum.qty += Number(item.qty || 0);
        sum.value += Number(item.totalValue || 0);
        return sum;
      },
      { qty: 0, value: 0 }
    );
  }, [data.stocks]);

  const printReport = (mode) => {
    setPrintMode(mode);

    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-3 md:p-6">
      <div className="relative w-full max-w-6xl max-h-[88vh] overflow-hidden rounded-[28px] bg-white border shadow-[0_30px_80px_rgba(15,23,42,0.25)] animate-stockFloat">
        <div className="p-4 md:p-6 border-b flex items-start justify-between">
          <div>
            <h2 className="text-lg md:text-2xl font-bold">Stock Dashboard</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Company Name • Address • Phone Number
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 overflow-y-auto max-h-[calc(88vh-90px)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_48px] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product name, qty, cost, value..."
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <CalendarDays size={18} className="text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>

            <button
              onClick={fetchStock}
              className="h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card title="Today Stock In" value={data.todayStockIn} />
            <Card title="Today Stock Out" value={data.todayStockOut} />
            <Card title="Monthly Stock In" value={data.monthlyStockIn} />
            <Card title="Monthly Stock Out" value={data.monthlyStockOut} />
            <Card title="Filtered Qty" value={totals.qty} highlight />
            <Card title="Filtered Value" value={`৳ ${money(totals.value)}`} highlight />
            <Card title="All Stock Qty" value={allTotals.qty} />
            <Card title="All Stock Value" value={`৳ ${money(allTotals.value)}`} />
          </div>

          {data.lowStock?.length > 0 && (
            <div className="border rounded-2xl p-4 bg-red-50">
              <h3 className="font-semibold text-red-600">Low Stock Alert</h3>
              <p className="text-sm text-red-500 mt-1">
                {data.lowStock.length} item low stock আছে।
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => printReport("filtered")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-blue-50 hover:text-blue-600"
            >
              <Printer size={16} />
              Print Current Result
            </button>

            <button
              onClick={() => printReport("all")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
            >
              <PackageCheck size={16} />
              Print All Products
            </button>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-semibold">Current Stock</h3>
              <span className="text-xs text-gray-500">
                {filteredStocks.length} / {data.stocks?.length || 0} items
              </span>
            </div>

            <div className="overflow-x-auto max-h-[360px]">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">SL</th>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Avg Cost</th>
                    <th className="p-3 text-right">Value</th>
                    <th className="p-3 text-right">Low Limit</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-5 text-center text-gray-500">
                        No stock found
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((s, index) => {
                      const isLow = Number(s.qty || 0) <= Number(s.lowStockLimit || 0);

                      return (
                        <tr
                          key={s._id}
                          className={`border-t hover:bg-blue-50/40 ${
                            isLow ? "bg-red-50/80 text-red-700" : ""
                          }`}
                        >
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-medium">{s.itemName}</td>
                          <td className="p-3 text-right font-semibold">{s.qty}</td>
                          <td className="p-3 text-right">৳ {money(s.avgCost)}</td>
                          <td className="p-3 text-right font-bold">
                            ৳ {money(s.totalValue)}
                          </td>
                          <td className="p-3 text-right">{s.lowStockLimit}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                isLow
                                  ? "bg-red-100 text-red-600"
                                  : "bg-green-100 text-green-600"
                              }`}
                            >
                              {isLow ? "Low Stock" : "Available"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                <tfoot className="bg-blue-50 font-bold">
                  <tr>
                    <td colSpan="2" className="p-3 text-right">
                      Total
                    </td>
                    <td className="p-3 text-right">{totals.qty}</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right">৳ {money(totals.value)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div id="stock-print-area" className="hidden print:block bg-white p-8">
          <div className="text-center border-b pb-4 mb-5">
            <h1 className="text-2xl font-bold">Stock Report</h1>
            <p className="text-sm text-gray-500">Company Name • Address • Phone Number</p>
            <p className="text-xs mt-2">
              Report Type: {printMode === "all" ? "All Products" : "Current Search Result"}
            </p>
            <p className="text-xs">
              Print Date: {new Date().toLocaleDateString()}
            </p>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border p-2 text-left">SL</th>
                <th className="border p-2 text-left">Item</th>
                <th className="border p-2 text-right">Qty</th>
                <th className="border p-2 text-right">Avg Cost</th>
                <th className="border p-2 text-right">Value</th>
                <th className="border p-2 text-right">Low Limit</th>
                <th className="border p-2 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {printStocks.map((s, index) => {
                const isLow = Number(s.qty || 0) <= Number(s.lowStockLimit || 0);

                return (
                  <tr key={s._id || index}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{s.itemName}</td>
                    <td className="border p-2 text-right">{s.qty}</td>
                    <td className="border p-2 text-right">৳ {money(s.avgCost)}</td>
                    <td className="border p-2 text-right">৳ {money(s.totalValue)}</td>
                    <td className="border p-2 text-right">{s.lowStockLimit}</td>
                    <td className="border p-2 text-center">
                      {isLow ? "Low Stock" : "Available"}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="font-bold bg-gray-100">
                <td colSpan="2" className="border p-2 text-right">
                  Total
                </td>
                <td className="border p-2 text-right">
                  {printStocks.reduce((sum, s) => sum + Number(s.qty || 0), 0)}
                </td>
                <td className="border p-2"></td>
                <td className="border p-2 text-right">
                  ৳{" "}
                  {money(
                    printStocks.reduce(
                      (sum, s) => sum + Number(s.totalValue || 0),
                      0
                    )
                  )}
                </td>
                <td colSpan="2" className="border p-2"></td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-10 flex justify-between text-xs">
            <div>
              <p className="font-bold">Prepared By</p>
              <div className="border-t w-40 mt-8"></div>
            </div>
            <div>
              <p className="font-bold">Authorized Signature</p>
              <div className="border-t w-40 mt-8"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #stock-print-area,
          #stock-print-area * {
            visibility: visible !important;
          }

          #stock-print-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <style jsx>{`
        @keyframes stockFloat {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-stockFloat {
          animation: stockFloat 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-3 md:p-4 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(59,130,246,0.12)] transition-all ${
        highlight ? "bg-blue-50 text-blue-700" : "bg-white"
      }`}
    >
      <p className="text-[11px] md:text-sm text-gray-500">{title}</p>
      <h3 className="text-lg md:text-2xl font-bold mt-2">{value || 0}</h3>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}