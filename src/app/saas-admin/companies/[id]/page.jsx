"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCcw,
  CheckCircle,
  Lock,
  Unlock,
  AlertTriangle,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

export default function SaasCompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id;

  const [company, setCompany] = useState(null);
  const [recentLogins, setRecentLogins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
const [deleteConfirm, setDeleteConfirm] = useState("");
const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    monthlyFee: "",
    subscriptionPlan: "free",
    nextBillingDate: "",
    billingDay: 30,
    graceUntil: "",
    promisePaymentDate: "",
    adminGraceNote: "",
  });

  const loadCompany = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/saas/admin/companies?showArchived=true", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Company load failed");
      }

      const companies = data.data?.companies || [];
      const found = companies.find(
        (c) => String(c._id || c.id) === String(companyId)
      );

      if (!found) {
        throw new Error("Company not found");
      }

      setCompany(found);
      setRecentLogins(
        (data.data?.recentLogins || []).filter(
          (l) => String(l.companyId) === String(companyId)
        )
      );

      setForm({
        monthlyFee: found.monthlyFee || "",
        subscriptionPlan: found.subscriptionPlan || "free",
        nextBillingDate: found.nextBillingDate || "",
        billingDay: found.billingDay || 30,
        graceUntil: found.graceUntil || "",
        promisePaymentDate: found.promisePaymentDate || "",
        adminGraceNote: found.adminGraceNote || "",
      });
    } catch (error) {
      alert(error.message || "Company load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) loadCompany();
  }, [companyId]);

  const updateCompany = async (action, extra = {}) => {
    try {
      const res = await fetch("/api/saas/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyId,
          action,
          ...extra,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Action failed");
      }

      alert(data.message || "Updated successfully");
      loadCompany();
    } catch (error) {
      alert(error.message || "Action failed");
    }
  };

  const resetPassword = async () => {
  try {
    const res = await fetch(
      `/api/saas/admin/companies/${companyId}/reset-password`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message);
    }

    alert(
      `Email: ${data.data?.ownerEmail || "-"}
Phone: ${data.data?.ownerPhone || "-"}
Password: 123456`
    );
  } catch (error) {
    alert(error.message);
  }
};

const loginAsCompany = async () => {
  try {
    const res = await fetch(
      `/api/saas/admin/companies/${companyId}/login-as`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message);
    }

    localStorage.setItem(
      "user",
      JSON.stringify(data.data)
    );

    localStorage.setItem(
      "companies",
      JSON.stringify(data.data.companies || [])
    );

    localStorage.setItem(
      "activeCompany",
      JSON.stringify(data.data.company)
    );

    localStorage.setItem(
      "selectedCompany",
      JSON.stringify(data.data.company)
    );

    localStorage.setItem(
      "selectedCompanyId",
      data.data.companyId
    );

    window.location.href = "/dashboard";
  } catch (error) {
    alert(error.message);
  }
};

