"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SaasAdminPage() {
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState({});
  const [recentLogins, setRecentLogins] = useState([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);

      const res = await fetch(`/api/saas/admin/companies?${params}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      setCompanies(data.data?.companies || []);
      setSummary(data.data?.summary || {});
      setRecentLogins(data.data?.recentLogins || []);
    } catch (error) {
      alert(error.message || "Failed to load SaaS admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const text = q.toLowerCase();
    return companies
      .filter((c) =>
        [c.name, c.companyCode, c.phone, c.email, c.ownerName, c.ownerPhone]
          .join(" ")
          .toLowerCase()
          .includes(text)
      )
      .slice(0, 8);
  }, [q, companies]);

  const updateCompany = async (payload) => {
    try {
      const res = await fetch("/api/saas/admin/companies", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      alert("Updated successfully");
      setSelected(null);
      await loadCompanies();
    } catch (error) {
      alert(error.message || "Update failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">SeeERP SaaS Admin</h1>
            <p className="text-sm text-gray-500 mt-1">
              Company subscription, payment, grace, lock/unlock and login monitoring.
            </p>
          </div>

          <button
            onClick={loadCompanies}
            className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card title="Total Companies" value={summary.totalCompanies || 0} />
        <Card title="Active" value={summary.activeCompanies || 0} success />
        <Card title="Due" value={summary.dueCompanies || 0} warning />
        <Card title="Warning" value={summary.warningCompanies || 0} warning />
        <Card title="Expired" value={summary.expiredCompanies || 0} danger />
        <Card title="Locked" value={summary.lockedCompanies || 0} danger />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Monthly Revenue" value={`৳ ${money(summary.monthlyRevenue)}`} success />
        <Card title="Pending Payment" value={`৳ ${money(summary.pendingPayment)}`} warning />
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Auto search company, code, phone, email, owner..."
              className="w-full border rounded-xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
                {suggestions.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      setQ(c.name);
                      setSelected(c);
                    }}
                    className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                  >
                    <p className="font-bold">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {c.companyCode} • {c.phone || "-"} • {c.subscriptionStatus}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-xl p-3 bg-white"
          >
            <option value="">All Status</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="due">Due</option>
            <option value="warning">Warning</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={loadCompanies}
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
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Plan</th>
                <th className="p-3 text-right">Monthly Fee</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Grace</th>
                <th className="p-3 text-left">Next Bill</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">
                    No company found.
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-3">
                      <p className="font-bold">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        {c.companyCode} • {c.phone || "-"} • {c.email || "-"}
                      </p>
                    </td>
                    <td className="p-3">
                      <p>{c.ownerName || "-"}</p>
                      <p className="text-xs text-gray-500">{c.ownerPhone || "-"}</p>
                    </td>
                    <td className="p-3 capitalize">{c.subscriptionPlan}</td>
                    <td className="p-3 text-right">৳ {money(c.monthlyFee)}</td>
                    <td className="p-3 capitalize">{c.paymentStatus}</td>
                    <td className="p-3 capitalize">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge(c.subscriptionStatus)}`}>
                        {c.subscriptionStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      {c.graceActive ? (
                        <span className="text-yellow-600 font-semibold">
                          Until {c.graceUntil}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">{c.nextBillingDate || "-"}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelected(c)}
                          className="border px-3 py-2 rounded-xl hover:bg-gray-50"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() =>
                            updateCompany({
                              companyId: c._id,
                              action: "mark_paid",
                              amount: c.monthlyFee,
                              paymentMethod: "manual",
                            })
                          }
                          className="bg-green-600 text-white px-3 py-2 rounded-xl"
                        >
                          Paid
                        </button>
                        {c.serviceLocked ? (
                          <button
                            onClick={() =>
                              updateCompany({ companyId: c._id, action: "unlock" })
                            }
                            className="bg-blue-600 text-white px-3 py-2 rounded-xl"
                          >
                            Unlock
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              updateCompany({ companyId: c._id, action: "lock" })
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded-xl"
                          >
                            Lock
                          </button>
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

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold mb-3">Recent Login Logs</h2>

        <div className="space-y-2">
          {recentLogins.length === 0 ? (
            <p className="text-sm text-gray-500">No login logs found.</p>
          ) : (
            recentLogins.slice(0, 10).map((log) => (
              <div key={log._id} className="border rounded-2xl p-3">
                <p className="font-semibold">{log.companyName || "Unknown Company"}</p>
                <p className="text-xs text-gray-500">
                  {log.userName || "-"} • {log.role || "-"} • {log.ip || "-"} •{" "}
                  {log.device || "-"} • {log.browser || "-"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <ManageModal
          company={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateCompany}
        />
      )}
    </div>
  );
}

function ManageModal({ company, onClose, onUpdate }) {
  const [form, setForm] = useState({
    monthlyFee: company.monthlyFee || "",
    subscriptionPlan: company.subscriptionPlan || "free",
    nextBillingDate: company.nextBillingDate || "",
    billingDay: company.billingDay || 30,
    graceUntil: company.graceUntil || "",
    promisePaymentDate: company.promisePaymentDate || "",
    adminGraceNote: company.adminGraceNote || "",
    transactionId: "",
    paymentMethod: "manual",
  });

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] overflow-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">{company.name}</h2>
            <p className="text-sm text-gray-500">
              {company.companyCode} • {company.subscriptionStatus}
            </p>
          </div>

          <button onClick={onClose} className="w-10 h-10 rounded-full border">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monthly Fee"
              value={form.monthlyFee}
              onChange={(v) => setForm((p) => ({ ...p, monthlyFee: v }))}
            />

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Plan
              </label>
              <select
                value={form.subscriptionPlan}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subscriptionPlan: e.target.value }))
                }
                className="border p-3 rounded-xl w-full bg-white"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <Input
              type="date"
              label="Next Billing Date"
              value={form.nextBillingDate}
              onChange={(v) => setForm((p) => ({ ...p, nextBillingDate: v }))}
            />

            <Input
              label="Billing Day"
              value={form.billingDay}
              onChange={(v) => setForm((p) => ({ ...p, billingDay: v }))}
            />

            <Input
              type="date"
              label="Grace Until"
              value={form.graceUntil}
              onChange={(v) => setForm((p) => ({ ...p, graceUntil: v }))}
            />

            <Input
              type="date"
              label="Promise Payment Date"
              value={form.promisePaymentDate}
              onChange={(v) =>
                setForm((p) => ({ ...p, promisePaymentDate: v }))
              }
            />
          </div>

          <textarea
            value={form.adminGraceNote}
            onChange={(e) =>
              setForm((p) => ({ ...p, adminGraceNote: e.target.value }))
            }
            placeholder="Admin grace note"
            className="border p-3 rounded-xl w-full min-h-[90px]"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                onUpdate({
                  companyId: company._id,
                  action: "update_plan",
                  subscriptionPlan: form.subscriptionPlan,
                  monthlyFee: Number(form.monthlyFee || 0),
                  nextBillingDate: form.nextBillingDate,
                  billingDay: Number(form.billingDay || 30),
                })
              }
              className="border rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Update Plan
            </button>

            <button
              onClick={() =>
                onUpdate({
                  companyId: company._id,
                  action: "grace",
                  graceUntil: form.graceUntil,
                  promisePaymentDate: form.promisePaymentDate || form.graceUntil,
                  adminGraceNote: form.adminGraceNote,
                })
              }
              className="bg-yellow-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Clock size={16} />
              Give Grace
            </button>

            <button
              onClick={() =>
                onUpdate({
                  companyId: company._id,
                  action: "mark_paid",
                  amount: Number(form.monthlyFee || company.monthlyFee || 0),
                  paidAmount: Number(form.monthlyFee || company.monthlyFee || 0),
                  paymentMethod: form.paymentMethod,
                  transactionId: form.transactionId,
                })
              }
              className="bg-green-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Unlock size={16} />
              Mark Paid
            </button>

            <button
              onClick={() =>
                onUpdate({
                  companyId: company._id,
                  action: "lock",
                  lockReason:
                    "Subscription expired. Please pay your bill to continue service.",
                })
              }
              className="bg-red-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              Lock Service
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 flex gap-2">
            <ShieldAlert size={18} />
            <p>
              Grace দিলে customer date পর্যন্ত software ব্যবহার করতে পারবে। Date
              পার হলে auto lock হবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, success, warning, danger }) {
  return (
    <div
      className={`bg-white border rounded-[22px] p-4 shadow-sm ${
        success ? "border-green-100" : warning ? "border-yellow-100" : danger ? "border-red-100" : ""
      }`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-xl font-black mt-1 ${
          success ? "text-green-600" : warning ? "text-yellow-600" : danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">
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

function badge(status) {
  if (status === "active") return "bg-green-50 text-green-600";
  if (status === "due") return "bg-yellow-50 text-yellow-600";
  if (status === "warning") return "bg-orange-50 text-orange-600";
  if (status === "expired" || status === "suspended")
    return "bg-red-50 text-red-600";
  return "bg-blue-50 text-blue-600";
}