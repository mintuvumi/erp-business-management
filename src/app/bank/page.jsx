"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCcw,
  Building2,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  Printer,
  Download,
  Share2,
  Search,
  Pencil,
} from "lucide-react";

import EditBankTransactionModal from "@/components/bank/EditBankTransactionModal";

export default function BankPage() {
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalBankBalance, setTotalBankBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountName: "",
    accountNo: "",
    openingBalance: 0,
  });

  const [txnForm, setTxnForm] = useState({
    bankId: "",
    category: "cash_deposit",
    type: "in",
    title: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const fetchBanks = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedBank) params.set("bankId", selectedBank);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/bank?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setBanks(data.data.banks || []);
        setTransactions(data.data.transactions || []);
        setTotalBankBalance(data.data.totalBankBalance || 0);
      }
    } catch (error) {
      console.error(error);
      alert("Bank data load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const saveBank = async () => {
    if (!bankForm.bankName.trim()) return alert("Bank name required");

    const res = await fetch("/api/bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bankForm, action: "create_bank" }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Bank account created ✅");
      setBankForm({
        bankName: "",
        accountName: "",
        accountNo: "",
        openingBalance: 0,
      });
      fetchBanks();
    } else {
      alert(data.message || "Failed");
    }
  };

  const saveTransaction = async () => {
    if (!txnForm.bankId) return alert("Select bank account");
    if (!txnForm.title.trim()) return alert("Title required");
    if (!txnForm.amount || Number(txnForm.amount) <= 0) {
      return alert("Valid amount required");
    }

    const res = await fetch("/api/bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...txnForm,
        action: "transaction",
        amount: Number(txnForm.amount),
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Bank transaction saved ✅");
      setTxnForm({
        bankId: "",
        category: "cash_deposit",
        type: "in",
        title: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        note: "",
      });
      fetchBanks();
    } else {
      alert(data.message || "Failed");
    }
  };

  const handleCategoryChange = (category) => {
    let type = "out";

    if (
      [
        "cash_deposit",
        "bank_receive",
        "due_collection",
        "cash_sale",
        "other_income",
      ].includes(category)
    ) {
      type = "in";
    }

    setTxnForm({ ...txnForm, category, type });
  };

  const ledgerRows = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateA - dateB;
    });

    let runningBalance = 0;

    return sorted.map((txn) => {
      const amount = Number(txn.amount || 0);
      const credit = txn.type === "in" ? amount : 0;
      const debit = txn.type === "out" ? amount : 0;

      runningBalance = runningBalance + credit - debit;

      return {
        ...txn,
        debit,
        credit,
        runningBalance,
      };
    });
  }, [transactions]);

  const totalDebit = ledgerRows.reduce(
    (sum, txn) => sum + Number(txn.debit || 0),
    0
  );

  const totalCredit = ledgerRows.reduce(
    (sum, txn) => sum + Number(txn.credit || 0),
    0
  );

  const closingBalance = totalCredit - totalDebit;

  const printLedger = () => window.print();

  const shareLedger = async () => {
    const text = `Bank Ledger
Total Credit: ৳ ${money(totalCredit)}
Total Debit: ৳ ${money(totalDebit)}
Closing Balance: ৳ ${money(closingBalance)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Bank Ledger",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Ledger copied");
    }
  };

  const openEditModal = (txn) => {
    setSelectedTxn(txn);
    setEditOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 print:hidden">
        <div className="lg:col-span-2 bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Bank Management</h1>
              <p className="text-sm text-gray-500">
                Create bank accounts and manage balance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
            <input
              value={bankForm.bankName}
              onChange={(e) =>
                setBankForm({ ...bankForm, bankName: e.target.value })
              }
              placeholder="Bank Name"
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              value={bankForm.accountName}
              onChange={(e) =>
                setBankForm({ ...bankForm, accountName: e.target.value })
              }
              placeholder="Account Name"
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              value={bankForm.accountNo}
              onChange={(e) =>
                setBankForm({ ...bankForm, accountNo: e.target.value })
              }
              placeholder="Account No"
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              type="number"
              value={bankForm.openingBalance}
              onChange={(e) =>
                setBankForm({
                  ...bankForm,
                  openingBalance: Number(e.target.value) || 0,
                })
              }
              placeholder="Opening Balance"
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            onClick={saveBank}
            className="mt-4 inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 active:scale-[0.98]"
          >
            <Plus size={16} />
            Create Bank
          </button>
        </div>

        <div className="bg-blue-500 text-white rounded-[28px] p-5 shadow-[0_18px_40px_rgba(59,130,246,0.28)]">
          <p className="text-blue-50 text-sm">Total Bank Balance</p>
          <h2 className="text-3xl font-bold mt-4">
            ৳ {money(totalBankBalance)}
          </h2>
          <p className="text-xs text-blue-50 mt-3">
            All bank accounts combined balance
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="font-bold">New Bank Transaction</h2>
            <p className="text-sm text-gray-500">
              Deposit, withdraw, payment, receive, salary and expense
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={txnForm.bankId}
            onChange={(e) => setTxnForm({ ...txnForm, bankId: e.target.value })}
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Bank</option>
            {banks.map((bank) => (
              <option key={bank._id} value={bank._id}>
                {bank.bankName} - ৳ {money(bank.currentBalance)}
              </option>
            ))}
          </select>

          <select
            value={txnForm.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="cash_deposit">Cash Deposit To Bank</option>
            <option value="cash_withdraw">Cash Withdraw From Bank</option>
            <option value="bank_receive">Bank Receive</option>
            <option value="bank_payment">Bank Payment</option>
            <option value="salary_payment">Salary Payment</option>
            <option value="supplier_payment">Supplier Payment</option>
            <option value="due_collection">Due Collection</option>
            <option value="cash_sale">Cash Sales Add</option>
            <option value="expense">Expense</option>
            <option value="other_income">Other Income</option>
          </select>

          <input
            value={txnForm.type}
            readOnly
            className="border rounded-xl p-3 outline-none bg-gray-50 capitalize"
          />

          <input
            value={txnForm.title}
            onChange={(e) => setTxnForm({ ...txnForm, title: e.target.value })}
            placeholder="Title"
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          />

          <input
            type="number"
            value={txnForm.amount}
            onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
            placeholder="Amount"
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          />

          <input
            type="date"
            value={txnForm.date}
            onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })}
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          />

          <textarea
            value={txnForm.note}
            onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })}
            placeholder="Note"
            className="md:col-span-3 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
          />
        </div>

        <button
          onClick={saveTransaction}
          className="mt-4 inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 active:scale-[0.98]"
        >
          <CreditCard size={16} />
          Save Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        {banks.length === 0 ? (
          <div className="bg-white border rounded-2xl p-5 text-gray-500">
            No bank account found
          </div>
        ) : (
          banks.map((bank) => (
            <div
              key={bank._id}
              className="bg-white border rounded-[24px] p-5 shadow-sm hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(59,130,246,0.14)] transition-all"
            >
              <p className="text-sm text-gray-500">{bank.accountName || "-"}</p>
              <h3 className="font-bold text-lg mt-1">{bank.bankName}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {bank.accountNo || bank.accountNumber || "No account no"}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-gray-500">Current</span>
                <span className="font-bold text-blue-600">
                  ৳ {money(bank.currentBalance)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
          <div>
            <h2 className="font-bold">Bank Ledger Statement</h2>
            <p className="text-xs text-gray-500">
              Bank style debit, credit and running balance statement
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchBanks}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={printLedger}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={printLedger}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <Download size={16} />
              PDF
            </button>

            <button
              onClick={shareLedger}
              className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="p-5 border-b print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, category, note..."
                className="border rounded-xl pl-9 pr-3 py-3 w-full outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Banks</option>
              {banks.map((bank) => (
                <option key={bank._id} value={bank._id}>
                  {bank.bankName}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            onClick={fetchBanks}
            className="mt-3 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600"
          >
            Apply Search
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b">
          <LedgerCard title="Total Credit" value={totalCredit} />
          <LedgerCard title="Total Debit" value={totalDebit} danger />
          <LedgerCard title="Closing Balance" value={closingBalance} highlight />
          <LedgerCard title="Bank Balance" value={totalBankBalance} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Bank</th>
                <th className="p-4 text-left">Particulars</th>
                <th className="p-4 text-left">Ref / Category</th>
                <th className="p-4 text-right">Debit</th>
                <th className="p-4 text-right">Credit</th>
                <th className="p-4 text-right">Balance</th>
                <th className="p-4 text-left">Note</th>
                <th className="p-4 text-center print:hidden">Action</th>
              </tr>
            </thead>

            <tbody>
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">
                    No bank ledger found
                  </td>
                </tr>
              ) : (
                ledgerRows.map((txn) => (
                  <tr key={txn._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-4">{txn.date || formatDate(txn.createdAt)}</td>

                    <td className="p-4">
                      <div className="font-semibold">
                        {txn.bankId?.bankName || "-"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {txn.bankId?.accountNo ||
                          txn.bankId?.accountNumber ||
                          ""}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium">{txn.title || "-"}</div>
                      <div
                        className={`inline-flex items-center gap-1 text-xs mt-1 ${
                          txn.type === "in" ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {txn.type === "in" ? (
                          <>
                            <ArrowDownToLine size={13} /> Credit
                          </>
                        ) : (
                          <>
                            <ArrowUpFromLine size={13} /> Debit
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-4 capitalize">
                      {String(txn.category || "-").replaceAll("_", " ")}
                    </td>

                    <td className="p-4 text-right text-red-500 font-semibold">
                      {txn.debit ? `৳ ${money(txn.debit)}` : "-"}
                    </td>

                    <td className="p-4 text-right text-green-600 font-semibold">
                      {txn.credit ? `৳ ${money(txn.credit)}` : "-"}
                    </td>

                    <td
                      className={`p-4 text-right font-bold ${
                        txn.runningBalance >= 0
                          ? "text-blue-600"
                          : "text-red-500"
                      }`}
                    >
                      ৳ {money(txn.runningBalance)}
                    </td>

                    <td className="p-4">{txn.note || "-"}</td>

                    <td className="p-4 text-center print:hidden">
                      <button
                        onClick={() => openEditModal(txn)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan="4" className="p-4 text-right font-bold">
                  Total
                </td>
                <td className="p-4 text-right font-bold text-red-500">
                  ৳ {money(totalDebit)}
                </td>
                <td className="p-4 text-right font-bold text-green-600">
                  ৳ {money(totalCredit)}
                </td>
                <td className="p-4 text-right font-bold text-blue-600">
                  ৳ {money(closingBalance)}
                </td>
                <td className="p-4"></td>
                <td className="p-4 print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <EditBankTransactionModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedTxn(null);
        }}
        transaction={selectedTxn}
        onUpdated={fetchBanks}
      />
    </div>
  );
}

function LedgerCard({ title, value, highlight, danger }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "bg-blue-500 text-white"
          : danger
          ? "bg-red-50 text-red-600"
          : "bg-white"
      }`}
    >
      <p className={`text-xs ${highlight ? "text-blue-50" : "text-gray-500"}`}>
        {title}
      </p>
      <h3 className="text-xl font-bold mt-2">৳ {money(value)}</h3>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB");
}

function money(value) {
  return Number(value || 0).toFixed(2);
}