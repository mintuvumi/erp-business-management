"use client";

import { useEffect, useState } from "react";
import { X, Search, CalendarDays, RefreshCcw } from "lucide-react";

export default function StockModal({ open, onClose }) {
  const [data, setData] = useState({
    stocks: [],
    lowStock: [],
  });
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchStock();
  }, [open]);

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
                placeholder="Search item statement..."
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <CalendarDays size={18} className="text-gray-400" />
              <input type="date" className="w-full outline-none text-sm" />
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
            <Card title="Today Stock PCS" value={data.todayStockPcs} />
            <Card title="Today Stock Value" value={`৳ ${Number(data.todayStockValue || 0).toFixed(2)}`} />
            <Card title="Monthly Stock PCS" value={data.monthlyStockPcs} />
            <Card title="Monthly Stock Value" value={`৳ ${Number(data.monthlyStockValue || 0).toFixed(2)}`} />
          </div>

          {data.lowStock?.length > 0 && (
            <div className="border rounded-2xl p-4 bg-red-50">
              <h3 className="font-semibold text-red-600">Low Stock Alert</h3>
              <p className="text-sm text-red-500 mt-1">
                {data.lowStock.length} item low stock আছে।
              </p>
            </div>
          )}

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-semibold">Current Stock</h3>
              <span className="text-xs text-gray-500">
                {data.stocks?.length || 0} items
              </span>
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Avg Cost</th>
                    <th className="p-3 text-right">Value</th>
                    <th className="p-3 text-right">Low Limit</th>
                  </tr>
                </thead>

                <tbody>
                  {data.stocks?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-5 text-center text-gray-500">
                        No stock found
                      </td>
                    </tr>
                  ) : (
                    data.stocks.map((s) => (
                      <tr key={s._id} className="border-t hover:bg-blue-50/40">
                        <td className="p-3">{s.itemName}</td>
                        <td className="p-3 text-right">{s.qty}</td>
                        <td className="p-3 text-right">
                          ৳ {Number(s.avgCost || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          ৳ {Number(s.totalValue || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">{s.lowStockLimit}</td>
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

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border bg-white p-3 md:p-4 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(59,130,246,0.12)] transition-all">
      <p className="text-[11px] md:text-sm text-gray-500">{title}</p>
      <h3 className="text-lg md:text-2xl font-bold mt-2">{value || 0}</h3>
    </div>
  );
}