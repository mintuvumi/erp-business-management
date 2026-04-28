"use client";

import { useState } from "react";

export default function CashModule({ company, data }) {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  // 🔥 TRANSACTIONS (future API)
  const transactions = [
    { type: "income", label: "Cash Sales", amount: 20000, date: "2026-04-21" },
    { type: "income", label: "Due Collection", amount: 5000, date: "2026-04-21" },
    { type: "expense", label: "Office Rent", amount: 8000, date: "2026-04-21" },
  ];

  const filtered = transactions.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="border-b pb-3">
        <h2 className="font-bold text-lg">{company.name}</h2>
        <p className="text-sm text-gray-500">{company.address}</p>
        <p className="text-sm text-gray-500">{company.phone}</p>
      </div>

      {/* SEARCH + DATE */}
      <div className="flex gap-2">
        <input
          placeholder="Search transaction..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-2 flex-wrap">
        <button className="border px-3 py-1 rounded">Add Income</button>
        <button className="border px-3 py-1 rounded">Add Expense</button>
        <button className="border px-3 py-1 rounded">Payment</button>
        <button className="border px-3 py-1 rounded">PDF</button>
        <button className="border px-3 py-1 rounded">Print</button>
        <button className="border px-3 py-1 rounded">Download</button>
        <button className="border px-3 py-1 rounded">Share</button>
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {filtered.map((t, i) => (
          <div key={i} className="border p-3 rounded flex justify-between">
            <span>{t.label}</span>
            <span className={t.type === "income" ? "text-green-600" : "text-red-600"}>
              ৳ {t.amount}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}