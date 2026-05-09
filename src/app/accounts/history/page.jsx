"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Printer,
  FileDown,
  Share2,
  Sparkles,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
} from "lucide-react";

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [aiSearch, setAiSearch] = useState("");

  const [filters, setFilters] = useState({
    direction: "",
    transactionType: "",
    categoryName: "",
    paymentFrom: "",
    receiveTo: "",
    personType: "",
    fromDate: "",
    toDate: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();
      query.append("limit", "1000");

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });

      if (search) query.append("search", search);

      const txRes = await fetch(`/api/accounts/transactions?${query.toString()}`);
      const txData = await txRes.json();

      if (txData.success) {
        setTransactions(txData.data || []);
      }

      const catRes = await fetch("/api/accounts/categories");
      const catData = await catRes.json();

      if (catData.success) {
        setCategories(catData.data || []);
      }
    } catch (error) {
      console.error(error);
      alert("Transaction history load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totals = useMemo(() => {
    const totalIn = transactions
      .filter((t) => t.direction === "in")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalOut = transactions
      .filter((t) => t.direction === "out")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalTransfer = transactions
      .filter((t) => t.direction === "transfer")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      totalIn,
      totalOut,
      totalTransfer,
      net: totalIn - totalOut,
      count: transactions.length,
    };
  }, [transactions]);

  const aiInsight = useMemo(() => {
    if (totals.totalOut > totals.totalIn) {
      return {
        title: "AI Spending Alert",
        message:
          "Payment/expense receive থেকে বেশি। Salary, supplier payment, loan payment এবং office expense review করা দরকার।",
        style: "bg-red-50 text-red-700 border-red-100",
      };
    }

    if (totals.totalIn > totals.totalOut) {
      return {
        title: "AI Positive Transaction Flow",
        message:
          "Receive payment-এর তুলনায় বেশি আছে। Collection এবং sales flow ভালো চলছে। Regular statement review করলে control আরও ভালো হবে।",
        style: "bg-green-50 text-green-700 border-green-100",
      };
    }

    return {
      title: "AI Transaction Insight",
      message:
        "Transaction flow balanced আছে। Category-wise review করলে cash, bank, salary এবং loan control আরও professional হবে।",
      style: "bg-blue-50 text-blue-700 border-blue-100",
    };
  }, [totals]);

  const applyAISearch = () => {
    const text = aiSearch.toLowerCase().trim();
    if (!text) return;

    const updated = { ...filters };

    if (text.includes("salary")) updated.transactionType = "salary_payment";
    if (text.includes("expense") || text.includes("খরচ")) updated.transactionType = "expense";
    if (text.includes("collection")) updated.transactionType = "customer_collection";
    if (text.includes("supplier")) updated.transactionType = "supplier_payment";
    if (text.includes("loan receive")) updated.transactionType = "loan_receive";
    if (text.includes("loan payment") || text.includes("loan paid")) updated.transactionType = "loan_payment";
    if (text.includes("cash sale")) updated.transactionType = "cash_sale";
    if (text.includes("transfer")) updated.direction = "transfer";

    if (text.includes("receive") || text.includes("in")) updated.direction = "in";
    if (text.includes("payment") || text.includes("out")) updated.direction = "out";

    if (text.includes("cash")) {
      updated.paymentFrom = "cash";
      updated.receiveTo = "cash";
    }

    if (text.includes("bank")) {
      updated.paymentFrom = "bank";
      updated.receiveTo = "bank";
    }

    if (text.includes("customer")) updated.personType = "customer";
    if (text.includes("supplier")) updated.personType = "supplier";
    if (text.includes("employee")) updated.personType = "employee";

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
      transactionType: "",
      categoryName: "",
      paymentFrom: "",
      receiveTo: "",
      personType: "",
      fromDate: "",
      toDate: "",
    });
  };

  const printReport = () => window.print();

  const shareReport = async () => {
    const text = `Transaction History
Total Receive: ৳ ${money(totals.totalIn)}
Total Payment: ৳ ${money(totals.totalOut)}
Transfer: ৳ ${money(totals.totalTransfer)}
Net: ৳ ${money(totals.net)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Transaction History",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Transaction history copied");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center">
                <History size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">Transaction History</h1>
                <p className="text-sm text-gray-500 mt-1">
                  All receive, payment, transfer, loan, salary and expense history
                </p>
              </div>
            </div>
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

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          <Card title="Total Receive" value={totals.totalIn} />
          <Card title="Total Payment" value={totals.totalOut} danger />
          <Card title="Transfer" value={totals.totalTransfer} />
          <Card title="Net Balance" value={totals.net} highlight />
          <Card title="Total Entry" value={totals.count} noCurrency />
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
            placeholder="Example: today salary / this month bank payment / customer collection"
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

      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction..."
              className="border rounded-xl p-3 pl-9 w-full outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <select
            value={filters.direction}
            onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
            className="border rounded-xl p-3"
          >
            <option value="">All Direction</option>
            <option value="in">Receive</option>
            <option value="out">Payment</option>
            <option value="transfer">Transfer</option>
          </select>

          <select
            value={filters.transactionType}
            onChange={(e) =>
              setFilters({ ...filters, transactionType: e.target.value })
            }
            className="border rounded-xl p-3"
          >
            <option value="">All Type</option>
            <option value="income">Receive Money</option>
            <option value="expense">Expense</option>
            <option value="salary_payment">Salary Payment</option>
            <option value="customer_collection">Customer Collection</option>
            <option value="supplier_payment">Supplier Payment</option>
            <option value="loan_receive">Loan Receive</option>
            <option value="loan_payment">Loan Payment</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash_sale">Cash Sale</option>
            <option value="owner_capital">Owner Capital</option>
          </select>

          <input
            list="historyCategoryList"
            value={filters.categoryName}
            onChange={(e) =>
              setFilters({ ...filters, categoryName: e.target.value })
            }
            placeholder="Category"
            className="border rounded-xl p-3"
          />

          <datalist id="historyCategoryList">
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name} />
            ))}
          </datalist>

          <select
            value={filters.paymentFrom}
            onChange={(e) =>
              setFilters({ ...filters, paymentFrom: e.target.value })
            }
            className="border rounded-xl p-3"
          >
            <option value="">Payment From</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>

          <select
            value={filters.receiveTo}
            onChange={(e) => setFilters({ ...filters, receiveTo: e.target.value })}
            className="border rounded-xl p-3"
          >
            <option value="">Receive To</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>

          <select
            value={filters.personType}
            onChange={(e) => setFilters({ ...filters, personType: e.target.value })}
            className="border rounded-xl p-3"
          >
            <option value="">All Person</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="employee">Employee</option>
            <option value="lender">Lender</option>
            <option value="owner">Owner</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            className="border rounded-xl p-3"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            className="border rounded-xl p-3"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700"
          >
            Apply Filter
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
        <div className="p-5 border-b">
          <h2 className="font-bold">Company Transaction History</h2>
          <p className="text-xs text-gray-500">
            Generated: {new Date().toLocaleString("en-GB")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">No</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Source</th>
                <th className="p-4 text-left">Person</th>
                <th className="p-4 text-right">Receive</th>
                <th className="p-4 text-right">Payment</th>
                <th className="p-4 text-right">Transfer</th>
                <th className="p-4 text-left">Note</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-6 text-center text-gray-500">
                    No transaction found
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-4">{formatDate(item.transactionDate)}</td>
                    <td className="p-4">{item.transactionNo || "-"}</td>
                    <td className="p-4 capitalize">
                      {String(item.transactionType || "").replaceAll("_", " ")}
                    </td>
                    <td className="p-4">{item.categoryName || "-"}</td>
                    <td className="p-4 font-medium">{item.title || "-"}</td>
                    <td className="p-4">{sourceText(item)}</td>
                    <td className="p-4">{item.personName || "-"}</td>

                    <td className="p-4 text-right text-green-600 font-semibold">
                      {item.direction === "in" ? `৳ ${money(item.amount)}` : "-"}
                    </td>

                    <td className="p-4 text-right text-red-500 font-semibold">
                      {item.direction === "out" ? `৳ ${money(item.amount)}` : "-"}
                    </td>

                    <td className="p-4 text-right text-blue-600 font-semibold">
                      {item.direction === "transfer"
                        ? `৳ ${money(item.amount)}`
                        : "-"}
                    </td>

                    <td className="p-4">{item.note || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan="7" className="p-4 text-right font-bold">
                  Total
                </td>

                <td className="p-4 text-right font-bold text-green-600">
                  ৳ {money(totals.totalIn)}
                </td>

                <td className="p-4 text-right font-bold text-red-500">
                  ৳ {money(totals.totalOut)}
                </td>

                <td className="p-4 text-right font-bold text-blue-600">
                  ৳ {money(totals.totalTransfer)}
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

function Card({ title, value, highlight, danger, noCurrency }) {
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

      <h3 className="text-xl md:text-2xl font-bold mt-3">
        {noCurrency ? Number(value || 0) : `৳ ${money(value)}`}
      </h3>
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