const permanentDeleteCompany = async () => {
  if (deleteConfirm !== "DELETE COMPANY DATA") {
    return alert("Type DELETE COMPANY DATA to confirm");
  }

  try {
    setDeleting(true);

    const res = await fetch("/api/company/permanent-delete", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyId,
        confirm: deleteConfirm,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Permanent delete failed");
    }

    alert("Company permanently deleted.");

    router.push("/saas-admin/companies");
  } catch (error) {
    alert(error.message || "Permanent delete failed");
  } finally {
    setDeleting(false);
    setDeleteOpen(false);
  }
};


  const statusClass = useMemo(() => {
    const status = company?.subscriptionStatus;
    if (status === "active") return "bg-green-50 text-green-700";
    if (status === "due" || status === "warning")
      return "bg-yellow-50 text-yellow-700";
    if (status === "expired" || status === "suspended")
      return "bg-red-50 text-red-700";
    return "bg-blue-50 text-blue-700";
  }, [company]);

  if (!company) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 border px-4 py-2 rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-white border rounded-3xl p-8 text-center">
          {loading ? "Loading company..." : "Company not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/saas-admin/companies")}
              className="mb-3 border px-4 py-2 rounded-xl inline-flex items-center gap-2 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back to Companies
            </button>

            <h1 className="text-2xl font-black">{company.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {company.companyCode || "-"} • {company.phone || "-"} •{" "}
              {company.email || "-"}
            </p>
          </div>

          <button
            onClick={loadCompany}
            className="border px-4 py-2 rounded-xl inline-flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Plan" value={company.subscriptionPlan || "free"} />
        <Card
          title="Monthly Fee"
          value={`৳ ${money(company.monthlyFee)}`}
        />
        <Card title="Payment" value={company.paymentStatus || "unpaid"} />
        <Card
          title="Status"
          value={company.subscriptionStatus || "trial"}
          className={statusClass}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Company Information</h2>

          <Info label="Company Name" value={company.name} />
          <Info label="Legal Name" value={company.legalName} />
          <Info label="Company Code" value={company.companyCode} />
          <Info label="Phone" value={company.phone} />
          <Info label="Email" value={company.email} />
          <Info label="Address" value={company.address} />
          <Info label="Website" value={company.website} />
          <Info label="Setup Completed" value={company.setupCompleted ? "Yes" : "No"} />
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Owner Information</h2>

          <Info label="Owner Name" value={company.ownerName} />
          <Info label="Owner Phone" value={company.ownerPhone} />
          <Info label="Service Locked" value={company.serviceLocked ? "Yes" : "No"} />
          <Info label="Lock Reason" value={company.lockReason} />
          <Info label="Grace Active" value={company.graceActive ? "Yes" : "No"} />
          <Info label="Grace Until" value={company.graceUntil} />
          <Info label="Next Billing Date" value={company.nextBillingDate} />
          <Info label="Last Paid Date" value={company.lastPaidDate} />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Manage Subscription</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Field
            label="Monthly Fee"
            value={form.monthlyFee}
            onChange={(v) => setForm({ ...form, monthlyFee: v })}
          />

          <div>
            <p className="text-xs text-gray-500 mb-1">Plan</p>
            <select
              value={form.subscriptionPlan}
              onChange={(e) =>
                setForm({ ...form, subscriptionPlan: e.target.value })
              }
              className="w-full border rounded-xl p-3 bg-white"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <Field
            label="Next Billing Date"
            type="date"
            value={form.nextBillingDate}
            onChange={(v) => setForm({ ...form, nextBillingDate: v })}
          />

          <Field
            label="Billing Day"
            type="number"
            value={form.billingDay}
            onChange={(v) => setForm({ ...form, billingDay: v })}
          />

          <Field
            label="Grace Until"
            type="date"
            value={form.graceUntil}
            onChange={(v) => setForm({ ...form, graceUntil: v })}
          />

          <Field
            label="Promise Payment Date"
            type="date"
            value={form.promisePaymentDate}
            onChange={(v) => setForm({ ...form, promisePaymentDate: v })}
          />

          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 mb-1">Grace Note</p>
            <textarea
              value={form.adminGraceNote}
              onChange={(e) =>
                setForm({ ...form, adminGraceNote: e.target.value })
              }
              className="w-full border rounded-xl p-3 min-h-[90px]"
            />
          </div>
        </div>


        <div className="flex flex-wrap gap-2 mt-5">

               <button
    onClick={loginAsCompany}
    className="bg-purple-600 text-white px-4 py-2 rounded-xl"
  >
    Login As Company
  </button>

  <button
    onClick={resetPassword}
    className="bg-orange-500 text-white px-4 py-2 rounded-xl"
  >
    Reset Password
  </button>


          <button
            onClick={() =>
              updateCompany("update_plan", {
                subscriptionPlan: form.subscriptionPlan,
                monthlyFee: Number(form.monthlyFee || 0),
                nextBillingDate: form.nextBillingDate,
                billingDay: Number(form.billingDay || 30),
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Update Plan
          </button>

          <button
            onClick={() =>
              updateCompany("mark_paid", {
                amount: Number(form.monthlyFee || company.monthlyFee || 0),
                paidAmount: Number(form.monthlyFee || company.monthlyFee || 0),
                paymentMethod: "manual",
              })
            }
            className="bg-green-600 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Mark Paid
          </button>

          <button
            onClick={() => {
              if (!form.graceUntil) return alert("Grace until date required");
              updateCompany("grace", {
                graceUntil: form.graceUntil,
                promisePaymentDate: form.promisePaymentDate || form.graceUntil,
                adminGraceNote: form.adminGraceNote,
              });
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            Give Grace
          </button>

          {company.serviceLocked ? (
            <button
              onClick={() => updateCompany("unlock")}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
            >
              <Unlock size={16} />
              Unlock
            </button>
          ) : (
            <button
              onClick={() =>
                updateCompany("lock", {
                  lockReason:
                    "Subscription expired. Please pay your bill to continue service.",
                })
              }
              className="bg-red-600 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
            >
              <Lock size={16} />
              Lock
            </button>
          )}

                    {company.isDeleted ? (
            <button
              onClick={() => updateCompany("restore")}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Restore
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm(`Archive ${company.name}? Data will remain safe.`)) {
                  updateCompany("archive");
                }
              }}
              className="bg-slate-700 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
            >
              <Archive size={16} />
              Archive
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 border-2 border-red-200 bg-red-50 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
          <Trash2 size={22} />
          Danger Zone
        </h3>

        <p className="text-sm text-red-600 mt-2">
          Permanently delete this company and all related data. This action
          cannot be undone.
        </p>

        <button
          onClick={() => setDeleteOpen(true)}
          className="mt-5 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <Trash2 size={18} />
          Permanent Delete Company
        </button>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Recent Login Logs</h2>

        {recentLogins.length === 0 ? (
          <p className="text-sm text-gray-500">No login logs found.</p>
        ) : (
          <div className="space-y-2">
            {recentLogins.map((log) => (
              <div key={log._id} className="border rounded-2xl p-3">
                <p className="font-semibold">{log.userName || "-"}</p>
                <p className="text-xs text-gray-500">
                  {log.role || "-"} • {log.ip || "-"} • {log.device || "-"} •{" "}
                  {log.browser || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-red-600">
              Permanent Delete Company
            </h2>

            <p className="mt-3 text-sm text-gray-600">
              This will permanently delete company and all related data.
            </p>

            <p className="mt-5 text-sm font-semibold">
              Type: <span className="text-red-600">DELETE COMPANY DATA</span>
            </p>

            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="mt-2 w-full border rounded-xl p-3"
              placeholder="DELETE COMPANY DATA"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteOpen(false)}
                className="border px-5 py-2 rounded-xl"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                onClick={permanentDeleteCompany}
                className="bg-red-600 text-white px-5 py-2 rounded-xl disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanent Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function Card({ title, value, className = "" }) {
  return (
    <div className={`bg-white border rounded-[22px] p-4 shadow-sm ${className}`}>
      <p className="text-xs opacity-70">{title}</p>
      <h3 className="text-xl font-black mt-1 capitalize">{value}</h3>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-right">{value || "-"}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}