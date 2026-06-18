"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCcw,
  Search,
  Lock,
  Unlock,
  CheckCircle,
  Archive,
  RotateCcw,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

export default function SaasAdminPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState({});
  const [recentLogins, setRecentLogins] = useState([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (showArchived) params.set("showArchived", "true");

      const res = await fetch(`/api/saas/admin/companies?${params}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load SaaS admin");
      }

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

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const text = q.toLowerCase();

    return companies
      .filter((c) =>
        [
          c.name,
          c.companyCode,
          c.phone,
          c.email,
          c.ownerName,
          c.ownerPhone,
          c.subscriptionStatus,
          c.paymentStatus,
        ]
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

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed");
      }

      alert(data.message || "Updated successfully");
      await loadCompanies();
    } catch (error) {
      alert(error.message || "Update failed");
    }
  };

  const goManage = (company) => {
    const id = company?._id || company?.id;
    if (!id) return alert("Company ID not found");

    router.push(`/saas-admin/companies/${id}`);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">SeeERP SaaS Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Summary, company list, quick payment, lock/unlock and archive.
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

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
        <Card title="Total Companies" value={summary.totalCompanies || 0} />
        <Card title="Active" value={summary.activeCompanies || 0} success />
        <Card title="Due" value={summary.dueCompanies || 0} warning />
        <Card title="Warning" value={summary.warningCompanies || 0} warning />
        <Card title="Expired" value={summary.expiredCompanies || 0} danger />
        <Card title="Locked" value={summary.lockedCompanies || 0} danger />
        <Card title="Archived" value={summary.archivedCompanies || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card
          title="Monthly Revenue"
          value={`৳ ${money(summary.monthlyRevenue)}`}
          success
        />
        <Card
          title="Pending Payment"
          value={`৳ ${money(summary.pendingPayment)}`}
          warning
        />
        <Card
          title="Unpaid Amount"
          value={`৳ ${money(summary.unpaidAmount)}`}
          danger
        />
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

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
                    }}
                    className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                  >
                    <p className="font-bold">
                      {c.name}{" "}
                      {c.isDeleted && (
                        <span className="text-xs text-red-600">
                          (Archived)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.companyCode} • {c.phone || "-"} •{" "}
                      {c.subscriptionStatus}
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

          <label className="border rounded-xl px-4 py-3 bg-white flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show Archived
          </label>

          <button
            onClick={loadCompanies}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold"
          >
            Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
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
                <th className="p-3 text-center">Quick Actions</th>
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
                  <tr
                    key={c._id}
                    className={`border-t hover:bg-blue-50/40 ${
                      c.isDeleted ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="p-3">
                      <p className="font-bold">
                        {c.name}{" "}
                        {c.isDeleted && (
                          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                            Archived
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.companyCode} • {c.phone || "-"} • {c.email || "-"}
                      </p>
                    </td>

                    <td className="p-3">
                      <p>{c.ownerName || "-"}</p>
                      <p className="text-xs text-gray-500">
                        {c.ownerPhone || "-"}
                      </p>
                    </td>

                    <td className="p-3 capitalize">{c.subscriptionPlan}</td>
                    <td className="p-3 text-right">৳ {money(c.monthlyFee)}</td>
                    <td className="p-3 capitalize">{c.paymentStatus}</td>

                    <td className="p-3 capitalize">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${badge(
                          c.subscriptionStatus
                        )}`}
                      >
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
                          onClick={() => goManage(c)}
                          className="border px-3 py-2 rounded-xl hover:bg-gray-50"
                        >
                          Manage
                        </button>

                        {!c.isDeleted && (
                          <>
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
                                  updateCompany({
                                    companyId: c._id,
                                    action: "unlock",
                                  })
                                }
                                className="bg-blue-600 text-white px-3 py-2 rounded-xl"
                              >
                                Unlock
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateCompany({
                                    companyId: c._id,
                                    action: "lock",
                                  })
                                }
                                className="bg-red-600 text-white px-3 py-2 rounded-xl"
                              >
                                Lock
                              </button>
                            )}
                          </>
                        )}

                        {c.isDeleted ? (
                          <button
                            onClick={() =>
                              updateCompany({
                                companyId: c._id,
                                action: "restore",
                              })
                            }
                            className="bg-emerald-600 text-white px-3 py-2 rounded-xl flex items-center gap-1"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Archive ${c.name}? Data will remain safe.`
                                )
                              ) {
                                updateCompany({
                                  companyId: c._id,
                                  action: "archive",
                                });
                              }
                            }}
                            className="bg-slate-700 text-white px-3 py-2 rounded-xl flex items-center gap-1"
                          >
                            <Archive size={14} />
                            Archive
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
                <p className="font-semibold">
                  {log.companyName || "Unknown Company"}
                </p>
                <p className="text-xs text-gray-500">
                  {log.userName || "-"} • {log.role || "-"} • {log.ip || "-"} •{" "}
                  {log.device || "-"} • {log.browser || "-"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, success, warning, danger }) {
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
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-xl font-black mt-1 ${
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