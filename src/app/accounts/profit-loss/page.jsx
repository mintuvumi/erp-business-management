"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Printer,
  FileDown,
  Share2,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function ProfitLossPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [date, setDate] = useState("");

  const fetchProfit = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (date) params.set("date", date);

      const res = await fetch(`/api/dashboard/profit?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data || {});
      } else {
        alert(json.message || "Profit loss load failed");
      }
    } catch (error) {
      console.error(error);
      alert("Profit loss load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfit();
  }, []);

  const productWiseProfit = data.productWiseProfit || [];

  const filteredProducts = useMemo(() => {
    if (!search) return productWiseProfit;

    const q = search.toLowerCase();

    return productWiseProfit.filter((item) =>
      [item.name, item.qty, item.sales, item.cost, item.profit]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [productWiseProfit, search]);

  const netProfit = Number(data.netProfit || 0);
  const salesProfit = Number(data.salesProfit || 0);
  const totalExpense = Number(data.totalExpense || 0);

  const aiInsight = useMemo(() => {
    if (netProfit < 0) {
      return {
        title: "AI Warning",
        message:
          "ব্যবসা বর্তমানে loss অবস্থায় আছে। Expense কমানো, slow moving product check করা এবং customer due collection বাড়ানো দরকার।",
        style: "bg-red-50 text-red-700 border-red-100",
      };
    }

    if (salesProfit > 0 && totalExpense > salesProfit * 0.5) {
      return {
        title: "AI Expense Alert",
        message:
          "Expense sales profit-এর তুলনায় বেশি। Salary, conveyance, rent, supplier payment এবং office expense review করুন।",
        style: "bg-orange-50 text-orange-700 border-orange-100",
      };
    }

    if (Number(data.monthlyProfit || 0) > 0) {
      return {
        title: "AI Good Performance",
        message:
          "এই মাসে profit positive আছে। Best selling product ধরে রাখুন এবং unnecessary expense control করুন।",
        style: "bg-green-50 text-green-700 border-green-100",
      };
    }

    return {
      title: "AI Business Insight",
      message:
        "Business position stable আছে। Regular income, expense, stock এবং product-wise profit analysis করলে decision আরও ভালো হবে।",
      style: "bg-blue-50 text-blue-700 border-blue-100",
    };
  }, [data, netProfit, salesProfit, totalExpense]);

  const applyAISearch = () => {
    const text = aiSearch.toLowerCase().trim();

    if (!text) return;

    if (text.includes("today") || text.includes("আজ")) {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
      setTimeout(fetchProfit, 100);
      return;
    }

    if (text.includes("expense") || text.includes("খরচ")) {
      setSearch("expense");
      return;
    }

    if (text.includes("loss") || text.includes("লস")) {
      setSearch("-");
      return;
    }

    if (text.includes("product") || text.includes("পণ্য")) {
      setSearch("");
      return;
    }

    setSearch(aiSearch);
  };

  const printReport = () => window.print();

  const shareReport = async () => {
    const text = `Profit & Loss Report
Sales Profit: ৳ ${money(data.salesProfit)}
Total Expense: ৳ ${money(data.totalExpense)}
Net Profit: ৳ ${money(data.netProfit)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Profit & Loss Report",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Report copied");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Profit & Loss</h1>
            <p className="text-sm text-gray-500 mt-1">
              Income, expense, net profit, product profit and AI insight
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchProfit}
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
          <Card title="Sales Profit" value={data.salesProfit} />
          <Card title="Total Expense" value={data.totalExpense} danger />
          <Card title="Monthly Profit" value={data.monthlyProfit} />
          <Card title="Net Profit" value={data.netProfit} highlight />
          <Card title="Today Profit" value={data.todayProfit} />
          <Card title="Yearly Profit" value={data.yearlyProfit} />
          <Card title="Monthly Expense" value={data.monthlyExpense} danger />
          <Card title="Yearly Expense" value={data.yearlyExpense} danger />
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
          <Sparkles size={18} className="text-purple-600" />
          <h2 className="font-bold">AI Search</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_auto] gap-3">
          <input
            value={aiSearch}
            onChange={(e) => setAiSearch(e.target.value)}
            placeholder="Example: আজকের profit / expense বেশি কিনা / product profit"
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-400"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            onClick={applyAISearch}
            className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
          >
            AI Apply
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-bold">Product-wise Profit</h2>
            <p className="text-xs text-gray-500">
              Search product, sales, cost and profit
            </p>
          </div>

          <div className="relative print:hidden">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="border rounded-xl pl-9 pr-3 py-2 w-full md:w-80"
            />
          </div>
        </div>

        <div className="p-5 border-b hidden print:block">
          <h1 className="text-2xl font-bold">Profit & Loss Report</h1>
          <p className="text-sm text-gray-500">
            Generated: {new Date().toLocaleString("en-GB")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Sales</th>
                <th className="p-4 text-right">Cost</th>
                <th className="p-4 text-right">Profit</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No product profit found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const profit = Number(item.profit || 0);
                  return (
                    <tr key={item.name} className="border-t hover:bg-blue-50/40">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-right">{item.qty}</td>
                      <td className="p-4 text-right">৳ {money(item.sales)}</td>
                      <td className="p-4 text-right">৳ {money(item.cost)}</td>
                      <td
                        className={`p-4 text-right font-bold ${
                          profit >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        ৳ {money(profit)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            profit >= 0
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {profit >= 0 ? (
                            <>
                              <TrendingUp size={13} />
                              Profit
                            </>
                          ) : (
                            <>
                              <TrendingDown size={13} />
                              Loss
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan="2" className="p-4 text-right font-bold">
                  Total
                </td>
                <td className="p-4 text-right font-bold">
                  ৳ {money(total(productWiseProfit, "sales"))}
                </td>
                <td className="p-4 text-right font-bold">
                  ৳ {money(total(productWiseProfit, "cost"))}
                </td>
                <td className="p-4 text-right font-bold text-blue-600">
                  ৳ {money(total(productWiseProfit, "profit"))}
                </td>
                <td className="p-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, highlight, danger }) {
  const isLoss = Number(value || 0) < 0;

  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 ${
        highlight
          ? isLoss
            ? "bg-red-500 text-white"
            : "bg-blue-500 text-white"
          : danger || isLoss
          ? "bg-red-50 text-red-600"
          : "bg-white"
      }`}
    >
      <p className={`text-xs md:text-sm ${highlight ? "text-white/90" : "text-gray-500"}`}>
        {title}
      </p>

      <h3 className="text-xl md:text-2xl font-bold mt-3">৳ {money(value)}</h3>
    </div>
  );
}

function total(items, key) {
  return items.reduce((sum, item) => sum + Number(item[key] || 0), 0);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}