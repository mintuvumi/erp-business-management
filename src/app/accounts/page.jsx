"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Plus,
  Wallet,
  Search,
  Printer,
  Share2,
  FileDown,
  Sparkles,
  Wand2,
} from "lucide-react";

export default function AccountsPage() {
  const [summary, setSummary] = useState({});
  const [banks, setBanks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [aiText, setAiText] = useState("");

  const emptyForm = {
    transactionType: "income",
    categoryName: "",
    title: "",
    amount: "",
    direction: "in",
    paymentFrom: "cash",
    receiveTo: "cash",
    fromBankId: "",
    toBankId: "",
    personType: "none",
    personName: "",
    paymentMethod: "cash",
    chequeNo: "",
    printCheque: false,
    note: "",
  };

  const [transactionForm, setTransactionForm] = useState(emptyForm);

  const transactionTypes = [
    { value: "income", label: "Receive Money", direction: "in" },
    { value: "expense", label: "Expense", direction: "out" },
    { value: "salary_payment", label: "Salary Payment", direction: "out" },
    { value: "customer_collection", label: "Customer Collection", direction: "in" },
    { value: "supplier_payment", label: "Supplier Payment", direction: "out" },
    { value: "loan_receive", label: "Loan Receive", direction: "in" },
    { value: "loan_payment", label: "Loan Payment", direction: "out" },
    { value: "bank_transfer", label: "Bank Transfer", direction: "transfer" },
    { value: "cash_sale", label: "Cash Sale", direction: "in" },
    { value: "owner_capital", label: "Owner Capital", direction: "in" },
  ];

  const aiSuggestions = [
    {
      key: "salary",
      words: ["salary", "বেতন", "staff", "employee"],
      data: {
        transactionType: "salary_payment",
        direction: "out",
        categoryName: "Salary",
        title: "Salary Payment",
        personType: "employee",
        paymentFrom: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "conveyance",
      words: ["conveyance", "transport", "যাতায়াত", "ভাড়া", "bus", "rickshaw"],
      data: {
        transactionType: "expense",
        direction: "out",
        categoryName: "Conveyance",
        title: "Conveyance Expense",
        personType: "none",
        paymentFrom: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "rent",
      words: ["rent", "office rent", "ভাড়া", "দোকান ভাড়া"],
      data: {
        transactionType: "expense",
        direction: "out",
        categoryName: "Office Rent",
        title: "Office Rent Payment",
        personType: "other",
        paymentFrom: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "electric",
      words: ["electric", "electricity", "বিদ্যুৎ", "bill"],
      data: {
        transactionType: "expense",
        direction: "out",
        categoryName: "Electric Bill",
        title: "Electric Bill Payment",
        personType: "none",
        paymentFrom: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "customer_collection",
      words: ["customer", "collection", "due collection", "কালেকশন", "কাস্টমার"],
      data: {
        transactionType: "customer_collection",
        direction: "in",
        categoryName: "Customer Collection",
        title: "Customer Due Collection",
        personType: "customer",
        receiveTo: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "supplier",
      words: ["supplier", "vendor", "সাপ্লায়ার"],
      data: {
        transactionType: "supplier_payment",
        direction: "out",
        categoryName: "Supplier Payment",
        title: "Supplier Payment",
        personType: "supplier",
        paymentFrom: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "loan_receive",
      words: ["loan receive", "loan nilam", "লোন নিলাম", "ঋণ নিলাম"],
      data: {
        transactionType: "loan_receive",
        direction: "in",
        categoryName: "Loan Receive",
        title: "Loan Receive",
        personType: "lender",
        receiveTo: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "loan_payment",
      words: ["loan payment", "loan paid", "লোন দিলাম", "ঋণ পরিশোধ"],
      data: {
        transactionType: "loan_payment",
        direction: "out",
        categoryName: "Loan Payment",
        title: "Loan Payment",
        personType: "lender",
        paymentFrom: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "cash_sale",
      words: ["cash sale", "sale", "বিক্রি", "ক্যাশ সেল"],
      data: {
        transactionType: "cash_sale",
        direction: "in",
        categoryName: "Cash Sale",
        title: "Cash Sale",
        personType: "customer",
        receiveTo: "cash",
        paymentMethod: "cash",
      },
    },
    {
      key: "owner_capital",
      words: ["capital", "owner", "মালিক", "মূলধন"],
      data: {
        transactionType: "owner_capital",
        direction: "in",
        categoryName: "Owner Capital",
        title: "Owner Capital",
        personType: "owner",
        receiveTo: "cash",
        paymentMethod: "cash",
      },
    },
  ];

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;

    const q = search.toLowerCase();

    return transactions.filter((t) =>
      [
        t.transactionNo,
        t.title,
        t.categoryName,
        t.personName,
        t.bankName,
        t.note,
        t.transactionType,
        t.paymentMethod,
        t.chequeNo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [transactions, search]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts/summary");
      const data = await res.json();

      if (data.success) {
        setSummary(data.data || {});
        setBanks(data.data?.banks || []);
      }
    } catch (error) {
      console.error(error);
      alert("Accounts load failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/accounts/categories");
      const data = await res.json();

      if (data.success) setCategories(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/accounts/transactions?limit=100");
      const data = await res.json();

      if (data.success) setTransactions(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshAll = async () => {
    await fetchSummary();
    await fetchCategories();
    await fetchTransactions();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleTransactionTypeChange = (value) => {
    const selected = transactionTypes.find((item) => item.value === value);

    setTransactionForm((prev) => ({
      ...prev,
      transactionType: value,
      direction: selected?.direction || "in",
      paymentFrom: selected?.direction === "in" ? "cash" : prev.paymentFrom,
      receiveTo: selected?.direction === "out" ? "cash" : prev.receiveTo,
      fromBankId: "",
      toBankId: "",
    }));
  };

  const applyAISuggestion = () => {
    const text = aiText.toLowerCase().trim();

    if (!text) return alert("AI suggestion text লিখুন");

    const matched = aiSuggestions.find((item) =>
      item.words.some((word) => text.includes(word.toLowerCase()))
    );

    if (!matched) {
      return alert("AI বুঝতে পারেনি। Example: salary paid 5000 / customer collection 10000");
    }

    const amountMatch = text.match(/\d+(\.\d+)?/);
    const amount = amountMatch ? amountMatch[0] : "";

    setTransactionForm((prev) => ({
      ...prev,
      ...matched.data,
      amount: amount || prev.amount,
      note: aiText,
      fromBankId: "",
      toBankId: "",
      chequeNo: "",
      printCheque: false,
    }));
  };

  const smartFillByType = () => {
    const selected = transactionTypes.find(
      (item) => item.value === transactionForm.transactionType
    );

    const categoryMap = {
      income: "Other Income",
      expense: "General Expense",
      salary_payment: "Salary",
      customer_collection: "Customer Collection",
      supplier_payment: "Supplier Payment",
      loan_receive: "Loan Receive",
      loan_payment: "Loan Payment",
      bank_transfer: "Bank Transfer",
      cash_sale: "Cash Sale",
      owner_capital: "Owner Capital",
    };

    setTransactionForm((prev) => ({
      ...prev,
      direction: selected?.direction || prev.direction,
      categoryName: prev.categoryName || categoryMap[prev.transactionType] || "",
      title:
        prev.title ||
        String(selected?.label || "")
          .replaceAll("_", " ")
          .trim(),
    }));
  };

  const saveTransaction = async () => {
    try {
      if (!transactionForm.title.trim()) return alert("Title required");
      if (!transactionForm.categoryName.trim()) return alert("Category required");
      if (!transactionForm.amount || Number(transactionForm.amount) <= 0) {
        return alert("Valid amount required");
      }

      if (
        transactionForm.direction === "out" &&
        transactionForm.paymentFrom === "bank" &&
        !transactionForm.fromBankId
      ) {
        return alert("Select payment bank");
      }

      if (
        transactionForm.direction === "in" &&
        transactionForm.receiveTo === "bank" &&
        !transactionForm.toBankId
      ) {
        return alert("Select receive bank");
      }

      if (transactionForm.direction === "transfer") {
        if (transactionForm.paymentFrom === "bank" && !transactionForm.fromBankId) {
          return alert("Select source bank");
        }

        if (transactionForm.receiveTo === "bank" && !transactionForm.toBankId) {
          return alert("Select destination bank");
        }
      }

      if (
        transactionForm.paymentMethod === "cheque" &&
        transactionForm.paymentFrom !== "bank"
      ) {
        return alert("Cheque payment must be from bank");
      }

      setSaving(true);

      const payload = {
        ...transactionForm,
        amount: Number(transactionForm.amount),
        categoryType:
          transactionForm.direction === "in"
            ? "income"
            : transactionForm.direction === "out"
            ? "expense"
            : "transfer",
      };

      const res = await fetch("/api/accounts/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) return alert(data.message || "Transaction failed");

      alert("Transaction saved ✅");

      if (
        transactionForm.paymentMethod === "cheque" &&
        transactionForm.printCheque === true
      ) {
        window.open(`/cheque-print?transactionId=${data.data._id}`, "_blank");
      }

      setTransactionForm(emptyForm);
      setAiText("");
      refreshAll();
    } catch (error) {
      console.error(error);
      alert("Transaction failed");
    } finally {
      setSaving(false);
    }
  };

  const printStatement = () => window.print();

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Accounts Control</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cash, bank, receive, payment, salary, loan and full statement
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Card title="Account Receivable" value={summary.accountReceivable} />
          <Card title="Account Payable" value={summary.accountPayable} danger />
          <Card title="Cash In Hand" value={summary.cashInHand} />
          <Card title="Bank Balance" value={summary.bankBalance} />
          <Card title="Stock Value" value={summary.stockValue} />
          <Card title="Total Loan" value={summary.totalLoan} danger />
          <Card title="Total Asset" value={summary.totalAsset} highlight />
          <Card title="Net Position" value={summary.netPosition} highlight />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>

          <div>
            <h2 className="font-bold">AI Smart Entry</h2>
            <p className="text-sm text-gray-500">
              Example: salary paid 5000, customer collection 10000, cash sale 2000
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 mt-5">
          <input
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="AI লিখুন: salary paid 5000 from bank / customer collection 10000"
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={applyAISuggestion}
            className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
          >
            <Sparkles size={16} />
            AI Fill
          </button>

          <button
            onClick={smartFillByType}
            className="inline-flex items-center justify-center gap-2 border px-5 py-3 rounded-xl hover:bg-gray-50"
          >
            <Wand2 size={16} />
            Smart Fill
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>

          <div>
            <h2 className="font-bold">Accounts Transaction</h2>
            <p className="text-sm text-gray-500">
              Receive, payment, expense, salary, collection, loan and transfer
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
          <select
            value={transactionForm.transactionType}
            onChange={(e) => handleTransactionTypeChange(e.target.value)}
            className="border rounded-xl p-3"
          >
            {transactionTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            list="categoryList"
            value={transactionForm.categoryName}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                categoryName: e.target.value,
              })
            }
            placeholder="Category: Salary, Conveyance, Bank Loan"
            className="border rounded-xl p-3"
          />

          <datalist id="categoryList">
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name} />
            ))}
          </datalist>

          <input
            value={transactionForm.title}
            onChange={(e) =>
              setTransactionForm({ ...transactionForm, title: e.target.value })
            }
            placeholder="Title"
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            value={transactionForm.amount}
            onChange={(e) =>
              setTransactionForm({ ...transactionForm, amount: e.target.value })
            }
            placeholder="Amount"
            className="border rounded-xl p-3"
          />

          <select
            value={transactionForm.direction}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                direction: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="in">Money Receive</option>
            <option value="out">Money Payment</option>
            <option value="transfer">Transfer</option>
          </select>

          {(transactionForm.direction === "out" ||
            transactionForm.direction === "transfer") && (
            <>
              <select
                value={transactionForm.paymentFrom}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    paymentFrom: e.target.value,
                    fromBankId: "",
                    paymentMethod:
                      e.target.value === "bank"
                        ? transactionForm.paymentMethod
                        : "cash",
                  })
                }
                className="border rounded-xl p-3"
              >
                <option value="cash">Payment From Cash</option>
                <option value="bank">Payment From Bank</option>
              </select>

              <select
                value={transactionForm.fromBankId}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    fromBankId: e.target.value,
                  })
                }
                disabled={transactionForm.paymentFrom === "cash"}
                className="border rounded-xl p-3 disabled:bg-gray-100"
              >
                <option value="">Select Payment Bank</option>
                {banks.map((bank) => (
                  <option key={bank._id} value={bank._id}>
                    {bank.bankName} - ৳ {money(bank.currentBalance)}
                  </option>
                ))}
              </select>
            </>
          )}

          {(transactionForm.direction === "in" ||
            transactionForm.direction === "transfer") && (
            <>
              <select
                value={transactionForm.receiveTo}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    receiveTo: e.target.value,
                    toBankId: "",
                  })
                }
                className="border rounded-xl p-3"
              >
                <option value="cash">Receive To Cash</option>
                <option value="bank">Receive To Bank</option>
              </select>

              <select
                value={transactionForm.toBankId}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    toBankId: e.target.value,
                  })
                }
                disabled={transactionForm.receiveTo === "cash"}
                className="border rounded-xl p-3 disabled:bg-gray-100"
              >
                <option value="">Select Receive Bank</option>
                {banks.map((bank) => (
                  <option key={bank._id} value={bank._id}>
                    {bank.bankName} - ৳ {money(bank.currentBalance)}
                  </option>
                ))}
              </select>
            </>
          )}

          <select
            value={transactionForm.personType}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                personType: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="none">No Person</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="employee">Employee</option>
            <option value="lender">Lender</option>
            <option value="owner">Owner</option>
            <option value="other">Other</option>
          </select>

          <input
            value={transactionForm.personName}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                personName: e.target.value,
              })
            }
            placeholder="Customer / Supplier / Employee / Lender Name"
            className="border rounded-xl p-3"
          />

          <select
            value={transactionForm.paymentMethod}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                paymentMethod: e.target.value,
                printCheque:
                  e.target.value === "cheque"
                    ? transactionForm.printCheque
                    : false,
                chequeNo:
                  e.target.value === "cheque" ? transactionForm.chequeNo : "",
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="cheque">Cheque</option>
          </select>

          {transactionForm.paymentMethod === "cheque" && (
            <>
              <input
                value={transactionForm.chequeNo}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    chequeNo: e.target.value,
                  })
                }
                placeholder="Cheque Number"
                className="border rounded-xl p-3"
              />

              <label className="flex items-center gap-2 border rounded-xl p-3">
                <input
                  type="checkbox"
                  checked={transactionForm.printCheque}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      printCheque: e.target.checked,
                    })
                  }
                />
                <span>Print Cheque After Save</span>
              </label>
            </>
          )}

          <textarea
            value={transactionForm.note}
            onChange={(e) =>
              setTransactionForm({ ...transactionForm, note: e.target.value })
            }
            placeholder="Note"
            className="md:col-span-2 xl:col-span-3 border rounded-xl p-3"
          />
        </div>

        <button
          onClick={saveTransaction}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60"
        >
          <Plus size={16} />
          {saving ? "Saving..." : "Save Transaction"}
        </button>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-bold">Accounts Statement</h2>
            <p className="text-xs text-gray-500">
              Cash, bank, receive, payment and transfer history
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transaction..."
                className="border rounded-xl pl-9 pr-3 py-2 w-full md:w-72"
              />
            </div>

            <button
              onClick={printStatement}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={printStatement}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <FileDown size={16} />
              PDF
            </button>

            <button
              onClick={() =>
                alert("Share option can be connected with WhatsApp/Email later")
              }
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">No</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Source</th>
                <th className="p-4 text-left">Person</th>
                <th className="p-4 text-right">In</th>
                <th className="p-4 text-right">Out</th>
                <th className="p-4 text-left">Payment</th>
                <th className="p-4 text-left">Note / Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="12" className="p-5 text-center text-gray-500">
                    No transaction found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-4">{formatDate(item.transactionDate)}</td>
                    <td className="p-4">{item.transactionNo || "-"}</td>
                    <td className="p-4 capitalize">
                      {String(item.transactionType || "").replaceAll("_", " ")}
                    </td>
                    <td className="p-4">{item.categoryName || "-"}</td>
                    <td className="p-4 font-medium">{item.title}</td>
                    <td className="p-4">{sourceText(item)}</td>
                    <td className="p-4">{item.personName || "-"}</td>
                    <td className="p-4 text-right text-green-600 font-semibold">
                      {item.direction === "in" ? `৳ ${money(item.amount)}` : "-"}
                    </td>
                    <td className="p-4 text-right text-red-500 font-semibold">
                      {item.direction === "out" ? `৳ ${money(item.amount)}` : "-"}
                    </td>
                    <td className="p-4">
                      <div className="capitalize font-medium">
                        {item.paymentMethod || "-"}
                      </div>
                      {item.chequeNo && (
                        <div className="text-xs text-gray-500">
                          Cheque: {item.chequeNo}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <span>{item.note || "-"}</span>

                        {item.paymentMethod === "cheque" && (
                          <Link
                            href={`/cheque-print?transactionId=${item._id}`}
                            className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 w-fit"
                          >
                            Print Cheque
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      <p
        className={`text-xs md:text-sm ${
          highlight ? "text-blue-50" : "text-gray-500"
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