"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, Save } from "lucide-react";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function EmployeeLoansPage() {
  const [employees, setEmployees] = useState([]);
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({});

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("open");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    loanAmount: "",
    monthlyInstallment: "",
    issueDate: new Date().toISOString().slice(0, 10),
    startMonth: new Date().toISOString().slice(0, 7),
    paymentMethod: "cash",
    bankId: "",
    reason: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLoans = async (q = search) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/employee-loans?q=${encodeURIComponent(q || "")}&status=${status}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data.success) {
        setEmployees(data.data.employees || []);
        setLoans(data.data.loans || []);
        setSummary(data.data.summary || {});
      }
    } catch (error) {
      console.error("EMPLOYEE_LOAN_LOAD_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans("");
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLoans(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const saveLoan = async () => {
    if (!selectedEmployee?._id) {
      return alert("Select employee first");
    }

    if (!form.loanAmount || Number(form.loanAmount) <= 0) {
      return alert("Valid loan amount required");
    }

    try {
      setSaving(true);

      const res = await fetch("/api/employee-loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          employeeId: selectedEmployee._id,
          loanAmount: Number(form.loanAmount || 0),
          monthlyInstallment: Number(form.monthlyInstallment || 0),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Loan save failed");
      }

      alert("Employee loan saved");

      setSelectedEmployee(null);
      setSearch("");
      setForm({
        loanAmount: "",
        monthlyInstallment: "",
        issueDate: new Date().toISOString().slice(0, 10),
        startMonth: new Date().toISOString().slice(0, 7),
        paymentMethod: "cash",
        bankId: "",
        reason: "",
        note: "",
      });

      await loadLoans("");
    } catch (error) {
      alert(error.message || "Loan save failed");
    } finally {
      setSaving(false);
    }
  };

  const filteredLoans = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return loans;

    return loans.filter((l) =>
      [l.loanNo, l.employeeName, l.employeeCode, l.reason, l.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [loans, search]);

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Employee Loan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Issue employee loan, track balance and auto deduct from salary.
            </p>
          </div>

          <button
            onClick={() => loadLoans(search)}
            className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Summary title="Total Loan" value={`৳ ${money(summary.totalLoan)}`} />
        <Summary title="Paid" value={`৳ ${money(summary.paidAmount)}`} success />
        <Summary
          title="Remaining"
          value={`৳ ${money(summary.remainingAmount)}`}
          danger
        />
        <Summary title="Open Loan" value={summary.openLoan || 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[430px_1fr] gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
          <h2 className="font-bold">Issue New Loan</h2>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name, phone, code..."
              className="w-full border rounded-2xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {search && employees.length > 0 && (
            <div className="border rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              {employees.map((emp) => (
                <button
                  key={emp._id}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setSearch(emp.name);
                  }}
                  className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                >
                  <p className="font-semibold">{emp.name}</p>
                  <p className="text-xs text-gray-500">
                    {emp.employeeCode || "No code"} • {emp.phone || "No phone"} •{" "}
                    {emp.designation || "No designation"}
                  </p>
                </button>
              ))}
            </div>
          )}

          {selectedEmployee && (
            <div className="border rounded-2xl p-4 bg-blue-50">
              <p className="text-xs text-blue-600">Selected Employee</p>
              <h3 className="font-bold">{selectedEmployee.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedEmployee.employeeCode || "No code"} •{" "}
                {selectedEmployee.designation || "No designation"}
              </p>
            </div>
          )}

          <input
            type="number"
            value={form.loanAmount}
            onChange={(e) =>
              setForm((p) => ({ ...p, loanAmount: e.target.value }))
            }
            placeholder="Loan Amount"
            className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="number"
            value={form.monthlyInstallment}
            onChange={(e) =>
              setForm((p) => ({ ...p, monthlyInstallment: e.target.value }))
            }
            placeholder="Monthly Installment"
            className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, issueDate: e.target.value }))
              }
              className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            />

            <input
              type="month"
              value={form.startMonth}
              onChange={(e) =>
                setForm((p) => ({ ...p, startMonth: e.target.value }))
              }
              className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={form.paymentMethod}
            onChange={(e) =>
              setForm((p) => ({ ...p, paymentMethod: e.target.value }))
            }
            className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="mobile_banking">Mobile Banking</option>
          </select>

          <input
            value={form.bankId}
            onChange={(e) => setForm((p) => ({ ...p, bankId: e.target.value }))}
            placeholder="Bank ID (only for bank payment)"
            className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <input
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Loan reason"
            className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <textarea
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Note"
            className="border rounded-2xl p-3 w-full min-h-[90px] outline-none focus:ring-4 focus:ring-blue-100"
          />

          <button
            onClick={saveLoan}
            disabled={saving}
            className="bg-blue-600 text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Loan"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="font-bold">
              {loading ? "Loading..." : "Employee Loan List"}
            </h2>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded-xl px-3 py-2 outline-none"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Loan No</th>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-right">Loan</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Remaining</th>
                  <th className="p-3 text-right">Installment</th>
                  <th className="p-3 text-left">Start Month</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-5 text-center text-gray-500">
                      No employee loan found.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan._id} className="border-t">
                      <td className="p-3">{loan.loanNo || "-"}</td>
                      <td className="p-3 font-semibold">{loan.employeeName}</td>
                      <td className="p-3">{loan.employeeCode || "-"}</td>
                      <td className="p-3 text-right">
                        ৳ {money(loan.loanAmount)}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        ৳ {money(loan.paidAmount)}
                      </td>
                      <td className="p-3 text-right text-red-600">
                        ৳ {money(loan.remainingAmount)}
                      </td>
                      <td className="p-3 text-right">
                        ৳ {money(loan.monthlyInstallment)}
                      </td>
                      <td className="p-3">{loan.startMonth || "-"}</td>
                      <td className="p-3 capitalize">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs">
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ title, value, success, danger }) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-xl font-bold mt-1 ${
          success ? "text-green-600" : danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}