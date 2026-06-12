"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  CalendarDays,
  Plus,
  Printer,
  Download,
  Share2,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  PiggyBank,
  Receipt,
  Users,
  ListChecks,
} from "lucide-react";

export default function CashInHandModal({ open, onClose }) {
  const [data, setData] = useState({
    cashInHand: 0,
    totalIn: 0,
    totalOut: 0,
    totalBankBalance: 0,
    cashAndBankBalance: 0,
    transactions: [],
    statementRows: [],
    banks: [],
  });

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [activeCard, setActiveCard] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    type: "out",
    category: "expense",
    title: "",
    amount: "",
    note: "",
  });

  const fetchCash = async () => {
    const companyId = localStorage.getItem("selectedCompanyId");

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (date) params.set("date", date);

    const res = await fetch(`/api/cash?${params.toString()}`, {
      credentials: "include",
      headers: companyId ? { "x-company-id": companyId } : {},
      cache: "no-store",
    });

    const json = await res.json();

    if (json.success) {
      setData({
        cashInHand: json.data?.cashInHand || 0,
        totalIn: json.data?.totalIn || 0,
        totalOut: json.data?.totalOut || 0,
        totalBankBalance: json.data?.totalBankBalance || 0,
        cashAndBankBalance: json.data?.cashAndBankBalance || 0,
        transactions: json.data?.transactions || [],
        statementRows: json.data?.statementRows || [],
        banks: json.data?.banks || [],
      });
    }
  };

  useEffect(() => {
    if (open) fetchCash();
  }, [open]);

  const saveTransaction = async () => {
    const companyId = localStorage.getItem("selectedCompanyId");

    const res = await fetch("/api/cash", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(companyId ? { "x-company-id": companyId } : {}),
      },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (json.success) {
      setShowAdd(false);
      setForm({
        type: "out",
        category: "expense",
        title: "",
        amount: "",
        note: "",
      });
      fetchCash();
    } else {
      alert(json.message || "Transaction failed");
    }
  };

  const rows = data.statementRows?.length
    ? data.statementRows
    : data.transactions || [];

  const expenseTotal = rows
    .filter((t) => t.type === "out" && t.category === "expense")
    .reduce((sum, t) => sum + Number(t.amount || t.debit || 0), 0);

  const dueCollectionTotal = rows
    .filter((t) => t.category === "due_collection")
    .reduce((sum, t) => sum + Number(t.amount || t.credit || 0), 0);

  const supplierPaymentTotal = rows
    .filter((t) => t.category === "supplier_payment")
    .reduce((sum, t) => sum + Number(t.amount || t.debit || 0), 0);

  const filteredRows = useMemo(() => {
    if (activeCard === "all") return rows;
    if (activeCard === "cashIn") return rows.filter((t) => t.type === "in");
    if (activeCard === "cashOut") return rows.filter((t) => t.type === "out");
    if (activeCard === "expense")
      return rows.filter((t) => t.category === "expense");
    if (activeCard === "due")
      return rows.filter((t) => t.category === "due_collection");
    if (activeCard === "supplier")
      return rows.filter((t) => t.category === "supplier_payment");
    if (activeCard === "bank") return data.banks || [];
    return rows;
  }, [activeCard, rows, data.banks]);

  const cards = [
    {
      key: "cash",
      title: "Cash In Hand",
      value: data.cashInHand,
      icon: Wallet,
      highlight: true,
    },
    {
      key: "cashIn",
      title: "Total Cash In",
      value: data.totalIn,
      icon: ArrowDownCircle,
    },
    {
      key: "cashOut",
      title: "Total Cash Out",
      value: data.totalOut,
      icon: ArrowUpCircle,
    },
    {
      key: "bank",
      title: "Bank Balance",
      value: data.totalBankBalance,
      icon: Landmark,
    },
    {
      key: "fund",
      title: "Cash + Bank",
      value: data.cashAndBankBalance,
      icon: PiggyBank,
      highlight: true,
    },
    {
      key: "expense",
      title: "Expense",
      value: expenseTotal,
      icon: Receipt,
    },
    {
      key: "due",
      title: "Due Collection",
      value: dueCollectionTotal,
      icon: Users,
    },
    {
      key: "supplier",
      title: "Supplier Payment",
      value: supplierPaymentTotal,
      icon: ListChecks,
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-7xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-[32px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] animate-cashFloat">
        <div className="p-5 md:p-7 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Cash In Hand</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cash, Bank and Full Cash Statement
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 md:p-7 space-y-5 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_auto] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cash statement..."
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <CalendarDays size={18} className="text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <button
              onClick={fetchCash}
              className="px-5 py-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {cards.map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                value={card.value}
                icon={card.icon}
                highlight={card.highlight}
                active={activeCard === card.key}
                onClick={() => setActiveCard(card.key)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus size={16} />
              Add Expense / Payment
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50">
              <Download size={16} />
              PDF
            </button>

            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50">
              <Share2 size={16} />
              Share
            </button>
          </div>

          {showAdd && (
            <div className="bg-gray-50 border rounded-3xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border rounded-xl px-3 py-3 outline-none"
              >
                <option value="in">Cash In</option>
                <option value="out">Cash Out</option>
              </select>

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border rounded-xl px-3 py-3 outline-none"
              >
                <option value="expense">Expense</option>
                <option value="supplier_payment">Supplier Payment</option>
                <option value="salary_payment">Salary Payment</option>
                <option value="other_income">Other Income</option>
                <option value="due_collection">Due Collection</option>
                <option value="bank_withdraw">Bank Withdraw</option>
                <option value="bank_deposit">Bank Deposit</option>
                <option value="refund_received">Refund Received</option>
                <option value="refund_paid">Refund Paid</option>
                <option value="cash_purchase">Cash Purchase</option>
              </select>

              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="border rounded-xl px-3 py-3 outline-none"
              />

              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount"
                className="border rounded-xl px-3 py-3 outline-none"
              />

              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Note"
                className="md:col-span-2 border rounded-xl px-3 py-3 outline-none"
              />

              <button
                onClick={saveTransaction}
                className="md:col-span-2 bg-blue-500 text-white rounded-xl py-3 hover:bg-blue-600"
              >
                Save Transaction
              </button>
            </div>
          )}

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <div>
                <h3 className="font-semibold">Details</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Click any card above to filter details
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {filteredRows?.length || 0} records
              </span>
            </div>

            <div className="overflow-x-auto max-h-[340px]">
              {activeCard === "bank" ? (
                <BankTable rows={filteredRows} />
              ) : (
                <CashTable rows={filteredRows} />
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes cashFloat {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-cashFloat {
          animation: cashFloat 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, highlight, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-3xl border p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 ${
        highlight || active
          ? "bg-blue-500 text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
          : "bg-white hover:shadow-[0_14px_36px_rgba(59,130,246,0.12)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-xs md:text-sm ${
            highlight || active ? "text-blue-50" : "text-gray-500"
          }`}
        >
          {title}
        </p>

        {Icon && (
          <Icon
            size={20}
            className={highlight || active ? "text-white" : "text-blue-500"}
          />
        )}
      </div>

      <h3 className="text-xl md:text-2xl font-bold mt-3">
        ৳ {Number(value || 0).toFixed(2)}
      </h3>
    </button>
  );
}

function CashTable({ rows }) {
  return (
    <table className="w-full min-w-[950px] text-sm">
      <thead className="bg-gray-50 sticky top-0">
        <tr>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Voucher</th>
          <th className="p-3 text-left">Title</th>
          <th className="p-3 text-left">Category</th>
          <th className="p-3 text-right">Cash In</th>
          <th className="p-3 text-right">Cash Out</th>
          <th className="p-3 text-left">Person</th>
          <th className="p-3 text-left">Note</th>
        </tr>
      </thead>

      <tbody>
        {!rows?.length ? (
          <tr>
            <td colSpan="8" className="p-5 text-center text-gray-500">
              No transaction found
            </td>
          </tr>
        ) : (
          rows.map((t) => (
            <tr key={t._id} className="border-t hover:bg-blue-50/40">
              <td className="p-3">{t.date || "-"}</td>
              <td className="p-3">{t.voucherNo || "-"}</td>
              <td className="p-3">{t.title || "-"}</td>
              <td className="p-3 capitalize">
                {t.category?.replaceAll("_", " ") || "-"}
              </td>
              <td className="p-3 text-right text-green-600 font-semibold">
                {t.type === "in" || Number(t.credit || 0) > 0
                  ? `৳ ${Number(t.amount || t.credit || 0).toFixed(2)}`
                  : "-"}
              </td>
              <td className="p-3 text-right text-red-500 font-semibold">
                {t.type === "out" || Number(t.debit || 0) > 0
                  ? `৳ ${Number(t.amount || t.debit || 0).toFixed(2)}`
                  : "-"}
              </td>
              <td className="p-3">
                {t.customerName ||
                  t.supplierName ||
                  t.employeeName ||
                  t.marketingOfficerName ||
                  "-"}
              </td>
              <td className="p-3">{t.note || "-"}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function BankTable({ rows }) {
  return (
    <table className="w-full min-w-[800px] text-sm">
      <thead className="bg-gray-50 sticky top-0">
        <tr>
          <th className="p-3 text-left">Bank</th>
          <th className="p-3 text-left">Account Name</th>
          <th className="p-3 text-left">Account No</th>
          <th className="p-3 text-left">Type</th>
          <th className="p-3 text-right">Balance</th>
        </tr>
      </thead>

      <tbody>
        {!rows?.length ? (
          <tr>
            <td colSpan="5" className="p-5 text-center text-gray-500">
              No bank account found
            </td>
          </tr>
        ) : (
          rows.map((b) => (
            <tr key={b._id} className="border-t hover:bg-blue-50/40">
              <td className="p-3">{b.bankName || "-"}</td>
              <td className="p-3">{b.accountName || "-"}</td>
              <td className="p-3">{b.accountNo || b.accountNumber || "-"}</td>
              <td className="p-3 capitalize">
                {b.bankType?.replaceAll("_", " ") || "bank"}
              </td>
              <td className="p-3 text-right font-semibold">
                ৳ {Number(b.currentBalance || 0).toFixed(2)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}