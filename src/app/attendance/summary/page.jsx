"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, WalletCards } from "lucide-react";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AttendanceSummaryPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/attendance/summary?month=${month}&q=${encodeURIComponent(search)}`,
        { credentials: "include" }
      );

      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        alert(json.message || "Failed to load summary");
      }
    } catch (error) {
      alert(error.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const generateSalary = async () => {
    const ok = confirm(
      `Are you sure? Salary will be generated from attendance for ${month}.`
    );

    if (!ok) return;

    try {
      setGenerating(true);

      const res = await fetch("/api/salary/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          month,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Salary generate failed");
      }

      alert(
        `Salary generated successfully. Generated: ${json.data.generatedCount}, Skipped: ${json.data.skippedCount}`
      );
    } catch (error) {
      alert(error.message || "Salary generate failed");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [month]);

  const rows = data?.rows || [];
  const summary = data?.summary || {};

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;

    return rows.filter((r) =>
      [r.employeeName, r.employeeCode, r.designation, r.department]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Attendance Monthly Summary</h1>
            <p className="text-sm text-gray-500 mt-1">
              Present, absent, late, overtime and estimated salary calculation.
            </p>
          </div>

          <button
            onClick={loadSummary}
            className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-white border rounded-2xl p-4 outline-none"
        />

        <div className="relative md:col-span-2">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadSummary();
            }}
            placeholder="Search employee, code, department..."
            className="bg-white border rounded-2xl pl-10 pr-4 py-4 w-full outline-none"
          />
        </div>

        <button
          onClick={loadSummary}
          className="bg-blue-600 text-white rounded-2xl px-4 py-3 font-semibold"
        >
          Search
        </button>

        <button
          onClick={generateSalary}
          disabled={generating}
          className="bg-green-600 text-white rounded-2xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <WalletCards size={16} />
          {generating ? "Generating..." : "Generate Salary"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Summary title="Total Employee" value={summary.totalEmployee || 0} />
        <Summary
          title="Basic Salary"
          value={`৳ ${money(summary.totalBasicSalary)}`}
        />
        <Summary
          title="Absent Deduction"
          value={`৳ ${money(summary.totalAbsentDeduction)}`}
          danger
        />
        <Summary
          title="Overtime"
          value={`৳ ${money(summary.totalOvertimeAmount)}`}
          success
        />
        <Summary
          title="Estimated Salary"
          value={`৳ ${money(summary.totalEstimatedSalary)}`}
          highlight
        />
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold mb-3">
          {loading ? "Loading..." : "Employee Attendance Summary"}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1300px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-right">Present</th>
                <th className="p-3 text-right">Late</th>
                <th className="p-3 text-right">Leave</th>
                <th className="p-3 text-right">Half Day</th>
                <th className="p-3 text-right">Absent</th>
                <th className="p-3 text-right">Late Min</th>
                <th className="p-3 text-right">OT Min</th>
                <th className="p-3 text-right">Basic</th>
                <th className="p-3 text-right">Deduction</th>
                <th className="p-3 text-right">Overtime</th>
                <th className="p-3 text-right">Estimated</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="14" className="p-5 text-center text-gray-500">
                    No attendance summary found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.employeeId} className="border-t">
                    <td className="p-3 font-semibold">{r.employeeName}</td>
                    <td className="p-3">{r.employeeCode || "-"}</td>
                    <td className="p-3">{r.department || "-"}</td>
                    <td className="p-3 text-right">{r.presentDays}</td>
                    <td className="p-3 text-right">{r.lateDays}</td>
                    <td className="p-3 text-right">{r.leaveDays}</td>
                    <td className="p-3 text-right">{r.halfDays}</td>
                    <td className="p-3 text-right text-red-600">
                      {Number(r.absentDays || 0).toFixed(1)}
                    </td>
                    <td className="p-3 text-right">{r.lateMinutes}</td>
                    <td className="p-3 text-right">{r.overtimeMinutes}</td>
                    <td className="p-3 text-right">৳ {money(r.basicSalary)}</td>
                    <td className="p-3 text-right text-red-600">
                      ৳{" "}
                      {money(
                        Number(r.absentDeduction || 0) +
                          Number(r.lateDeduction || 0)
                      )}
                    </td>
                    <td className="p-3 text-right text-green-600">
                      ৳ {money(r.overtimeAmount)}
                    </td>
                    <td className="p-3 text-right font-bold text-blue-600">
                      ৳ {money(r.estimatedSalary)}
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

function Summary({ title, value, success, danger, highlight }) {
  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm ${
        highlight ? "bg-blue-600 text-white" : ""
      }`}
    >
      <p className={`text-xs ${highlight ? "text-blue-50" : "text-gray-500"}`}>
        {title}
      </p>

      <h3
        className={`text-lg font-bold mt-1 ${
          highlight
            ? "text-white"
            : success
            ? "text-green-600"
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