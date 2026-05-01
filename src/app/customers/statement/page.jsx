"use client";

import { useState } from "react";
import {
  Search,
  Printer,
  Download,
  Share2,
  RefreshCcw,
  Wallet,
  X,
} from "lucide-react";

import CompanyHeader from "@/components/common/CompanyHeader";
import { exportElementToPDF, shareText } from "@/utils/exportPDF";
import { numberToWordsBD } from "@/utils/numberToWords";

export default function CustomerStatementPage() {
  const [customer, setCustomer] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchStatement = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (customer) params.set("customer", customer);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/customers/statement?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRows(data.data.rows || []);
        setSummary(data.data.summary || {});
      } else {
        alert(data.message || "Statement load failed");
      }
    } catch (error) {
      console.error(error);
      alert("Statement load failed");
    } finally {
      setLoading(false);
    }
  };

  const openPayment = (row) => {
    setSelectedSale(row);
    setPaymentAmount(row.currentDue || row.dueAmount || "");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNote("");
    setPaymentOpen(true);
  };

  const savePayment = async () => {
    if (!selectedSale?._id) return alert("Sale not selected");

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return alert("Valid payment amount required");
    }

    try {
      setSavingPayment(true);

      const res = await fetch("/api/customers/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleId: selectedSale._id,
          amount: Number(paymentAmount),
          date: paymentDate,
          note: paymentNote,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment failed");
      }

      alert("Payment collected ✅");
      setPaymentOpen(false);
      fetchStatement();
    } catch (error) {
      alert(error.message || "Payment failed");
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="space-y-5 print:bg-white">
      <div id="customer-statement-pdf" className="space-y-5">
        <CompanyHeader
          title="Customer Statement"
          rightContent={
            <div className="flex flex-wrap gap-2 print:hidden">
              <button onClick={() => window.print()} className="btn">
                <Printer size={16} />
                Print
              </button>

              <button
                onClick={() =>
                  exportElementToPDF({
                    elementId: "customer-statement-pdf",
                    fileName: "customer-statement.pdf",
                  })
                }
                className="btn"
              >
                <Download size={16} />
                PDF
              </button>

              <button
                onClick={() =>
                  shareText({
                    title: "Customer Statement",
                    text: "Customer statement report is ready.",
                  })
                }
                className="btn"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          }
        />

        <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
          <div className="p-5 md:p-7 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_170px_52px] gap-3 print:hidden">
              <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm focus-within:ring-4 focus-within:ring-blue-100">
                <Search size={18} className="text-gray-400" />
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Search customer name..."
                  className="w-full outline-none text-sm"
                />
              </div>

              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border rounded-2xl px-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
              />

              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border rounded-2xl px-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
              />

              <button
                onClick={fetchStatement}
                className="h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
              >
                <RefreshCcw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryCard title="Total Sales" value={summary.salesTotal || summary.grossTotal} />
              <SummaryCard title="VAT Deducted" value={summary.vatTotal} danger />
              <SummaryCard title="AIT Deducted" value={summary.aitTotal} danger />
              <SummaryCard title="Net Receivable" value={summary.netReceivableTotal} highlight />
              <SummaryCard title="Received" value={summary.paidTotal} success />
              <SummaryCard title="Current Due" value={summary.currentDueTotal || summary.dueTotal} danger />
              <SummaryCard title="Outstanding Balance" value={summary.closingBalance} dark />
            </div>

            <div className="border rounded-3xl overflow-hidden">
              <div className="p-4 border-b flex flex-wrap gap-2 justify-between items-center">
                <div>
                  <h2 className="font-semibold">Statement Details</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    VAT/AIT বাদ দিয়ে customer receivable balance দেখানো হচ্ছে।
                  </p>
                </div>

                <span className="text-xs text-gray-500">
                  {rows.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1450px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Invoice/Bill No</th>
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-right">Sales Amount</th>
                      <th className="p-3 text-right">VAT Deducted</th>
                      <th className="p-3 text-right">AIT Deducted</th>
                      <th className="p-3 text-right">Net Receivable</th>
                      <th className="p-3 text-right">Received</th>
                      <th className="p-3 text-right">Current Due</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-center print:hidden">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-gray-400">
                          No statement found. Search customer or select date range.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row._id} className="border-t hover:bg-gray-50">
                          <td className="p-3 whitespace-nowrap">{row.date}</td>
                          <td className="p-3 min-w-[220px]">
                            {row.description || row.note || "-"}
                          </td>
                          <td className="p-3 font-semibold whitespace-nowrap">
                            {row.billNo}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-medium">{row.customerName}</div>
                            {row.customerPhone && (
                              <div className="text-xs text-gray-500">
                                {row.customerPhone}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-right">৳ {money(row.salesAmount)}</td>
                          <td className="p-3 text-right text-red-500">৳ {money(row.vatAmount)}</td>
                          <td className="p-3 text-right text-red-500">৳ {money(row.aitAmount)}</td>
                          <td className="p-3 text-right font-bold text-blue-600">৳ {money(row.netReceivable)}</td>
                          <td className="p-3 text-right text-green-600 font-semibold">৳ {money(row.paidAmount)}</td>
                          <td className="p-3 text-right text-red-500 font-semibold">৳ {money(row.currentDue || row.dueAmount)}</td>
                          <td className="p-3 text-right font-bold">৳ {money(row.balance)}</td>

                          <td className="p-3 text-center print:hidden">
                            {Number(row.currentDue || row.dueAmount || 0) > 0 ? (
                              <button
                                onClick={() => openPayment(row)}
                                className="px-3 py-2 rounded-xl bg-blue-600 text-white inline-flex items-center gap-2 hover:bg-blue-700"
                              >
                                <Wallet size={15} />
                                Collect
                              </button>
                            ) : (
                              <span className="text-xs text-green-600 font-semibold">
                                Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {rows.length > 0 && (
                    <tfoot className="bg-gray-50 border-t font-bold">
                      <tr>
                        <td className="p-3" colSpan={4}>Total</td>
                        <td className="p-3 text-right">৳ {money(summary.salesTotal || summary.grossTotal)}</td>
                        <td className="p-3 text-right text-red-500">৳ {money(summary.vatTotal)}</td>
                        <td className="p-3 text-right text-red-500">৳ {money(summary.aitTotal)}</td>
                        <td className="p-3 text-right text-blue-600">৳ {money(summary.netReceivableTotal)}</td>
                        <td className="p-3 text-right text-green-600">৳ {money(summary.paidTotal)}</td>
                        <td className="p-3 text-right text-red-500">৳ {money(summary.currentDueTotal || summary.dueTotal)}</td>
                        <td className="p-3 text-right">৳ {money(summary.closingBalance)}</td>
                        <td className="p-3 print:hidden"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
              <div className="rounded-2xl border p-4 bg-gray-50">
                <p className="text-sm text-gray-600">
                  <b>Formula:</b> Net Receivable = Sales Amount - VAT Deducted - AIT Deducted.
                  Current Due = Net Receivable - Received Amount.
                </p>
              </div>

              <div className="rounded-2xl border p-4 bg-blue-50">
                <p className="text-sm text-gray-500">Amount in Words</p>
                <p className="font-bold mt-1 text-blue-700">
                  {numberToWordsBD(summary.closingBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {paymentOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl border overflow-hidden">
            <div className="p-5 border-b flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Collect Payment</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSale?.customerName} — {selectedSale?.billNo}
                </p>
              </div>

              <button
                onClick={() => setPaymentOpen(false)}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SmallInfo title="Net Receivable" value={selectedSale?.netReceivable} />
                <SmallInfo title="Current Due" value={selectedSale?.currentDue || selectedSale?.dueAmount} danger />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Note
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Payment note..."
                  className="w-full border rounded-xl p-3 min-h-[90px] outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={savePayment}
                disabled={savingPayment}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {savingPayment ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .btn {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
        }
        .btn:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value, highlight, danger, success, dark }) {
  return (
    <div
      className={`p-4 rounded-2xl border shadow-sm ${
        highlight
          ? "bg-blue-600 text-white"
          : danger
          ? "bg-red-50 text-red-600"
          : success
          ? "bg-green-50 text-green-700"
          : dark
          ? "bg-gray-900 text-white"
          : "bg-white"
      }`}
    >
      <p className="text-xs opacity-80">{title}</p>
      <h3 className="text-xl font-bold mt-2">৳ {money(value)}</h3>
    </div>
  );
}

function SmallInfo({ title, value, danger }) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        danger ? "bg-red-50 text-red-600" : "bg-gray-50"
      }`}
    >
      <p className="text-xs opacity-70">{title}</p>
      <h4 className="font-bold mt-1">৳ {money(value)}</h4>
    </div>
  );
}

function money(v) {
  return Number(v || 0).toFixed(2);
}