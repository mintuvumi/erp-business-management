"use client";

import { useState } from "react";
import {
  Search,
  CalendarDays,
  RefreshCcw,
  Printer,
  Download,
  Share2,
  Wallet,
  X,
  Sparkles,
} from "lucide-react";

export default function SupplierLedgerPage() {
  const [supplier, setSupplier] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchLedger = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (supplier) params.set("supplier", supplier);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/suppliers/ledger?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRows(data.data.rows || []);
        setSummary(data.data.summary || {});
      }
    } catch (error) {
      console.error(error);
      alert("Supplier ledger load failed");
    } finally {
      setLoading(false);
    }
  };

  const applyAISearch = () => {
    const text = aiSearch.toLowerCase().trim();
    if (!text) return;

    setSupplier(aiSearch);

    if (text.includes("today") || text.includes("আজ")) {
      const today = new Date().toISOString().slice(0, 10);
      setFrom(today);
      setTo(today);
    }

    if (text.includes("this month") || text.includes("এই মাস")) {
      const now = new Date();

      setFrom(
        new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10)
      );

      setTo(
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .slice(0, 10)
      );
    }

    setTimeout(fetchLedger, 100);
  };

  const resetFilter = () => {
    setSupplier("");
    setAiSearch("");
    setFrom("");
    setTo("");
    setRows([]);
    setSummary({});
  };

  const openPayment = (row) => {
    setSelectedPurchase(row);
    setPaymentAmount(row.dueAmount || "");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNote("");
    setPaymentOpen(true);
  };

  const savePayment = async () => {
    if (!selectedPurchase?._id) return alert("Purchase not selected");

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return alert("Valid payment amount required");
    }

    try {
      setSavingPayment(true);

      const res = await fetch("/api/suppliers/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseId: selectedPurchase._id,
          amount: Number(paymentAmount),
          date: paymentDate,
          note: paymentNote,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment failed");
      }

      alert("Supplier Payment Saved ✅");
      setPaymentOpen(false);
      fetchLedger();
    } catch (error) {
      alert(error.message || "Payment failed");
    } finally {
      setSavingPayment(false);
    }
  };

  const shareLedger = async () => {
    const text = `Supplier Ledger
Total Purchase: ৳ ${money(summary.totalPurchase)}
Total Paid: ৳ ${money(summary.totalPaid)}
Total Due: ৳ ${money(summary.totalDue)}
Closing Balance: ৳ ${money(summary.closingBalance)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Supplier Ledger",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Supplier ledger copied");
    }
  };

  return (
    <div className="space-y-5 print:bg-white">
      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="p-5 md:p-7 border-b flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Supplier Ledger
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Company Name • Company Address • Phone Number
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={fetchLedger}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Download size={16} />
              PDF
            </button>

            <button
              onClick={shareLedger}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="p-5 md:p-7 space-y-5">
          <div className="bg-purple-50 border border-purple-100 rounded-3xl p-4 print:hidden">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-purple-600" />
              <h2 className="font-semibold text-purple-700">
                AI Supplier Ledger Search
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <input
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                placeholder="Example: Rahim supplier this month / bill no 102 / today due"
                className="border rounded-xl px-4 py-3 outline-none"
              />

              <button
                onClick={applyAISearch}
                className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
              >
                AI Search
              </button>

              <button
                onClick={resetFilter}
                className="border px-5 py-3 rounded-xl hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_170px_48px] gap-3 print:hidden">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Search supplier / bill no / invoice no / item..."
                className="w-full outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <CalendarDays size={18} className="text-gray-400" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <CalendarDays size={18} className="text-gray-400" />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>

            <button
              onClick={fetchLedger}
              className="h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard title="Total Purchase" value={summary.totalPurchase} />
            <SummaryCard title="Total Paid" value={summary.totalPaid} />
            <SummaryCard title="Total Due" value={summary.totalDue} danger />
            <SummaryCard
              title="Closing Balance"
              value={summary.closingBalance}
              danger
            />
          </div>

          <div className="border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-semibold">Ledger Details</h2>
              <span className="text-xs text-gray-500">
                {rows.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Purchase No</th>
                    <th className="p-3 text-left">Bill No</th>
                    <th className="p-3 text-left">Invoice No</th>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Payment</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Due</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3 text-center print:hidden">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="p-6 text-center text-gray-500">
                        No supplier ledger found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row._id} className="border-t hover:bg-blue-50/40">
                        <td className="p-3">{row.date || "-"}</td>
                        <td className="p-3">{row.purchaseNo || "-"}</td>
                        <td className="p-3">{row.supplierBillNo || "-"}</td>
                        <td className="p-3">{row.supplierInvoiceNo || "-"}</td>
                        <td className="p-3 font-medium">
                          {row.supplierName || "-"}
                        </td>
                        <td className="p-3">{row.supplierPhone || "-"}</td>
                        <td className="p-3">{row.itemName || "-"}</td>
                        <td className="p-3 capitalize">
                          {row.purchaseType || "-"}
                        </td>
                        <td className="p-3 capitalize">
                          {row.paymentType || "-"}
                        </td>
                        <td className="p-3 text-right">
                          ৳ {money(row.total)}
                        </td>
                        <td className="p-3 text-right text-green-600">
                          ৳ {money(row.paidAmount)}
                        </td>
                        <td className="p-3 text-right text-red-500">
                          ৳ {money(row.dueAmount)}
                        </td>
                        <td className="p-3 text-right font-bold">
                          ৳ {money(row.balance)}
                        </td>
                        <td className="p-3 text-center print:hidden">
                          {Number(row.dueAmount || 0) > 0 ? (
                            <button
                              onClick={() => openPayment(row)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                            >
                              <Wallet size={14} />
                              Pay
                            </button>
                          ) : (
                            <span className="text-green-600 font-medium">
                              Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {rows.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="p-3" colSpan="9">
                        Total
                      </td>
                      <td className="p-3 text-right">
                        ৳ {money(summary.totalPurchase)}
                      </td>
                      <td className="p-3 text-right">
                        ৳ {money(summary.totalPaid)}
                      </td>
                      <td className="p-3 text-right">
                        ৳ {money(summary.totalDue)}
                      </td>
                      <td className="p-3 text-right">
                        ৳ {money(summary.closingBalance)}
                      </td>
                      <td className="p-3 print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {paymentOpen && (
        <div className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[28px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden">
            <div className="p-5 border-b flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">Supplier Payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedPurchase?.supplierName} • Bill{" "}
                  {selectedPurchase?.supplierBillNo || "-"}
                </p>
              </div>

              <button
                onClick={() => setPaymentOpen(false)}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-gray-50 border rounded-2xl p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Purchase</span>
                  <strong>৳ {money(selectedPurchase?.total)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Paid</span>
                  <strong className="text-green-600">
                    ৳ {money(selectedPurchase?.paidAmount)}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>Due</span>
                  <strong className="text-red-500">
                    ৳ {money(selectedPurchase?.dueAmount)}
                  </strong>
                </div>
              </div>

              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Payment Amount"
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
              />

              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Payment note"
                className="w-full border rounded-xl p-3 outline-none min-h-[90px] focus:ring-2 focus:ring-blue-400"
              />

              <button
                onClick={savePayment}
                disabled={savingPayment}
                className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium hover:bg-blue-600 disabled:opacity-60"
              >
                {savingPayment ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value, highlight, danger }) {
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

function money(value) {
  return Number(value || 0).toFixed(2);
}