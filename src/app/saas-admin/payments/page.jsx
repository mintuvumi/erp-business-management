"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  CheckCircle,
  XCircle,
  CreditCard,
  Clock,
  BadgeDollarSign,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function statusClass(status) {
  if (status === "approved") return "bg-green-50 text-green-700 border-green-100";
  if (status === "pending") return "bg-yellow-50 text-yellow-700 border-yellow-100";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

export default function SaasAdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [billingMonth, setBillingMonth] = useState(monthNow());
  const [rejecting, setRejecting] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (billingMonth) params.set("billingMonth", billingMonth);

      const res = await fetch(`/api/saas/admin/payments?${params}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      setPayments(data.data?.payments || []);
      setSummary(data.data?.summary || {});
    } catch (error) {
      alert(error.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const text = q.toLowerCase();

    return payments
      .filter((p) =>
        [
          p.companyName,
          p.invoiceNo,
          p.transactionId,
          p.senderNumber,
          p.paymentMethod,
          p.status,
          p.submittedBy,
        ]
          .join(" ")
          .toLowerCase()
          .includes(text)
      )
      .slice(0, 8);
  }, [q, payments]);

  const updatePayment = async (payload) => {
    try {
      const res = await fetch("/api/saas/admin/payments", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      alert(data.message || "Payment updated");
      setRejecting(null);
      await loadPayments();
    } catch (error) {
      alert(error.message || "Update failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">SaaS Payments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review customer subscription payments, approve or reject requests.
            </p>
          </div>

          <button
            onClick={loadPayments}
            className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card title="Total" value={summary.totalPayments || 0} icon={CreditCard} />
        <Card title="Pending" value={summary.pendingPayments || 0} icon={Clock} warning />
        <Card title="Approved" value={summary.approvedPayments || 0} icon={CheckCircle} success />
        <Card title="Rejected" value={summary.rejectedPayments || 0} icon={XCircle} danger />
        <Card title="Approved Amount" value={`৳ ${money(summary.approvedAmount)}`} icon={BadgeDollarSign} success />
        <Card title="Pending Amount" value={`৳ ${money(summary.pendingAmount)}`} icon={BadgeDollarSign} warning />
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, invoice, txn id, sender number..."
              className="w-full border rounded-xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
                {suggestions.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => setQ(p.transactionId || p.companyName || p.invoiceNo)}
                    className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                  >
                    <p className="font-bold">{p.companyName || "-"}</p>
                    <p className="text-xs text-gray-500">
                      {p.invoiceNo || "-"} • {p.transactionId || "-"} • {p.status}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="border rounded-xl p-3 bg-white"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-xl p-3 bg-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <button
            onClick={loadPayments}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold"
          >
            Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Month</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-left">Sender</th>
                <th className="p-3 text-left">Txn ID</th>
                <th className="p-3 text-left">Paid Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-6 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-3">
                      <p className="font-bold">{p.companyName || "-"}</p>
                      <p className="text-xs text-gray-500">
                        Submitted by: {p.submittedBy || "-"}
                      </p>
                    </td>
                    <td className="p-3">{p.invoiceNo || "-"}</td>
                    <td className="p-3">{p.billingMonth || "-"}</td>
                    <td className="p-3 text-right">৳ {money(p.amount)}</td>
                    <td className="p-3 text-right">৳ {money(p.paidAmount)}</td>
                    <td className="p-3 capitalize">{p.paymentMethod || "-"}</td>
                    <td className="p-3">{p.senderNumber || "-"}</td>
                    <td className="p-3 font-semibold">{p.transactionId || "-"}</td>
                    <td className="p-3">{p.paidDate || "-"}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-bold ${statusClass(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                      {p.rejectReason && (
                        <p className="text-xs text-red-500 mt-1">
                          {p.rejectReason}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {p.status === "pending" ? (
                          <>
                            <button
                              onClick={() => {
                                if (confirm(`Approve payment ${p.invoiceNo}?`)) {
                                  updatePayment({
                                    paymentId: p._id,
                                    action: "approve",
                                  });
                                }
                              }}
                              className="bg-green-600 text-white px-3 py-2 rounded-xl flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>

                            <button
                              onClick={() => setRejecting(p)}
                              className="bg-red-600 text-white px-3 py-2 rounded-xl flex items-center gap-1"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No action
                          </span>
                        )}

                        {p.paymentScreenshot && (
                          <a
                            href={p.paymentScreenshot}
                            target="_blank"
                            rel="noreferrer"
                            className="border px-3 py-2 rounded-xl hover:bg-gray-50"
                          >
                            Screenshot
                          </a>
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

      {rejecting && (
        <RejectModal
          payment={rejecting}
          onClose={() => setRejecting(null)}
          onReject={(reason) =>
            updatePayment({
              paymentId: rejecting._id,
              action: "reject",
              rejectReason: reason,
            })
          }
        />
      )}
    </div>
  );
}

function RejectModal({ payment, onClose, onReject }) {
  const [reason, setReason] = useState("Invalid payment information.");

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-[28px] w-full max-w-lg">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Reject Payment</h2>
            <p className="text-sm text-gray-500">
              {payment.companyName} • {payment.invoiceNo}
            </p>
          </div>

          <button onClick={onClose} className="w-10 h-10 rounded-full border">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border rounded-xl p-3 w-full min-h-[120px]"
            placeholder="Reject reason"
          />

          <button
            onClick={() => onReject(reason)}
            className="bg-red-600 text-white rounded-xl px-5 py-3 font-bold w-full"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon: Icon, success, warning, danger }) {
  return (
    <div
      className={`bg-white border rounded-[22px] p-4 shadow-sm ${
        success
          ? "border-green-100"
          : warning
          ? "border-yellow-100"
          : danger
          ? "border-red-100"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <h3
            className={`text-lg font-black mt-1 ${
              success
                ? "text-green-600"
                : warning
                ? "text-yellow-600"
                : danger
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {value}
          </h3>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}