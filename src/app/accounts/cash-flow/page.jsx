"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Printer,
  FileDown,
  Share2,
  Sparkles,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
} from "lucide-react";

export default function CashFlowPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [filters, setFilters] = useState({
    direction: "",
    paymentFrom: "",
    receiveTo: "",
    fromDate: "",
    toDate: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();
      query.append("limit", "700");

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });

      const txRes = await fetch(`/api/accounts/transactions?${query.toString()}`);
      const txData = await txRes.json();

      if (txData.success) {
        setTransactions(txData.data || []);
      }

      const summaryRes = await fetch("/api/accounts/summary");
      const summaryData = await summaryRes.json();

      if (summaryData.success) {
        setSummary(summaryData.data || {});
      }
    } catch (error) {
      console.error(error);
      alert("Cash flow load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;

    const q = search.toLowerCase();

    return transactions.filter((item) =>
      [
        item.transactionNo,
        item.transactionType,
        item.categoryName,
        item.title,
        item.personName,
        item.bankName,
        item.note,
        item.paymentFrom,
        item.receiveTo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [transactions, search]);

  const totals = useMemo(() => {
    const cashIn = transactions
      .filter((t) => t.direction === "in" && t.receiveTo === "cash")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const cashOut = transactions
      .filter((t) => t.direction === "out" && t.paymentFrom === "cash")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const bankIn = transactions
      .filter((t) => t.direction === "in" && t.receiveTo === "bank")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const bankOut = transactions
      .filter((t) => t.direction === "out" && t.paymentFrom === "bank")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const transfer = transactions
      .filter((t) => t.direction === "transfer")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      cashIn,
      cashOut,
      bankIn,
      bankOut,
      transfer,
      netCash: cashIn - cashOut,
      netBank: bankIn - bankOut,
      netFlow: cashIn + bankIn - cashOut - bankOut,
    };
  }, [transactions]);

  const aiInsight = useMemo(() => {
    if (totals.netFlow < 0) {
      return {
        title: "AI Cash Flow Warning",
        message:
          "Cash & bank outflow inflow থেকে বেশি। Expense, supplier payment এবং loan payment review করা দরকার।",
        style: "bg-red-50 text-red-700 border-red-100",
      };
    }

    if (totals.cashOut > totals.cashIn && totals.bankIn > 0) {
      return {
        title: "AI Cash Control Alert",
        message:
          "Cash payment বেশি হচ্ছে। Cash expense কমিয়ে bank payment বা approved expense flow maintain করুন।",
        style: "bg-orange-50 text-orange-700 border-orange-100",
      };
    }

    if (totals.netFlow > 0) {
      return {
        title: "AI Healthy Flow",
        message:
          "Cash & bank flow positive আছে। Collection, sales এবং receive ভালো চলছে। নিয়মিত statement check করলে control আরও ভালো হবে।",
        style: "bg-green-50 text-green-700 border-green-100",
      };
    }

    return {
      title: "AI Flow Insight",
      message:
        "Cash & bank flow stable আছে। Daily inflow/outflow, transfer এবং bank balance monitor করলে better decision নেওয়া যাবে।",
      style: "bg-blue-50 text-blue-700 border-blue-100",
    };
  }, [totals]);

  const applyAISearch = () => {
    const text = aiSearch.toLowerCase().trim();
    if (!text) return;

    const updated = { ...filters };

    if (text.includes("cash in") || text.includes("cash receive")) {
      updated.direction = "in";
      updated.receiveTo = "cash";
    }

    if (text.includes("cash out") || text.includes("cash payment")) {
      updated.direction = "out";
      updated.paymentFrom = "cash";
    }

    if (text.includes("bank in") || text.includes("bank receive")) {
      updated.direction = "in";
      updated.receiveTo = "bank";
    }

    if (text.includes("bank out") || text.includes("bank payment")) {
      updated.direction = "out";
      updated.paymentFrom = "bank";
    }

    if (text.includes("transfer")) {
      updated.direction = "transfer";
    }

    if (text.includes("today") || text.includes("আজ")) {
      const today = new Date().toISOString().slice(0, 10);
      updated.fromDate = today;
      updated.toDate = today;
    }

    if (text.includes("this month") || text.includes("এই মাস")) {
      const now = new Date();
      updated.fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      updated.toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    }

    setFilters(updated);
    setSearch(aiSearch);

    setTimeout(fetchData, 100);
  };

  const resetFilter = () => {
    setSearch("");
    setAiSearch("");
    setFilters({
      direction: "",
      paymentFrom: "",
      receiveTo: "",
      fromDate: "",
      toDate: "",
    });
  };

  const printReport = () => window.print();

  const shareReport = async () => {
    const text = `Cash & Bank Flow
Cash In: ৳ ${money(totals.cashIn)}
Cash Out: ৳ ${money(totals.cashOut)}
Bank In: ৳ ${money(totals.bankIn)}
Bank Out: ৳ ${money(totals.bankOut)}
Net Flow: ৳ ${money(totals.netFlow)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Cash & Bank Flow",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Cash flow copied");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Cash & Bank Flow</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cash receive, cash payment, bank receive, bank payment and transfer flow
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchData}
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
          <Card title="Cash In" value={totals.cashIn} />
          <Card title="Cash Out" value={totals.cashOut} danger />
          <Card title="Bank In" value={totals.bankIn} />
          <Card title="Bank Out" value={totals.bankOut} danger />
          <Card title="Transfer" value={totals.transfer} />
          <Card title="Net Cash" value={totals.netCash} highlight />
          <Card title="Net Bank" value={totals.netBank} highlight />
          <Card title="Net Flow" value={totals.netFlow} highlight />
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
          <h2 className="font-bold">AI Search & Filter</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
          <input
            value={aiSearch}
            onChange={(e) => setAiSearch(e.target.value)}
            placeholder="Example: today cash out / this month bank receive / transfer"
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={applyAISearch}
            className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
          >
            AI Apply
          </button>

          <button
            onClick={resetFilter}
            className="border px-5 py-3 rounded-xl hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-bold">Cash & Bank Flow Statement</h2>
            <p className="text-xs text-gray-500">
              Source-wise money movement report
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
              placeholder="Search transaction..."
              className="border rounded-xl pl-9 pr-3 py-2 w-full md:w-80"
            />
          </div>
        </div>

        <div className="p-5 border-b hidden print:block">
          <h1 className="text-2xl font-bold">Cash & Bank Flow Report</h1>
          <p className="text-sm text-gray-500">
            Generated: {new Date().toLocaleString("en-GB")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Source</th>
                <th className="p-4 text-left">Person</th>
                <th className="p-4 text-right">Cash In</th>
                <th className="p-4 text-right">Cash Out</th>
                <th className="p-4 text-right">Bank In</th>
                <th className="p-4 text-right">Bank Out</th>
                <th className="p-4 text-right">Transfer</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-6 text-center text-gray-500">
                    No cash flow found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => {
                  const amount = Number(item.amount || 0);

                  return (
                    <tr key={item._id} className="border-t hover:bg-blue-50/40">
                      <td className="p-4">{formatDate(item.transactionDate)}</td>
                      <td className="p-4 capitalize">
                        {String(item.transactionType || "").replaceAll("_", " ")}
                      </td>
                      <td className="p-4">{item.categoryName || "-"}</td>
                      <td className="p-4 font-medium">{item.title || "-"}</td>
                      <td className="p-4">{sourceText(item)}</td>
                      <td className="p-4">{item.personName || "-"}</td>

                      <td className="p-4 text-right text-green-600 font-semibold">
                        {item.direction === "in" && item.receiveTo === "cash"
                          ? `৳ ${money(amount)}`
                          : "-"}
                      </td>

                      <td className="p-4 text-right text-red-500 font-semibold">
                        {item.direction === "out" && item.paymentFrom === "cash"
                          ? `৳ ${money(amount)}`
                          : "-"}
                      </td>

                      <td className="p-4 text-right text-green-600 font-semibold">
                        {item.direction === "in" && item.receiveTo === "bank"
                          ? `৳ ${money(amount)}`
                          : "-"}
                      </td>

                      <td className="p-4 text-right text-red-500 font-semibold">
                        {item.direction === "out" && item.paymentFrom === "bank"
                          ? `৳ ${money(amount)}`
                          : "-"}
                      </td>

                      <td className="p-4 text-right text-blue-600 font-semibold">
                        {item.direction === "transfer"
                          ? `৳ ${money(amount)}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan="6" className="p-4 text-right font-bold">
                  Total
                </td>
                <td className="p-4 text-right font-bold text-green-600">
                  ৳ {money(totals.cashIn)}
                </td>
                <td className="p-4 text-right font-bold text-red-500">
                  ৳ {money(totals.cashOut)}
                </td>
                <td className="p-4 text-right font-bold text-green-600">
                  ৳ {money(totals.bankIn)}
                </td>
                <td className="p-4 text-right font-bold text-red-500">
                  ৳ {money(totals.bankOut)}
                </td>
                <td className="p-4 text-right font-bold text-blue-600">
                  ৳ {money(totals.transfer)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
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

function sourceText(item) {
  if (item.direction === "in") {
    return item.receiveTo === "bank"
      ? `Receive to Bank${item.bankName ? ` - ${item.bankName}` : ""}`
      : "Receive to Cash";
  }

  if (item.direction === "out") {
    return item.paymentFrom === "bank"
      ? `Payment from Bank${item.bankName ? ` - ${item.bankName}` : ""}`
      : "Payment from Cash";
  }

  return item.bankName || "Transfer";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB");
}

function money(value) {
  return Number(value || 0).toFixed(2);
}