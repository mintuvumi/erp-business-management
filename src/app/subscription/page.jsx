"use client";

import { useEffect, useState } from "react";
import {
  RefreshCcw,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Upload,
  Send,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusClass(status) {
  if (status === "paid" || status === "active" || status === "approved") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "pending" || status === "due" || status === "warning") {
    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  }

  if (status === "expired" || status === "rejected" || status === "suspended") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  return "bg-blue-50 text-blue-700 border-blue-100";
}

export default function SubscriptionPage() {
  const [company, setCompany] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    paymentMethod: "bkash",
    paidAmount: "",
    senderNumber: "",
    transactionId: "",
    paidDate: new Date().toISOString().slice(0, 10),
    paymentScreenshot: "",
    note: "",
  });

  const loadSubscription = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/subscription/payment", {
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      setCompany(data.data?.company || null);
      setPayments(data.data?.payments || []);

      if (!form.paidAmount && data.data?.company?.monthlyFee) {
        setForm((p) => ({
          ...p,
          paidAmount: String(data.data.company.monthlyFee || ""),
        }));
      }
    } catch (error) {
      alert(error.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPayment = async () => {
    try {
      if (!form.paidAmount || Number(form.paidAmount) <= 0) {
        alert("Valid amount required");
        return;
      }

      if (
        !["cash", "manual"].includes(form.paymentMethod) &&
        !form.transactionId.trim()
      ) {
        alert("Transaction ID required");
        return;
      }

      setSubmitting(true);

      const res = await fetch("/api/subscription/payment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: form.paymentMethod,
          paidAmount: Number(form.paidAmount || 0),
          amount: Number(company?.monthlyFee || form.paidAmount || 0),
          senderNumber: form.senderNumber,
          transactionId: form.transactionId,
          paidDate: form.paidDate,
          paymentScreenshot: form.paymentScreenshot,
          note: form.note,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      alert(data.message || "Payment submitted");

      setForm((p) => ({
        ...p,
        transactionId: "",
        senderNumber: "",
        paymentScreenshot: "",
        note: "",
      }));

      await loadSubscription();
    } catch (error) {
      alert(error.message || "Payment submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">Subscription & Billing</h1>
            <p className="text-sm text-gray-500 mt-1">
              Pay your SeeERP subscription bill and track approval status.
            </p>
          </div>

          <button
            onClick={loadSubscription}
            className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <InfoCard
          title="Current Plan"
          value={company?.subscriptionPlan || "-"}
          icon={ShieldCheck}
        />
        <InfoCard
          title="Monthly Fee"
          value={`৳ ${money(company?.monthlyFee)}`}
          icon={CreditCard}
          success
        />
        <InfoCard
          title="Payment Status"
          value={company?.paymentStatus || "-"}
          icon={Clock}
          warning={company?.paymentStatus !== "paid"}
        />
        <InfoCard
          title="Service Status"
          value={company?.serviceLocked ? "Locked" : company?.subscriptionStatus || "-"}
          icon={company?.serviceLocked ? AlertTriangle : ShieldCheck}
          danger={company?.serviceLocked}
          success={!company?.serviceLocked}
        />
      </div>

      {company?.serviceLocked && (
        <div className="bg-red-50 border border-red-100 rounded-[24px] p-5 text-red-700">
          <h2 className="font-black">Service Locked</h2>
          <p className="text-sm mt-1">
            {company.lockReason ||
              "Your subscription is expired. Please submit payment."}
          </p>
        </div>
      )}

      {company?.graceActive && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-[24px] p-5 text-yellow-700">
          <h2 className="font-black">Grace Period Active</h2>
          <p className="text-sm mt-1">
            You can use SeeERP until {company.graceUntil}. Please pay before
            this date.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border rounded-[28px] p-5 shadow-sm">
          <h2 className="text-xl font-black mb-1">Submit Payment</h2>
          <p className="text-sm text-gray-500 mb-5">
            Send payment by bKash/Nagad/Rocket/Bank, then submit transaction
            details for approval.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentMethod: e.target.value }))
                }
                className="border rounded-xl p-3 w-full bg-white"
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="upay">Upay</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <Input
              label="Paid Amount"
              type="number"
              value={form.paidAmount}
              onChange={(v) => setForm((p) => ({ ...p, paidAmount: v }))}
            />

            <Input
              label="Sender Number / Account"
              value={form.senderNumber}
              onChange={(v) => setForm((p) => ({ ...p, senderNumber: v }))}
            />

            <Input
              label="Transaction ID"
              value={form.transactionId}
              onChange={(v) => setForm((p) => ({ ...p, transactionId: v }))}
            />

            <Input
              label="Paid Date"
              type="date"
              value={form.paidDate}
              onChange={(v) => setForm((p) => ({ ...p, paidDate: v }))}
            />

            <Input
              label="Screenshot URL"
              value={form.paymentScreenshot}
              onChange={(v) =>
                setForm((p) => ({ ...p, paymentScreenshot: v }))
              }
            />

            <textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Payment note"
              className="md:col-span-2 border rounded-xl p-3 min-h-[90px]"
            />
          </div>

          <button
            onClick={submitPayment}
            disabled={submitting}
            className="mt-5 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-60"
          >
            <Send size={16} />
            {submitting ? "Submitting..." : "Submit Payment"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <h2 className="text-xl font-black mb-4">Payment Instructions</h2>

          <div className="space-y-3 text-sm">
            <Instruction title="bKash / Nagad / Rocket">
              Send Money / Payment করে Transaction ID copy করে submit করুন।
            </Instruction>

            <Instruction title="Bank Transfer">
              Bank deposit/transfer করার পর reference or transaction number
              submit করুন।
            </Instruction>

            <Instruction title="Approval">
              Admin approve করলে service active হবে এবং reminder বন্ধ হবে।
            </Instruction>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-700 flex gap-2">
              <Upload size={18} />
              <p>
                Screenshot URL optional. Later এখানে direct file upload system
                add করা যাবে।
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="text-xl font-black mb-4">Payment History</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Month</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-left">Txn ID</th>
                <th className="p-3 text-left">Paid Date</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-5 text-center text-gray-500">
                    No payment history found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-3 font-semibold">{p.invoiceNo || "-"}</td>
                    <td className="p-3">{p.billingMonth}</td>
                    <td className="p-3 text-right">৳ {money(p.amount)}</td>
                    <td className="p-3 text-right">৳ {money(p.paidAmount)}</td>
                    <td className="p-3 capitalize">{p.paymentMethod}</td>
                    <td className="p-3">{p.transactionId || "-"}</td>
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

function InfoCard({ title, value, icon: Icon, success, warning, danger }) {
  return (
    <div
      className={`bg-white border rounded-[24px] p-5 shadow-sm ${
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
            className={`text-xl font-black mt-1 capitalize ${
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

        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Instruction({ title, children }) {
  return (
    <div className="border rounded-2xl p-4">
      <p className="font-black">{title}</p>
      <p className="text-gray-500 mt-1">{children}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}