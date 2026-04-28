"use client";

import { useState, useMemo } from "react";

export default function StockPanel({ company, summary }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");

  // 🔥 MOCK DATA (API READY)
  const products = [
    { name: "Rice", in: 100, out: 40, price: 50, date: "2026-04-20" },
    { name: "Sugar", in: 200, out: 70, price: 80, date: "2026-04-21" },
    { name: "Oil", in: 150, out: 60, price: 180, date: "2026-04-21" },
  ];

  // 🔍 FILTER SYSTEM
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(query.toLowerCase());
      const matchDate = date ? p.date === date : true;
      return matchName && matchDate;
    });
  }, [query, date]);

  // 📊 TOTAL CALCULATION (FILTERED RESULT BASED)
  const totals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    filtered.forEach((p) => {
      const present = p.in - p.out;
      const value = present * p.price;

      totalIn += p.in;
      totalOut += p.out;
      totalValue += value;
    });

    return {
      totalIn,
      totalOut,
      present: totalIn - totalOut,
      value: totalValue,
    };
  }, [filtered]);

  return (
    <div className="p-5 space-y-5">

      {/* 🏢 COMPANY HEADER */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border">
        <h2 className="text-lg font-bold">{company.name}</h2>
        <p className="text-sm text-gray-500">{company.address}</p>
        <p className="text-sm text-gray-500">{company.phone}</p>
      </div>

      {/* 📊 SUMMARY (FIRST VIEW) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border bg-white shadow-sm">
          <p className="text-xs text-gray-500">Today Stock In</p>
          <h2 className="text-lg font-semibold">{summary.stockIn} pcs</h2>
        </div>

        <div className="p-3 rounded-xl border bg-white shadow-sm">
          <p className="text-xs text-gray-500">Today Stock Out</p>
          <h2 className="text-lg font-semibold">{summary.stockOut} pcs</h2>
        </div>

        <div className="p-3 rounded-xl border bg-blue-50">
          <p className="text-xs text-gray-600">Present Stock</p>
          <h2 className="text-xl font-bold">{summary.present} pcs</h2>
        </div>

        <div className="p-3 rounded-xl border bg-green-50">
          <p className="text-xs text-gray-600">Stock Value</p>
          <h2 className="text-xl font-bold">
            ৳ {summary.value.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* 🔍 SEARCH + DATE */}
      <div className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product..."
          className="border px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />
      </div>

      {/* 📊 FILTER RESULT SUMMARY */}
      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border">
        <div>
          <p className="text-xs text-gray-500">Filtered Stock In</p>
          <h2 className="font-semibold">{totals.totalIn}</h2>
        </div>

        <div>
          <p className="text-xs text-gray-500">Filtered Stock Out</p>
          <h2 className="font-semibold">{totals.totalOut}</h2>
        </div>

        <div>
          <p className="text-xs text-gray-500">Filtered Present</p>
          <h2 className="font-semibold">{totals.present}</h2>
        </div>

        <div>
          <p className="text-xs text-gray-500">Filtered Value</p>
          <h2 className="font-semibold">৳ {totals.value}</h2>
        </div>
      </div>

      {/* 📦 PRODUCT LIST */}
      <div className="space-y-3">
        {filtered.map((p, i) => {
          const present = p.in - p.out;
          const value = present * p.price;

          return (
            <div
              key={i}
              className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <span className="text-xs text-gray-400">{p.date}</span>
              </div>

              <div className="text-sm text-gray-600 mt-1">
                In: {p.in} | Out: {p.out}
              </div>

              <div className="mt-1 font-bold">
                {present} pcs | ৳ {value}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                <button className="px-2 py-1 border rounded hover:bg-gray-100">Edit</button>
                <button className="px-2 py-1 border rounded hover:bg-gray-100">Delete</button>
                <button className="px-2 py-1 border rounded hover:bg-gray-100">PDF</button>
                <button className="px-2 py-1 border rounded hover:bg-gray-100">Print</button>
                <button className="px-2 py-1 border rounded hover:bg-gray-100">Download</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📜 FOOTER RULES */}
      <div className="text-xs text-gray-400 border-t pt-3">
        1. Auto stock calculation <br />
        2. Live update ready (API) <br />
        3. Date + search filter supported <br />
        4. ERP professional reporting system
      </div>

    </div>
  );
}