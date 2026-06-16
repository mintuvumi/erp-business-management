"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { RefreshCcw, Printer, Download, Share2 } from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

const Financial = () => {
  const [isClient, setIsClient] = useState(false);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/financial-position", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Financial position load failed");
      }

      setData(json.data || {});
    } catch (error) {
      console.error(error);
      alert(error.message || "Financial position load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) fetchData();
  }, [isClient]);

  if (!isClient) return null;

  const totalAsset = Number(data.totalAsset || 0);
  const totalLiability = Number(data.totalLiability || 0);
  const netFinancialPosition = Number(data.netFinancialPosition || 0);

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">
      <div className="bg-white rounded-[28px] border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Financial Position
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {data.companyName || "Company Name"} •{" "}
              {data.companyAddress || "Company Address"} •{" "}
              {data.companyPhone || "Phone Number"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
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

        <div className="p-6 space-y-5">
          <div
            className={`rounded-[28px] p-5 border ${
              netFinancialPosition >= 0
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : "bg-red-50 text-red-700 border-red-100"
            }`}
          >
            <h2 className="text-lg font-bold">
              {data.message ||
                "Assets থেকে liabilities বাদ দিয়ে company position হিসাব করা হয়েছে।"}
            </h2>

            <p className="text-sm mt-2">
              Account Receivable + Stock + Cash + Bank = Total Asset. Supplier
              Payable + Loan = Total Liability.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="Account Receivable" value={data.totalAccountReceivable} />
            <Card title="Stock Value" value={data.totalStockValue} />
            <Card title="Cash In Hand" value={data.cashInHand} />
            <Card title="Bank Balance" value={data.totalBankBalance} />

            <Card title="Total Asset" value={totalAsset} highlight />
            <Card title="Account Payable" value={data.totalAccountPayable} danger />
            <Card title="Bank + Personal Loan" value={data.totalLoan} danger />
            <Card title="Total Liability" value={totalLiability} danger />
          </div>

          <div
            className={`rounded-[30px] p-7 text-center ${
              netFinancialPosition >= 0
                ? "bg-blue-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <p className="text-sm opacity-90">Net Financial Position</p>

            <h2 className="text-4xl font-bold mt-3">
              ৳ {money(netFinancialPosition)}
            </h2>

            <p className="text-sm opacity-90 mt-2">
              {netFinancialPosition >= 0 ? "Positive Position" : "Negative Position"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function Card({ title, value, highlight, danger }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        highlight
          ? "bg-blue-500 text-white"
          : danger
          ? "bg-red-50 text-red-600"
          : "bg-white"
      }`}
    >
      <p className={`text-sm ${highlight ? "text-blue-50" : "text-gray-500"}`}>
        {title}
      </p>

      <h2 className="font-bold text-lg mt-3">৳ {money(value)}</h2>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Financial), {
  ssr: false,
});