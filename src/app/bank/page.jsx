"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCcw,
  Building2,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
} from "lucide-react";

export default function BankPage() {
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalBankBalance, setTotalBankBalance] = useState(0);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/bank");
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
            ৳ {Number(totalBankBalance || 0).toFixed(2)}
          </h2>
          <p className="text-xs text-blue-50 mt-3">
            All bank accounts combined balance
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
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
                {bank.bankName} - ৳ {Number(bank.currentBalance || 0).toFixed(2)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                {bank.accountNo || "No account no"}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-gray-500">Current</span>
                <span className="font-bold text-blue-600">
                  ৳ {Number(bank.currentBalance || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="font-bold">Bank Statement</h2>
            <p className="text-xs text-gray-500">
              Deposit, withdraw and payment history
            </p>
          </div>

          <button onClick={fetchBanks} className="text-blue-600">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Bank</th>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-left">Note</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-5 text-center text-gray-500">
                    No transaction found
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-4">{txn.date}</td>
                    <td className="p-4">{txn.bankId?.bankName || "-"}</td>
                    <td className="p-4">{txn.title}</td>
                    <td className="p-4 capitalize">
                      {txn.category?.replaceAll("_", " ")}
                    </td>
                    <td
                      className={`p-4 font-medium ${
                        txn.type === "in" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {txn.type === "in" ? (
                        <span className="inline-flex items-center gap-1">
                          <ArrowDownToLine size={14} /> In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpFromLine size={14} /> Out
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      ৳ {Number(txn.amount || 0).toFixed(2)}
                    </td>
                    <td className="p-4">{txn.note || "-"}</td>
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