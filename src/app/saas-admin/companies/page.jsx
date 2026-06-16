"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  RefreshCcw,
  AlertTriangle,
  Lock,
  CheckCircle,
} from "lucide-react";

function normalizeCompanies(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.companies)) return payload.data.companies;
  if (Array.isArray(payload?.companies)) return payload.companies;

  return [];
}

export default function SaasCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadCompanies = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/saas/admin/companies", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setCompanies(normalizeCompanies(data));
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error("SAAS_COMPANY_LOAD_ERROR:", error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(companies) ? companies : [];
    const q = search.toLowerCase();

    return list.filter((c) =>
      [
        c?.name,
        c?.companyCode,
        c?.ownerName,
        c?.email,
        c?.phone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [companies, search]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Company Control</h1>
            <p className="text-gray-500 mt-1">Manage all SaaS companies</p>
          </div>

          <button
            onClick={loadCompanies}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border p-5">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, owner, email, phone..."
            className="w-full border rounded-xl py-3 pl-10 pr-4"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Company</th>
                <th className="p-4 text-left">Owner</th>
                <th className="p-4 text-left">Plan</th>
                <th className="p-4 text-left">Monthly Fee</th>
                <th className="p-4 text-left">Payment</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Grace</th>
                <th className="p-4 text-left">Next Bill</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((company) => (
                <tr key={company._id || company.id} className="border-t">
                  <td className="p-4">
                    <div>
                      <p className="font-bold">{company.name}</p>
                      <p className="text-xs text-gray-500">
                        {company.companyCode || "-"}
                      </p>
                    </div>
                  </td>

                  <td className="p-4">{company.ownerName || "-"}</td>

                  <td className="p-4 capitalize">
                    {company.subscriptionPlan || "free"}
                  </td>

                  <td className="p-4">৳ {company.monthlyFee || 0}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        company.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {company.paymentStatus || "unpaid"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        company.subscriptionStatus === "active"
                          ? "bg-green-100 text-green-700"
                          : company.subscriptionStatus === "warning"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {company.subscriptionStatus || "inactive"}
                    </span>
                  </td>

                  <td className="p-4">
                    {company.graceActive ? (
                      <span className="text-green-600 font-semibold">
                        Active
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-4">{company.nextBillingDate || "-"}</td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2 flex-wrap">
                      <button className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs">
                        Manage
                      </button>

                      <button className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs flex items-center gap-1">
                        <CheckCircle size={12} />
                        Paid
                      </button>

                      <button className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs flex items-center gap-1">
                        <Lock size={12} />
                        Lock
                      </button>

                      <button className="px-3 py-1 rounded-lg bg-yellow-500 text-white text-xs flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Grace
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td colSpan={9} className="text-center p-10 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 size={40} />
                      {loading ? "Loading..." : "No companies found"}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}