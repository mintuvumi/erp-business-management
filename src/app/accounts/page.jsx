"use client";

import { useEffect, useState } from "react";
import {
  RefreshCcw,
  Plus,
  Wallet,
  Landmark,
  HandCoins,
  Banknote,
} from "lucide-react";

export default function AccountsPage() {
  const [summary, setSummary] = useState({});
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [incomeForm, setIncomeForm] = useState({
    type: "owner_capital",
    receiveTo: "cash",
    bankId: "",
    title: "",
    amount: "",
    note: "",
  });

  const [loanForm, setLoanForm] = useState({
    loanType: "personal",
    lenderName: "",
    amount: "",
    receiveTo: "cash",
    bankId: "",
    note: "",
  });

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/accounts/summary");
      const data = await res.json();

      if (data.success) {
        setSummary(data.data);
        setBanks(data.data.banks || []);
      }
    } catch (error) {
      console.error(error);
      alert("Accounts load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const saveIncome = async () => {
    if (!incomeForm.title || !incomeForm.amount) {
      return alert("Title and amount required");
    }

    const amount = Number(incomeForm.amount) || 0;

    if (incomeForm.receiveTo === "cash") {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "in",
          category: "other_income",
          title: incomeForm.title,
          amount,
          note: incomeForm.note,
          refType:
            incomeForm.type === "owner_capital" ? "owner_capital" : "manual",
        }),
      });

      const data = await res.json();
      if (!data.success) return alert(data.message || "Failed");
    }

    if (incomeForm.receiveTo === "bank") {
      if (!incomeForm.bankId) return alert("Select bank");

      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transaction",
          bankId: incomeForm.bankId,
          type: "in",
          category: "other_income",
          title: incomeForm.title,
          amount,
          note: incomeForm.note,
          refType:
            incomeForm.type === "owner_capital" ? "owner_capital" : "manual",
        }),
      });

      const data = await res.json();
      if (!data.success) return alert(data.message || "Failed");
    }

    alert("Income saved ✅");
    setIncomeForm({
      type: "owner_capital",
      receiveTo: "cash",
      bankId: "",
      title: "",
      amount: "",
      note: "",
    });
    fetchSummary();
  };

  const saveLoan = async () => {
    if (!loanForm.lenderName || !loanForm.amount) {
      return alert("Lender name and amount required");
    }

    const res = await fetch("/api/loan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...loanForm,
        amount: Number(loanForm.amount) || 0,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Loan saved ✅");
      setLoanForm({
        loanType: "personal",
        lenderName: "",
        amount: "",
        receiveTo: "cash",
        bankId: "",
        note: "",
      });
      fetchSummary();
    } else {
      alert(data.message || "Failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Accounts Control</h1>
            <p className="text-sm text-gray-500 mt-1">
              Capital, income, loan, cash, bank and company position
            </p>
          </div>

          <button
            onClick={fetchSummary}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <HandCoins size={20} />
            </div>
            <div>
              <h2 className="font-bold">Owner Capital / Other Income</h2>
              <p className="text-sm text-gray-500">
                Add capital or income to cash/bank
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
            <select
              value={incomeForm.type}
              onChange={(e) =>
                setIncomeForm({ ...incomeForm, type: e.target.value })
              }
              className="border rounded-xl p-3"
            >
              <option value="owner_capital">Owner Capital</option>
              <option value="other_income">Other Income</option>
            </select>

            <select
              value={incomeForm.receiveTo}
              onChange={(e) =>
                setIncomeForm({ ...incomeForm, receiveTo: e.target.value })
              }
              className="border rounded-xl p-3"
            >
              <option value="cash">Receive To Cash</option>
              <option value="bank">Receive To Bank</option>
            </select>

            <select
              value={incomeForm.bankId}
              onChange={(e) =>
                setIncomeForm({ ...incomeForm, bankId: e.target.value })
              }
              disabled={incomeForm.receiveTo === "cash"}
              className="border rounded-xl p-3 disabled:bg-gray-100"
            >
              <option value="">Select Bank</option>
              {banks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bankName} - ৳ {money(b.currentBalance)}
                </option>
              ))}
            </select>

            <input
              value={incomeForm.title}
              onChange={(e) =>
                setIncomeForm({ ...incomeForm, title: e.target.value })
              }
              placeholder="Title"
              className="border rounded-xl p-3"
            />

            <input
              type="number"
              value={incomeForm.amount}
              onChange={(e) =>
                setIncomeForm({ ...incomeForm, amount: e.target.value })
              }
              placeholder="Amount"
              className="border rounded-xl p-3"
            />

            <textarea
              value={incomeForm.note}
              onChange={(e) =>
                setIncomeForm({ ...incomeForm, note: e.target.value })
              }
              placeholder="Note"
              className="md:col-span-2 border rounded-xl p-3"
            />
          </div>

          <button
            onClick={saveIncome}
            className="mt-4 inline-flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl hover:bg-green-600"
          >
            <Plus size={16} />
            Save Income
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="font-bold">Bank / Personal Loan</h2>
              <p className="text-sm text-gray-500">
                Add loan and receive to cash/bank
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
            <select
              value={loanForm.loanType}
              onChange={(e) =>
                setLoanForm({ ...loanForm, loanType: e.target.value })
              }
              className="border rounded-xl p-3"
            >
              <option value="personal">Personal Loan</option>
              <option value="bank">Bank Loan</option>
            </select>

            <input
              value={loanForm.lenderName}
              onChange={(e) =>
                setLoanForm({ ...loanForm, lenderName: e.target.value })
              }
              placeholder="Lender Name"
              className="border rounded-xl p-3"
            />

            <select
              value={loanForm.receiveTo}
              onChange={(e) =>
                setLoanForm({ ...loanForm, receiveTo: e.target.value })
              }
              className="border rounded-xl p-3"
            >
              <option value="cash">Receive To Cash</option>
              <option value="bank">Receive To Bank</option>
            </select>

            <select
              value={loanForm.bankId}
              onChange={(e) =>
                setLoanForm({ ...loanForm, bankId: e.target.value })
              }
              disabled={loanForm.receiveTo === "cash"}
              className="border rounded-xl p-3 disabled:bg-gray-100"
            >
              <option value="">Select Bank</option>
              {banks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bankName} - ৳ {money(b.currentBalance)}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={loanForm.amount}
              onChange={(e) =>
                setLoanForm({ ...loanForm, amount: e.target.value })
              }
              placeholder="Loan Amount"
              className="border rounded-xl p-3"
            />

            <textarea
              value={loanForm.note}
              onChange={(e) =>
                setLoanForm({ ...loanForm, note: e.target.value })
              }
              placeholder="Note"
              className="md:col-span-2 border rounded-xl p-3"
            />
          </div>

          <button
            onClick={saveLoan}
            className="mt-4 inline-flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl hover:bg-red-600"
          >
            <Plus size={16} />
            Save Loan
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b">
          <h2 className="font-bold">Loan List</h2>
          <p className="text-xs text-gray-500">Bank and personal loan summary</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Lender</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Due</th>
                <th className="p-4 text-left">Note</th>
              </tr>
            </thead>

            <tbody>
              {summary.loans?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-5 text-center text-gray-500">
                    No loan found
                  </td>
                </tr>
              ) : (
                summary.loans?.map((loan) => (
                  <tr key={loan._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-4">{loan.date}</td>
                    <td className="p-4 capitalize">{loan.loanType}</td>
                    <td className="p-4">{loan.lenderName}</td>
                    <td className="p-4 text-right">৳ {money(loan.amount)}</td>
                    <td className="p-4 text-right text-green-600">
                      ৳ {money(loan.paidAmount)}
                    </td>
                    <td className="p-4 text-right text-red-500">
                      ৳ {money(loan.dueAmount)}
                    </td>
                    <td className="p-4">{loan.note || "-"}</td>
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