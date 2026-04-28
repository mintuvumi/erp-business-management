"use client";

import { useEffect, useState } from "react";

export default function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch("/api/dashboard/stock");
        const data = await res.json();

        if (data.success) {
          setStocks(data.data.stocks || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, []);

  if (loading) {
    return <div className="bg-white border rounded-2xl p-5">Loading stock...</div>;
  }

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b">
        <h1 className="text-xl font-bold">Stock Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Stock quantity, average cost, value and low stock status
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Item</th>
              <th className="p-4 text-right">Qty</th>
              <th className="p-4 text-right">Avg Cost</th>
              <th className="p-4 text-right">Stock Value</th>
              <th className="p-4 text-right">Low Limit</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>

          <tbody>
            {stocks.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-5 text-center text-gray-500">
                  No stock found
                </td>
              </tr>
            ) : (
              stocks.map((stock) => {
                const isLow =
                  Number(stock.qty || 0) <= Number(stock.lowStockLimit || 5);

                return (
                  <tr key={stock._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-4">{stock.itemName}</td>
                    <td className="p-4 text-right">{stock.qty}</td>
                    <td className="p-4 text-right">
                      ৳ {Number(stock.avgCost || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      ৳ {Number(stock.totalValue || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">{stock.lowStockLimit || 5}</td>
                    <td
                      className={`p-4 text-right font-medium ${
                        isLow ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {isLow ? "Low Stock" : "Available"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}