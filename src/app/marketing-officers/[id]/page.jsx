"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

function money(value) {
  return Number(value || 0).toFixed(2);
}

export default function MarketingOfficerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketing-officers/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setDetails(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const officer = details?.officer;
  const summary = details?.summary || {};
  const ledger = details?.ledger || [];

  const totalCost = useMemo(() => {
    return (
      Number(summary.expenseAmount || 0) +
      Number(summary.salaryAmount || 0) +
      Number(summary.conveyanceAmount || 0) +
      Number(summary.commissionAmount || 0)
    );
  }, [summary]);

  if (loading) {
    return <div className="bg-white border rounded-[28px] p-5">Loading...</div>;
  }

  if (!officer) {
    return (
      <div className="bg-white border rounded-[28px] p-5">
        Marketing Officer not found.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <button
          onClick={() => router.push("/marketing-officers")}
          className="text-sm text-blue-600 font-semibold mb-3"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold">{officer.name}</h1>

        <p className="text-sm text-gray-500 mt-1">
          {officer.designation || "Marketing Officer"} •{" "}
          {officer.area || "No area"} • {officer.status}
        </p>

        <p className="text-sm text-gray-500 mt-1">
          {officer.phone || "No phone"} • {officer.email || "No email"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="Total Sales" value={`৳ ${money(summary.totalSales)}`} />
        <Card title="Cash Sales" value={`৳ ${money(summary.cashSales)}`} success />
        <Card title="Collection" value={`৳ ${money(summary.collectionAmount)}`} success />
        <Card title="Due" value={`৳ ${money(summary.dueAmount)}`} danger />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="Profit" value={`৳ ${money(summary.profitAmount)}`} success />
        <Card title="Salary" value={`৳ ${money(summary.salaryAmount)}`} />
        <Card title="Conveyance" value={`৳ ${money(summary.conveyanceAmount)}`} />
        <Card title="Commission" value={`৳ ${money(summary.commissionAmount)}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="Total Cost" value={`৳ ${money(totalCost)}`} danger />
        <Card
          title="Net Contribution"
          value={`৳ ${money(summary.netContribution)}`}
          success={Number(summary.netContribution || 0) >= 0}
          danger={Number(summary.netContribution || 0) < 0}
        />
        <Card title="Monthly Target" value={`৳ ${money(summary.monthlyTarget)}`} />
        <Card title="Achievement" value={`${summary.targetAchievement || 0}%`} success />
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold mb-3">Full Ledger</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-right">Sales</th>
                <th className="p-3 text-right">Collection</th>
                <th className="p-3 text-right">Due</th>
                <th className="p-3 text-right">Profit</th>
                <th className="p-3 text-right">Expense</th>
              </tr>
            </thead>

            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-5 text-center text-gray-500">
                    No ledger found.
                  </td>
                </tr>
              ) : (
                ledger.map((item) => {
                  const expense =
                    Number(item.expenseAmount || 0) +
                    Number(item.salaryAmount || 0) +
                    Number(item.conveyanceAmount || 0) +
                    Number(item.commissionAmount || 0);

                  return (
                    <tr key={item._id} className="border-t">
                      <td className="p-3">{String(item.date || "").slice(0, 10)}</td>
                      <td className="p-3 capitalize">{item.type}</td>
                      <td className="p-3">{item.invoiceNo || "-"}</td>
                      <td className="p-3">{item.customerName || "-"}</td>
                      <td className="p-3 text-right">৳ {money(item.totalSales)}</td>
                      <td className="p-3 text-right">৳ {money(item.collectionAmount)}</td>
                      <td className="p-3 text-right">৳ {money(item.dueAmount)}</td>
                      <td className="p-3 text-right">৳ {money(item.profitAmount)}</td>
                      <td className="p-3 text-right">৳ {money(expense)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, success, danger }) {
  return (
    <div
      className={`bg-white border rounded-[24px] p-4 shadow-sm ${
        success ? "border-green-100" : ""
      } ${danger ? "border-red-100" : ""}`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-lg font-bold mt-1 ${
          success ? "text-green-600" : danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}