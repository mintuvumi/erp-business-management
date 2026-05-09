"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Printer,
  FileDown,
  Share2,
  Sparkles,
  Scale,
} from "lucide-react";

export default function BalanceSheetPage() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/accounts/summary");
      const data = await res.json();

      if (data.success) {
        setSummary(data.data || {});
      } else {
        alert(data.message || "Balance sheet load failed");
      }
    } catch (error) {
      console.error(error);
      alert("Balance sheet load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const assets = [
    { name: "Cash In Hand", amount: summary.cashInHand },
    { name: "Bank Balance", amount: summary.bankBalance },
    { name: "Account Receivable", amount: summary.accountReceivable },
    { name: "Stock Value", amount: summary.stockValue },
  ];

  const liabilities = [
    { name: "Account Payable", amount: summary.accountPayable },
    { name: "Total Loan", amount: summary.totalLoan },
  ];

  const equity = [
    { name: "Owner Capital", amount: summary.ownerCapital },
    { name: "Net Position", amount: summary.netPosition },
  ];

  const filteredAssets = filterRows(assets, search);
  const filteredLiabilities = filterRows(liabilities, search);
  const filteredEquity = filterRows(equity, search);

  const totalAsset = Number(summary.totalAsset || 0);
  const totalLiability = Number(summary.totalLiability || 0);
  const ownerCapital = Number(summary.ownerCapital || 0);
  const netPosition = Number(summary.netPosition || 0);

  const aiInsight = useMemo(() => {
    if (netPosition < 0) {
      return {
        title: "AI Warning",
        message:
          "Business net position negative আছে। Loan, payable এবং expense control করা দরকার। Cash flow ও due collection দ্রুত review করুন।",
        style: "bg-red-50 text-red-700 border-red-100",
      };
    }

    if (totalLiability > totalAsset * 0.6) {
      return {
        title: "AI Liability Alert",
        message:
          "Liability asset-এর তুলনায় বেশি। Loan payment plan, supplier payable এবং bank/cash flow monitor করা দরকার।",
        style: "bg-orange-50 text-orange-700 border-orange-100",
      };
    }

    if (totalAsset > totalLiability) {
      return {
        title: "AI Healthy Position",
        message:
          "Asset liability থেকে বেশি আছে। Business position ভালো। Receivable collection এবং stock management ঠিক রাখলে আরো strong হবে।",
        style: "bg-green-50 text-green-700 border-green-100",
      };
    }

    return {
      title: "AI Balance Insight",
      message:
        "Balance sheet stable আছে। নিয়মিত cash, bank, stock, receivable এবং payable check করলে decision আরও ভালো হবে।",
      style: "bg-blue-50 text-blue-700 border-blue-100",
    };
  }, [totalAsset, totalLiability, netPosition]);

  const printReport = () => window.print();

  const shareReport = async () => {
    const text = `Balance Sheet
Total Asset: ৳ ${money(totalAsset)}
Total Liability: ৳ ${money(totalLiability)}
Owner Capital: ৳ ${money(ownerCapital)}
Net Position: ৳ ${money(netPosition)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Balance Sheet",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Balance sheet copied");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Assets, liabilities, owner capital and net position
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchSummary}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={printReport}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={printReport}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <FileDown size={16} />
              PDF
            </button>

            <button
              onClick={shareReport}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Card title="Total Asset" value={summary.totalAsset} highlight />
          <Card title="Total Liability" value={summary.totalLiability} danger />
          <Card title="Owner Capital" value={summary.ownerCapital} />
          <Card title="Net Position" value={summary.netPosition} highlight />
        </div>
      </div>

      <div className={`rounded-[28px] p-5 border shadow-sm ${aiInsight.style}`}>
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h2 className="font-bold">{aiInsight.title}</h2>
        </div>

        <p className="text-sm mt-2">{aiInsight.message}</p>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} />
          <h2 className="font-bold">Search Balance Sheet</h2>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets, liabilities, capital..."
            className="border rounded-xl pl-9 pr-3 py-3 w-full outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center">
            <Scale size={20} />
          </div>

          <div>
            <h2 className="font-bold">Company Balance Sheet</h2>
            <p className="text-xs text-gray-500">
              Generated: {new Date().toLocaleString("en-GB")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">
          <StatementBox
            title="Assets"
            rows={filteredAssets}
            totalTitle="Total Assets"
            total={totalAsset}
            positive
          />

          <StatementBox
            title="Liabilities"
            rows={filteredLiabilities}
            totalTitle="Total Liabilities"
            total={totalLiability}
            danger
          />
        </div>

        <div className="p-5 pt-0">
          <StatementBox
            title="Owner Equity / Net Worth"
            rows={filteredEquity}
            totalTitle="Net Position"
            total={netPosition}
            highlight
          />
        </div>

        <div className="p-5 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryItem title="Assets" value={totalAsset} />
            <SummaryItem title="Liabilities" value={totalLiability} danger />
            <SummaryItem title="Net Position" value={netPosition} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatementBox({ title, rows, totalTitle, total, danger, highlight }) {
  return (
    <div className="border rounded-[24px] overflow-hidden bg-white">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-bold">{title}</h3>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="2" className="p-5 text-center text-gray-500">
                No data found
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.name} className="border-b last:border-b-0">
                <td className="p-4 text-gray-600">{row.name}</td>
                <td
                  className={`p-4 text-right font-semibold ${
                    danger
                      ? "text-red-500"
                      : highlight
                      ? "text-blue-600"
                      : "text-gray-900"
                  }`}
                >
                  ৳ {money(row.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>

        <tfoot className="bg-gray-50 border-t">
          <tr>
            <td className="p-4 font-bold">{totalTitle}</td>
            <td
              className={`p-4 text-right font-bold ${
                danger
                  ? "text-red-500"
                  : highlight
                  ? "text-blue-600"
                  : "text-gray-900"
              }`}
            >
              ৳ {money(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SummaryItem({ title, value, danger, highlight }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-xl font-bold mt-2 ${
          danger ? "text-red-500" : highlight ? "text-blue-600" : "text-gray-900"
        }`}
      >
        ৳ {money(value)}
      </h3>
    </div>
  );
}

function Card({ title, value, highlight, danger }) {
  const isNegative = Number(value || 0) < 0;

  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 ${
        danger || isNegative
          ? "bg-red-50 text-red-600"
          : highlight
          ? "bg-blue-500 text-white"
          : "bg-white"
      }`}
    >
      <p
        className={`text-xs md:text-sm ${
          highlight && !danger ? "text-white/90" : "text-gray-500"
        }`}
      >
        {title}
      </p>

      <h3 className="text-xl md:text-2xl font-bold mt-3">৳ {money(value)}</h3>
    </div>
  );
}

function filterRows(rows, search) {
  if (!search) return rows;

  const q = search.toLowerCase();

  return rows.filter((row) =>
    [row.name, row.amount].join(" ").toLowerCase().includes(q)
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}