"use client";

import { useState } from "react";
import {
  Search,
  CalendarDays,
  Printer,
  Download,
  Share2,
  RefreshCcw,
  Wallet,
  X,
} from "lucide-react";

import CompanyHeader from "@/components/common/CompanyHeader";
import { exportElementToPDF, shareText } from "@/utils/exportPDF";

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
    setPaymentAmount(row.dueAmount || "");
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
    <div id="customer-statement-pdf" className="space-y-5 print:bg-white">

      {/* ✅ HEADER */}
      <CompanyHeader
        title="Customer Statement"
        rightContent={
          <div className="flex flex-wrap gap-2 print:hidden">

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            {/* ✅ PDF */}
            <button
              onClick={() =>
                exportElementToPDF({
                  elementId: "customer-statement-pdf",
                  fileName: "customer-statement.pdf",
                })
              }
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Download size={16} />
              PDF
            </button>

            {/* ✅ SHARE */}
            <button
              onClick={() =>
                shareText({
                  title: "Customer Statement",
                  text: "Customer statement report is ready.",
                })
              }
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>

          </div>
        }
      />

      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="p-5 md:p-7 space-y-5">

          {/* FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_170px_48px] gap-3 print:hidden">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
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
              className="border rounded-2xl px-3 py-3"
            />

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border rounded-2xl px-3 py-3"
            />

            <button
              onClick={fetchStatement}
              className="h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* SUMMARY */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard title="Gross Sales" value={summary.grossTotal} />
            <SummaryCard title="VAT" value={summary.vatTotal} />
            <SummaryCard title="AIT" value={summary.aitTotal} />
            <SummaryCard title="Net Receivable" value={summary.netReceivableTotal} highlight />
            <SummaryCard title="Paid" value={summary.paidTotal} />
            <SummaryCard title="Due" value={summary.dueTotal} danger />
            <SummaryCard title="Closing Balance" value={summary.closingBalance} danger />
          </div>

          {/* TABLE */}
          <div className="border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-semibold">Statement Details</h2>
              <span className="text-xs text-gray-500">{rows.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Bill</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-right">Net</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Due</th>
                    <th className="p-3 text-center print:hidden">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row._id} className="border-t">
                      <td className="p-3">{row.date}</td>
                      <td className="p-3">{row.billNo}</td>
                      <td className="p-3">{row.customerName}</td>
                      <td className="p-3 text-right">৳ {money(row.netReceivable)}</td>
                      <td className="p-3 text-right text-green-600">৳ {money(row.paidAmount)}</td>
                      <td className="p-3 text-right text-red-500">৳ {money(row.dueAmount)}</td>
                      <td className="p-3 text-center print:hidden">
                        {Number(row.dueAmount) > 0 && (
                          <button
                            onClick={() => openPayment(row)}
                            className="px-3 py-1 rounded-lg bg-blue-500 text-white"
                          >
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* helpers */
function SummaryCard({ title, value, highlight, danger }) {
  return (
    <div className={`p-4 rounded-xl border ${
      highlight ? "bg-blue-500 text-white" :
      danger ? "bg-red-50 text-red-600" : ""
    }`}>
      <p className="text-xs">{title}</p>
      <h3 className="text-xl font-bold mt-2">৳ {money(value)}</h3>
    </div>
  );
}

function money(v) {
  return Number(v || 0).toFixed(2);
}