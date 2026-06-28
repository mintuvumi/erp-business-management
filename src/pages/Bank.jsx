"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  RefreshCcw,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Save,
  Printer,
} from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(v) {
  return Number(v || 0).toFixed(2);
}

function arr(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

export default function Bank() {
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState("withdraw");
  const [lastChequeTransaction, setLastChequeTransaction] = useState(null);

  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [branchName, setBranchName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const [bankId, setBankId] = useState("");
  const [toBankId, setToBankId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [purpose, setPurpose] = useState("Office Cash Withdraw");
  const [customPurpose, setCustomPurpose] = useState("");
  const [note, setNote] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const selectedBank = useMemo(
    () => banks.find((b) => String(b._id) === String(bankId)),
    [banks, bankId]
  );

  const loadBank = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/bank", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Bank load failed");
      }

      setBanks(arr(data, "banks"));
      setTransactions(arr(data, "transactions"));
      setSummary(data.data || {});
    } catch (error) {
      alert(error.message || "Bank load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBank();
  }, []);

  const clearTransaction = () => {
    setAmount("");
    setDate(today());

    setPurpose(
      tab === "withdraw"
        ? "Office Cash Withdraw"
        : tab === "deposit"
        ? "Cash Deposit"
        : "Bank Transfer"
    );

    setCustomPurpose("");
    setNote("");
    setChequeNo("");
    setTransactionId("");
    setToBankId("");
  };

  const createBank = async () => {
    if (!bankName.trim()) return alert("Bank name required");

    try {
      setSaving(true);

      const res = await fetch("/api/bank", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_bank",
          bankName,
          accountName,
          accountNo,
          accountNumber: accountNo,
          branchName,
          openingBalance: Number(openingBalance || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Bank create failed");
      }

      setBankName("");
      setAccountName("");
      setAccountNo("");
      setBranchName("");
      setOpeningBalance("");

      await loadBank();
      window.dispatchEvent(new Event("dashboard:update"));
      window.dispatchEvent(new Event("cashbank:update"));
    } catch (error) {
      alert(error.message || "Bank create failed");
    } finally {
      setSaving(false);
    }
  };

  const saveTransaction = async () => {
    if (!bankId) return alert("Select bank");
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount");

    try {
      setSaving(true);
      setLastChequeTransaction(null);

      const finalPurpose =
        purpose === "Other" ? customPurpose.trim() || "Other" : purpose;

      let payload = {};

      if (tab === "transfer") {
        if (!toBankId) return alert("Select To Bank");

        payload = {
          action: "transfer",
          fromBankId: bankId,
          toBankId,
          amount: Number(amount),
          date,
          title: finalPurpose || "Bank Transfer",
          purpose: finalPurpose,
          note,
        };
      } else {
        const isWithdraw = tab === "withdraw";

        payload = {
          action: "transaction",
          bankId,
          type: isWithdraw ? "out" : "in",
          category: isWithdraw ? "cash_withdraw" : "cash_deposit",
          title:
            finalPurpose ||
            (isWithdraw ? "Office Cash Withdraw" : "Cash Deposit"),
          purpose: finalPurpose,
          amount: Number(amount),
          date,
          note,
          comment: note,
          paymentMethod: isWithdraw ? "cheque" : "bank",
chequeNo: chequeNo,

          transactionId,
          personName: "Office",
          personType: "owner",
          refType: isWithdraw ? "office_cash_withdraw" : "cash_bank_deposit",
        };
      }

      const res = await fetch("/api/bank", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Transaction failed");
      }

      if (
  tab === "withdraw" &&
  data?.data?.transaction &&
  data?.data?.chequeRegister
) {
  setLastChequeTransaction({
    _id: data.data.transaction._id,
    chequeNo: data.data.chequeRegister.chequeNo,
  });
}

      clearTransaction();
      await loadBank();

      window.dispatchEvent(new Event("dashboard:update"));
      window.dispatchEvent(new Event("cashbank:update"));
    } catch (error) {
      alert(error.message || "Transaction failed");
    } finally {
      setSaving(false);
    }
  };

  const openChequePrint = () => {
    if (!lastChequeTransaction?._id) return;

    const params = new URLSearchParams({
      transactionId: lastChequeTransaction._id,
      chequeNo: lastChequeTransaction.chequeNo || "",
    });

    window.open(`/cheque-print?${params.toString()}`, "_blank");
  };

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bank Management</h1>
          <p className="text-sm text-gray-500">
            Office cash withdraw, cash deposit, bank transfer and cheque print.
          </p>
        </div>

        <button onClick={loadBank} className="btn">
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Bank Balance" value={summary.totalBankBalance} />
        <Card title="Today Deposit" value={summary.todayDeposit} />
        <Card title="Today Withdraw" value={summary.todayWithdraw} danger />
        <Card title="Total Accounts" value={summary.totalAccounts} noMoney />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[410px_1fr] gap-5">
        <div className="space-y-5">
          <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <Plus size={18} className="text-blue-600" />
              Add Bank Account
            </h2>

            <input className="input" placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <input className="input" placeholder="Account Name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            <input className="input" placeholder="Account No" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} />
            <input className="input" placeholder="Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            <input className="input" type="number" placeholder="Opening Balance" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />

            <button onClick={createBank} disabled={saving} className="primary-btn">
              <Save size={16} />
              {saving ? "Saving..." : "Create Bank"}
            </button>
          </div>

          <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              Bank Transaction
            </h2>

            <div className="grid grid-cols-3 gap-2">
              <TabBtn active={tab === "withdraw"} onClick={() => { setTab("withdraw"); setPurpose("Office Cash Withdraw"); setLastChequeTransaction(null); }}>
                <ArrowDownToLine size={15} /> Withdraw
              </TabBtn>

              <TabBtn active={tab === "deposit"} onClick={() => { setTab("deposit"); setPurpose("Cash Deposit"); setLastChequeTransaction(null); }}>
                <ArrowUpFromLine size={15} /> Deposit
              </TabBtn>

              <TabBtn active={tab === "transfer"} onClick={() => { setTab("transfer"); setPurpose("Bank Transfer"); setLastChequeTransaction(null); }}>
                <Repeat size={15} /> Transfer
              </TabBtn>
            </div>

            <select className="input" value={bankId} onChange={(e) => setBankId(e.target.value)}>
              <option value="">Select Bank</option>
              {banks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bankName} - ৳ {money(b.currentBalance)}
                </option>
              ))}
            </select>

            {tab === "transfer" && (
              <select className="input" value={toBankId} onChange={(e) => setToBankId(e.target.value)}>
                <option value="">To Bank</option>
                {banks.filter((b) => String(b._id) !== String(bankId)).map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bankName} - ৳ {money(b.currentBalance)}
                  </option>
                ))}
              </select>
            )}

            {selectedBank && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm">
                Current Balance: <b>৳ {money(selectedBank.currentBalance)}</b>
              </div>
            )}

            <input className="input" type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

            <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {tab === "withdraw" ? (
                <>
                  <option value="Office Cash Withdraw">Office Cash Withdraw</option>
                  <option value="Supplier Payment">Supplier Payment</option>
                  <option value="Salary Payment">Salary Payment</option>
                  <option value="Office Rent">Office Rent</option>
                  <option value="Utility Bill">Utility Bill</option>
                  <option value="Fuel Expense">Fuel Expense</option>
                  <option value="Marketing Expense">Marketing Expense</option>
                  <option value="Loan Payment">Loan Payment</option>
                  <option value="Bank Charge">Bank Charge</option>
                  <option value="Petty Cash">Petty Cash</option>
                  <option value="Owner Drawings">Owner Drawings</option>
                  <option value="Investment">Investment</option>
                  <option value="Other">Other</option>
                </>
              ) : tab === "deposit" ? (
                <>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="Customer Collection">Customer Collection</option>
                  <option value="Customer Due Collection">Customer Due Collection</option>
                  <option value="Sales Deposit">Sales Deposit</option>
                  <option value="Owner Capital">Owner Capital</option>
                  <option value="Loan Received">Loan Received</option>
                  <option value="Transfer From Cash">Transfer From Cash</option>
                  <option value="Other">Other</option>
                </>
              ) : (
                <>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Transfer To Branch">Transfer To Branch</option>
                  <option value="Fund Movement">Fund Movement</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>

            {purpose === "Other" && (
              <input
                className="input mt-3"
                placeholder="Enter Custom Purpose"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
              />
            )}

            

            <input
              className="input"
              placeholder="Transaction ID / Reference"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />

            <textarea
              className="input min-h-[90px]"
              placeholder="Comment / Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <button onClick={saveTransaction} disabled={saving} className="primary-btn">
              <Save size={16} />
              {saving ? "Saving..." : "Save Transaction"}
            </button>

            {lastChequeTransaction?._id && (
              <button onClick={openChequePrint} className="print-btn">
                <Printer size={16} />
                Print Cheque
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between">
            <h2 className="font-bold">Bank Accounts & Transactions</h2>
            <span className="text-xs text-gray-500">{transactions.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Bank</th>
                  <th className="p-3 text-left">Particulars</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Cheque</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Credit</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>

              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No bank transaction found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{t.date}</td>
                      <td className="p-3 font-semibold">{t.bankName}</td>
                      <td className="p-3">{t.particulars}</td>
                      <td className="p-3">{String(t.category).replaceAll("_", " ")}</td>
                      <td className="p-3">{t.chequeNo || "-"}</td>
                      <td className="p-3 text-right text-red-500">৳ {money(t.debit)}</td>
                      <td className="p-3 text-right text-green-600">৳ {money(t.credit)}</td>
                      <td className="p-3 text-right font-bold">৳ {money(t.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 14px;
          outline: none;
          background: white;
        }

        .input:focus {
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
          border-color: #93c5fd;
        }

        .btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .primary-btn,
        .print-btn {
          width: 100%;
          border-radius: 14px;
          padding: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .primary-btn {
          background: #2563eb;
          color: white;
        }

        .print-btn {
          border: 1px solid #2563eb;
          color: #2563eb;
          background: white;
        }

        .print-btn:hover {
          background: #eff6ff;
        }

        .primary-btn:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, danger, noMoney }) {
  return (
    <div className={`bg-white border rounded-2xl p-4 shadow-sm ${danger ? "text-red-600" : ""}`}>
      <p className="text-xs text-gray-500">{title}</p>
      <h3 className="text-xl font-bold mt-1">
        {noMoney ? Number(value || 0) : `৳ ${money(value)}`}
      </h3>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-1 ${
        active ? "bg-blue-600 text-white border-blue-600" : "bg-white"
      }`}
    >
      {children}
    </button>
  );
}