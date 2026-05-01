"use client";

import { useEffect, useState } from "react";

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/sales/report")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      });
  }, []);

  if (!data) return <p className="p-6">Loading report...</p>;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold">Sales Profit Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Sales" value={`৳ ${money(data.totalSales)}`} />
        <Card title="Total Cost" value={`৳ ${money(data.totalCost)}`} />
        <Card title="Total Profit" value={`৳ ${money(data.totalProfit)}`} highlight />
        <Card title="Profit %" value={`${money(data.profitPercent)}%`} />
      </div>
    </div>
  );
}

function Card({ title, value, highlight }) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${highlight ? "bg-blue-600 text-white" : "bg-white"}`}>
      <p className={`text-sm ${highlight ? "text-blue-50" : "text-gray-500"}`}>{title}</p>
      <h2 className="text-xl font-bold mt-2">{value}</h2>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}