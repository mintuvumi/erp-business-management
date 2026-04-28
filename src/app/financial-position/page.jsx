"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, Printer, Download, Share2 } from "lucide-react";

export default function FinancialPositionPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financial-position");
      const json = await res.json();

      if (json.success) setData(json.data);
    } catch (error) {
      console.error(error);
      alert("Financial position load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white/95 backdrop-blur-xl border rounded-[34px] shadow-[0_30px_80px_rgba(15,23,42,0.16)] overflow-hidden animate-float">
        <div className="p-6 md:p-8 border-b flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Financial Position
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Company Name • Company Address • Phone Number
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={fetchData} className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50">
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button onClick={() => window.print()} className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50">
              <Printer size={16} />
              Print
            </button>

            <button className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50">
              <Download size={16} />
              PDF
            </button>

            <button className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50">
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          <div
            className={`rounded-[28px] p-5 border ${
              Number(data.netFinancialPosition || 0) >= 0
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : "bg-red-50 text-red-700 border-red-100"
            }`}
          >
            <h2 className="text-lg font-bold">{data.message}</h2>
            <p className="text-sm mt-2">
              Assets থেকে liabilities বাদ দিয়ে company position হিসাব করা হয়েছে।
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card title="Account Receivable" value={data.totalAccountReceivable} />
            <Card title="Stock Value" value={data.totalStockValue} />
            <Card title="Cash In Hand" value={data.cashInHand} />
            <Card title="Bank Balance" value={data.totalBankBalance} />
            <Card title="Total Asset" value={data.totalAsset} highlight />
            <Card title="Account Payable" value={data.totalAccountPayable} danger />
            <Card title="Bank + Personal Loan" value={data.totalLoan} danger />
            <Card title="Total Liability" value={data.totalLiability} danger />
          </div>

          <div
            className={`rounded-[30px] p-6 text-center ${
              Number(data.netFinancialPosition || 0) >= 0
                ? "bg-blue-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <p className="text-sm opacity-90">Net Financial Position</p>
            <h2 className="text-4xl font-bold mt-3">
              ৳ {money(data.netFinancialPosition)}
            </h2>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-float {
          animation: float 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, highlight, danger }) {
  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 ${
        highlight
          ? "bg-blue-500 text-white"
          : danger
          ? "bg-red-50 text-red-600"
          : "bg-white"
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

function money(value) {
  return Number(value || 0).toFixed(2);
}