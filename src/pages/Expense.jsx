"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Save,
  Search,
  Wallet,
  Landmark,
  ReceiptText,
  Printer,
  Trash2,
  Pencil,
  X,
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

const expenseHeads = [
  "Office Rent",
  "Utility Bill",
  "Internet Bill",
  "Fuel Expense",
  "Transport Expense",
  "Marketing Expense",
  "Office Supplies",
  "Repair & Maintenance",
  "Bank Charge",
  "Staff Welfare",
  "Conveyance",
  "Food & Entertainment",
  "Factory Expense",
  "Other Expense",
];

export default function Expense() {
  const [banks, setBanks] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [editingId, setEditingId] = useState("");

  const [title, setTitle] = useState("");
  const [head, setHead] = useState("Office Rent");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [paymentFrom, setPaymentFrom] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");

  const selectedBank = useMemo(
    () => banks.find((b) => String(b._id) === String(bankId)),
    [banks, bankId]
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      if (dateFilter) params.set("date", dateFilter);

      const [expenseRes, bankRes] = await Promise.all([
        fetch(`/api/expense?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/bank?limit=100", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const expenseData = await expenseRes.json();
      const bankData = await bankRes.json();

      if (!expenseRes.ok || !expenseData.success) {
        throw new Error(expenseData.message || "Expense load failed");
      }

      if (bankData.success) {
        setBanks(arr(bankData, "banks"));
      }

      setRows(expenseData.data?.rows || []);
      setSummary(expenseData.data || {});
    } catch (error) {
      alert(error.message || "Expense load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadData, 350);
    return () => clearTimeout(timer);
  }, [search, sourceFilter, dateFilter]);

  const clearForm = () => {
    setEditingId("");
    setTitle("");
    setHead("Office Rent");
    setAmount("");
    setDate(today());
    setPaymentFrom("cash");
    setBankId("");
    setPaymentMethod("cash");
    setTransactionId("");
    setNote("");
  };

  const saveExpense = async () => {
    if (!title.trim()) return alert("Expense title required");
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount");

    if (paymentFrom === "bank" && !bankId) {
      return alert("Select bank");
    }

    try {
      setSaving(true);

      const payload = {
        title,
        head,
        category: "expense",
        amount: Number(amount),
        date,
        paymentFrom,
        bankId: paymentFrom === "bank" ? bankId : null,
        paymentMethod: paymentFrom === "bank" ? paymentMethod : "cash",
        transactionId,
        note,
        comment: note,
      };

      const res = await fetch("/api/expense", {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { ...payload, _id: editingId } : payload
        ),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Expense save failed");
      }

      if (
        paymentFrom === "bank" &&
        paymentMethod === "cheque" &&
        data?.data?.transaction &&
        data?.data?.chequeRegister
      ) {
        const ok = window.confirm(
          `Cheque No ${data.data.chequeRegister.chequeNo} generated.\n\nPrint cheque now?`
        );

        if (ok) {
          window.open(
            `/cheque-print?transactionId=${data.data.transaction._id}&chequeNo=${data.data.chequeRegister.chequeNo}`,
            "_blank"
          );
        }
      }

      window.dispatchEvent(new Event("dashboard:update"));
      window.dispatchEvent(new Event("cashbank:update"));

      clearForm();
      await loadData();
    } catch (error) {
      alert(error.message || "Expense save failed");
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setEditingId(row._id);
    setTitle(row.title || "");
    setHead(row.head || row.category || "Other Expense");
    setAmount(row.amount || "");
    setDate(row.date || today());
    setPaymentFrom(row.source || "cash");
    setBankId(row.bankId || "");
    setPaymentMethod(row.paymentType === "cheque" ? "cheque" : row.source === "bank" ? "bank" : "cash");
    setTransactionId(row.transactionId || "");
    setNote(row.note || row.comment || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRow = async (row) => {
    const ok = confirm(`Delete expense "${row.title}"?`);
    if (!ok) return;

    try {
      const res = await fetch("/api/expense", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: row._id,
          source: row.source,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }

      await loadData();
      window.dispatchEvent(new Event("dashboard:update"));
      window.dispatchEvent(new Event("cashbank:update"));
    } catch (error) {
      alert(error.message || "Delete failed");
    }
  };

  const printPage = () => window.print();

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-sm text-gray-500">
            Cash, bank and cheque expense with professional tracking.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={printPage} className="btn">
            <Printer size={16} />
            Print
          </button>

          <button onClick={loadData} className="btn">
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <Card title="Today Expense" value={summary.todayExpense} />
        <Card title="Monthly Expense" value={summary.monthlyExpense} />
        <Card title="Yearly Expense" value={summary.yearlyExpense} />
        <Card title="Total Expense" value={summary.totalExpense} danger />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <ReceiptText size={18} className="text-blue-600" />
              {editingId ? "Update Expense" : "Add Expense"}
            </h2>

            {editingId && (
              <button onClick={clearForm} className="text-red-500 flex items-center gap-1 text-sm font-semibold">
                <X size={15} />
                Cancel
              </button>
            )}
          </div>

          <input
            className="input"
            placeholder="Expense title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="input"
            value={head}
            onChange={(e) => setHead(e.target.value)}
          >
            {expenseHeads.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <input
            className="input"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentFrom("cash");
                setBankId("");
                setPaymentMethod("cash");
              }}
              className={`pay-btn ${paymentFrom === "cash" ? "active" : ""}`}
            >
              <Wallet size={16} />
              Cash
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentFrom("bank");
                setPaymentMethod("bank");
              }}
              className={`pay-btn ${paymentFrom === "bank" ? "active" : ""}`}
            >
              <Landmark size={16} />
              Bank
            </button>
          </div>

          {paymentFrom === "bank" && (
            <>
              <select
                className="input"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
              >
                <option value="">Select Bank</option>
                {banks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bankName} - ৳ {money(b.currentBalance)}
                  </option>
                ))}
              </select>

              {selectedBank && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm text-blue-700">
                  Selected Bank Balance: <b>৳ {money(selectedBank.currentBalance)}</b>
                </div>
              )}

              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
                <option value="mobile_banking">Mobile Banking</option>
              </select>

              {paymentMethod === "cheque" && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm text-blue-700">
                  Cheque No will be generated automatically from active Cheque Book.
                </div>
              )}

              <input
                className="input"
                placeholder="Transaction ID / Reference"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </>
          )}

          <textarea
            className="input min-h-[90px]"
            placeholder="Note / comment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            onClick={saveExpense}
            disabled={saving}
            className="primary-btn"
          >
            <Save size={16} />
            {saving ? "Saving..." : editingId ? "Update Expense" : "Save Expense"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
          <div className="p-4 border-b print:hidden space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 flex-1">
                <Search size={18} className="text-gray-400" />
                <input
                  className="w-full outline-none text-sm"
                  placeholder="Search title, category, note, bank..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="border rounded-2xl px-4 py-3 bg-white text-sm"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="">All Source</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>

              <input
                type="date"
                className="border rounded-2xl px-4 py-3 bg-white text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 border-b hidden print:block">
            <h2 className="text-xl font-bold">Expense Report</h2>
            <p className="text-sm">Total Expense: ৳ {money(summary.filteredTotalExpense || summary.totalExpense)}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Head</th>
                  <th className="p-3 text-left">Source</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Voucher</th>
                  <th className="p-3 text-left">Note</th>
                  <th className="p-3 text-center print:hidden">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      No expense found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{row.date}</td>
                      <td className="p-3 font-semibold">{row.title}</td>
                      <td className="p-3">{row.head}</td>
                      <td className="p-3 capitalize">{row.sourceName}</td>
                      <td className="p-3 capitalize">{row.paymentType}</td>
                      <td className="p-3 text-right text-red-600 font-bold">
                        ৳ {money(row.amount)}
                      </td>
                      <td className="p-3">{row.voucherNo || "-"}</td>
                      <td className="p-3">{row.note || row.comment || "-"}</td>
                      <td className="p-3 print:hidden">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => editRow(row)} className="icon-btn">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteRow(row)} className="icon-btn danger">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={5} className="p-3 text-right">
                    Total
                  </td>
                  <td className="p-3 text-right text-red-600">
                    ৳ {money(summary.filteredTotalExpense || 0)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
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

        .pay-btn {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          background: white;
        }

        .pay-btn.active {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
        }

        .primary-btn {
          width: 100%;
          background: #2563eb;
          color: white;
          border-radius: 14px;
          padding: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .primary-btn:disabled {
          opacity: 0.6;
        }

        .icon-btn {
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .icon-btn:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .icon-btn.danger:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        @media print {
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, danger }) {
  return (
    <div className={`bg-white border rounded-2xl p-4 shadow-sm ${danger ? "text-red-600" : ""}`}>
      <p className="text-xs text-gray-500">{title}</p>
      <h3 className="text-xl font-bold mt-1">৳ {money(value)}</h3>
    </div>
  );
}