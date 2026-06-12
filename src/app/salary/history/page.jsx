"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, ReceiptText, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SalaryHistoryPage() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [approving, setApproving] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/salary/history?month=${month}&q=${encodeURIComponent(search)}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data.success) {
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error("SALARY_HISTORY_LOAD_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveSelected = async () => {
    if (!selectedIds.length) {
      return alert("Select salary records first");
    }

    const ok = confirm(`Approve ${selectedIds.length} salary record(s)?`);
    if (!ok) return;

    try {
      setApproving(true);

      const res = await fetch("/api/salary/approval", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          salaryIds: selectedIds,
          approvalStatus: "approved",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Salary approval failed");
      }

      alert("Salary approved successfully");

      setSelectedIds([]);
      await loadHistory();
    } catch (error) {
      alert(error.message || "Salary approval failed");
    } finally {
      setApproving(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [month]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return payments;

    return payments.filter((p) =>
      [
        p.employeeName,
        p.employeeCode,
        p.transactionNo,
        p.paymentMethod,
        p.paymentStatus,
        p.approvalStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payments, search]);

  const totalPaid = filtered.reduce(
    (sum, p) => sum + Number(p.paidAmount || 0),
    0
  );

  const allSelected =
    filtered.length > 0 && selectedIds.length === filtered.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((x) => x._id));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Salary Payment History</h1>
            <p className="text-sm text-gray-500 mt-1">
              Paid salary records, batch number, approval status and salary slip.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={approveSelected}
              disabled={approving || selectedIds.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              {approving
                ? "Approving..."
                : `Approve Selected (${selectedIds.length})`}
            </button>

            <button
              onClick={loadHistory}
              className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs text-gray-500">Total Records</p>
          <h3 className="text-xl font-bold">{filtered.length}</h3>
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs text-gray-500">Total Paid</p>
          <h3 className="text-xl font-bold text-green-600">
            ৳ {money(totalPaid)}
          </h3>
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setSelectedIds([]);
          }}
          className="bg-white border rounded-2xl p-4 outline-none"
        />

        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIds([]);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadHistory();
            }}
            placeholder="Search employee, batch..."
            className="bg-white border rounded-2xl pl-10 pr-4 py-4 w-full outline-none"
          />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold mb-3">
          {loading ? "Loading..." : "Salary Records"}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1280px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Month</th>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Employee Code</th>
                <th className="p-3 text-left">Batch No</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-right">Basic</th>
                <th className="p-3 text-right">Bonus</th>
                <th className="p-3 text-right">Deduction</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-left">Payment Status</th>
                <th className="p-3 text-left">Approval Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="14" className="p-5 text-center text-gray-500">
                    No salary payment found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const deduction =
                    Number(p.absentDeduction || 0) +
                    Number(p.advanceDeduction || 0) +
                    Number(p.loanDeduction || 0);

                  return (
                    <tr key={p._id} className="border-t">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p._id)}
                          onChange={() => toggleOne(p._id)}
                        />
                      </td>

                      <td className="p-3">{p.date || "-"}</td>
                      <td className="p-3">{p.month}</td>
                      <td className="p-3 font-semibold">{p.employeeName}</td>
                      <td className="p-3">{p.employeeCode || "-"}</td>
                      <td className="p-3">{p.transactionNo || "-"}</td>
                      <td className="p-3 capitalize">{p.paymentMethod}</td>

                      <td className="p-3 text-right">
                        ৳ {money(p.basicSalary)}
                      </td>

                      <td className="p-3 text-right">
                        ৳ {money(p.bonusAmount)}
                      </td>

                      <td className="p-3 text-right text-red-600">
                        ৳ {money(deduction)}
                      </td>

                      <td className="p-3 text-right font-bold text-green-600">
                        ৳ {money(p.paidAmount)}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            p.paymentStatus === "paid"
                              ? "bg-green-50 text-green-600"
                              : p.paymentStatus === "partial"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            p.approvalStatus === "paid"
                              ? "bg-green-50 text-green-600"
                              : p.approvalStatus === "approved"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {p.approvalStatus || "draft"}
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => router.push(`/salary/slip/${p._id}`)}
                          className="border px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-50 flex items-center gap-1"
                        >
                          <ReceiptText size={14} />
                          Slip
                        </button>
                      </td>
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