"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Printer,
  FileDown,
  Share2,
  Filter,
  Sparkles,
} from "lucide-react";

export default function AccountsStatementPage() {
  const [transactions, setTransactions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);

  const [aiFilter, setAiFilter] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    direction: "",
    transactionType: "",
    categoryName: "",
    paymentFrom: "",
    receiveTo: "",
    fromDate: "",
    toDate: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });

      query.append("limit", "500");

      const transactionRes = await fetch(
        `/api/accounts/transactions?${query.toString()}`
      );

      const transactionData = await transactionRes.json();

      if (transactionData.success) {
        setTransactions(transactionData.data || []);
      }

      const categoryRes = await fetch("/api/accounts/categories");
      const categoryData = await categoryRes.json();

      if (categoryData.success) {
        setCategories(categoryData.data || []);
      }

      const summaryRes = await fetch("/api/accounts/summary");
      const summaryData = await summaryRes.json();

      if (summaryData.success) {
        setBanks(summaryData.data?.banks || []);
      }
    } catch (error) {
      console.error(error);
      alert("Statement load failed");
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
    };
  }, [transactions]);

  const resetFilter = () => {
    setFilters({
      search: "",
      direction: "",
      transactionType: "",
      categoryName: "",
      paymentFrom: "",
      receiveTo: "",
      fromDate: "",
      toDate: "",
    });

    setAiFilter("");
  };

  const printStatement = () => {
    window.print();
  };

  const shareStatement = async () => {
    const text = `Accounts Statement
Total In: ৳ ${money(totals.totalIn)}
Total Out: ৳ ${money(totals.totalOut)}
Net: ৳ ${money(totals.net)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Accounts Statement",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Statement copied");
    }
  };

  const applyAIFilter = () => {
    const text = aiFilter.toLowerCase().trim();

    if (!text) return;

    const updated = { ...filters };

    if (text.includes("salary")) {
      updated.transactionType = "salary_payment";
    }

    if (text.includes("expense")) {
      updated.transactionType = "expense";
    }

    if (text.includes("collection")) {
      updated.transactionType = "customer_collection";
    }

    if (text.includes("supplier")) {
      updated.transactionType = "supplier_payment";
    }

    if (text.includes("loan")) {
      updated.transactionType = "loan_payment";
    }

    if (text.includes("receive")) {
      updated.direction = "in";
    }

    if (text.includes("payment")) {
      updated.direction = "out";
    }

    if (text.includes("bank")) {
      updated.paymentFrom = "bank";
    }

    if (text.includes("cash")) {
      updated.paymentFrom = "cash";
    }

    if (text.includes("today")) {
      const today = new Date().toISOString().slice(0, 10);

      updated.fromDate = today;
      updated.toDate = today;
    }

    if (text.includes("this month")) {
      const now = new Date();

      const firstDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
        .toISOString()
        .slice(0, 10);

      const lastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      )
        .toISOString()
        .slice(0, 10);

      updated.fromDate = firstDay;
      updated.toDate = lastDay;
    }

    setFilters(updated);

    setTimeout(() => {
      fetchData();
    }, 100);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Accounts Statement
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Cash, bank, receive, payment, loan,
              salary and transfer statement
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
              onClick={printStatement}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={printStatement}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <FileDown size={16} />
              PDF
            </button>

            <button
              onClick={shareStatement}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Card title="Total Receive" value={totals.totalIn} />

          <Card
            title="Total Payment"
            value={totals.totalOut}
            danger
          />

          <Card
            title="Total Transfer"
            value={totals.totalTransfer}
          />

          <Card
            title="Net Balance"
            value={totals.net}
            highlight
          />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles
              size={18}
              className="text-purple-600"
            />

            <h3 className="font-semibold text-purple-700">
              AI Statement Filter
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={aiFilter}
              onChange={(e) =>
                setAiFilter(e.target.value)
              }
              placeholder="Example: salary statement / today expense / customer collection"
              className="flex-1 border rounded-xl p-3"
            />

            <button
              onClick={applyAIFilter}
              className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
            >
              AI Filter
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} />
          <h2 className="font-bold">
            Filter Statement
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
              placeholder="Search auto suggestion..."
              className="border rounded-xl p-3 pl-9 w-full"
            />
          </div>

          <select
            value={filters.direction}
            onChange={(e) =>
              setFilters({
                ...filters,
                direction: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="">
              All Direction
            </option>

            <option value="in">
              Receive
            </option>

            <option value="out">
              Payment
            </option>

            <option value="transfer">
              Transfer
            </option>
          </select>

          <select
            value={filters.transactionType}
            onChange={(e) =>
              setFilters({
                ...filters,
                transactionType: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="">
              All Type
            </option>

            <option value="income">
              Receive Money
            </option>

            <option value="expense">
              Expense
            </option>

            <option value="salary_payment">
              Salary Payment
            </option>

            <option value="customer_collection">
              Customer Collection
            </option>

            <option value="supplier_payment">
              Supplier Payment
            </option>

            <option value="loan_receive">
              Loan Receive
            </option>

            <option value="loan_payment">
              Loan Payment
            </option>

            <option value="bank_transfer">
              Bank Transfer
            </option>

            <option value="cash_sale">
              Cash Sale
            </option>

            <option value="owner_capital">
              Owner Capital
            </option>
          </select>

          <input
            list="statementCategoryList"
            value={filters.categoryName}
            onChange={(e) =>
              setFilters({
                ...filters,
                categoryName: e.target.value,
              })
            }
            placeholder="Category"
            className="border rounded-xl p-3"
          />

          <datalist id="statementCategoryList">
            {categories.map((cat) => (
              <option
                key={cat._id}
                value={cat.name}
              />
            ))}
          </datalist>

          <select
            value={filters.paymentFrom}
            onChange={(e) =>
              setFilters({
                ...filters,
                paymentFrom: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="">
              Payment From
            </option>

            <option value="cash">
              Cash
            </option>

            <option value="bank">
              Bank
            </option>
          </select>

          <select
            value={filters.receiveTo}
            onChange={(e) =>
              setFilters({
                ...filters,
                receiveTo: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="">
              Receive To
            </option>

            <option value="cash">
              Cash
            </option>

            <option value="bank">
              Bank
            </option>
          </select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                fromDate: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                toDate: e.target.value,
              })
            }
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
          <h2 className="font-bold">
            Company Accounts Statement
          </h2>

          <p className="text-xs text-gray-500">
            Generated:{" "}
            {new Date().toLocaleString("en-GB")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  No
                </th>

                <th className="p-4 text-left">
                  Type
                </th>

                <th className="p-4 text-left">
                  Category
                </th>

                <th className="p-4 text-left">
                  Title
                </th>

                <th className="p-4 text-left">
                  Source
                </th>

                <th className="p-4 text-left">
                  Person
                </th>

                <th className="p-4 text-right">
                  Receive
                </th>

                <th className="p-4 text-right">
                  Payment
                </th>

                <th className="p-4 text-right">
                  Transfer
                </th>

                <th className="p-4 text-left">
                  Note
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="p-6 text-center text-gray-500"
                  >
                    No transaction found
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t hover:bg-blue-50/40"
                  >
                    <td className="p-4">
                      {formatDate(
                        item.transactionDate
                      )}
                    </td>

                    <td className="p-4">
                      {item.transactionNo ||
                        "-"}
                    </td>

                    <td className="p-4 capitalize">
                      {String(
                        item.transactionType || ""
                      ).replaceAll("_", " ")}
                    </td>

                    <td className="p-4">
                      {item.categoryName || "-"}
                    </td>

                    <td className="p-4 font-medium">
                      {item.title || "-"}
                    </td>

                    <td className="p-4">
                      {sourceText(item)}
                    </td>

                    <td className="p-4">
                      {item.personName || "-"}
                    </td>

                    <td className="p-4 text-right text-green-600 font-semibold">
                      {item.direction === "in"
                        ? `৳ ${money(item.amount)}`
                        : "-"}
                    </td>

                    <td className="p-4 text-right text-red-500 font-semibold">
                      {item.direction === "out"
                        ? `৳ ${money(item.amount)}`
                        : "-"}
                    </td>

                    <td className="p-4 text-right text-blue-600 font-semibold">
                      {item.direction ===
                      "transfer"
                        ? `৳ ${money(item.amount)}`
                        : "-"}
                    </td>

                    <td className="p-4">
                      {item.note || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td
                  colSpan="7"
                  className="p-4 text-right font-bold"
                >
                  Total
                </td>

                <td className="p-4 text-right font-bold text-green-600">
                  ৳ {money(totals.totalIn)}
                </td>

                <td className="p-4 text-right font-bold text-red-500">
                  ৳ {money(totals.totalOut)}
                </td>

                <td className="p-4 text-right font-bold text-blue-600">
                  ৳ {money(
                    totals.totalTransfer
                  )}
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

function Card({
  title,
  value,
  highlight,
  danger,
}) {
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
      <p
        className={`text-xs md:text-sm ${
          highlight
            ? "text-blue-50"
            : "text-gray-500"
        }`}
      >
        {title}
      </p>

      <h3 className="text-xl md:text-2xl font-bold mt-3">
        ৳ {money(value)}
      </h3>
    </div>
  );
}

function sourceText(item) {
  if (item.direction === "in") {
    return item.receiveTo === "bank"
      ? `Receive to Bank${
          item.bankName
            ? ` - ${item.bankName}`
            : ""
        }`
      : "Receive to Cash";
  }

  if (item.direction === "out") {
    return item.paymentFrom === "bank"
      ? `Payment from Bank${
          item.bankName
            ? ` - ${item.bankName}`
            : ""
        }`
      : "Payment from Cash";
  }

  return item.bankName || "Transfer";
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    "en-GB"
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}