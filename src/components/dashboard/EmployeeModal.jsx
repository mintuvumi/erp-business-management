"use client";

import { useEffect, useState } from "react";
import { X, Search, RefreshCcw, Wallet, Landmark, Gift, Clock } from "lucide-react";

export default function EmployeeModal({ open, onClose }) {
  const [data, setData] = useState({
    totalEmployee: 0,
    presentEmployee: 0,
    absentEmployee: 0,
    totalMonthlyLeave: 0,
    totalYearlyLeave: 0,
    salaryPaid: 0,
    salaryDue: 0,
    advanceOpen: 0,
    employees: [],
  });

  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  const [salaryForm, setSalaryForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    overtimeAmount: "",
    bonusAmount: "",
    absentDeduction: "",
    advanceDeduction: "",
    loanDeduction: "",
    bankId: "",
    note: "",
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: "",
    paidBy: "cash",
    bankId: "",
    note: "",
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      }

      const bankRes = await fetch("/api/bank");
      const bankJson = await bankRes.json();

      if (bankJson.success) {
        setBanks(bankJson.data.banks || []);
      }
    } catch (error) {
      console.error(error);
      alert("Employee data load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchEmployees();
  }, [open]);

  const paySalary = async (employee, method) => {
    try {
      setLoading(true);

      const res = await fetch("/api/salary/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee._id,
          month: salaryForm.month,
          overtimeAmount: Number(salaryForm.overtimeAmount) || 0,
          bonusAmount: Number(salaryForm.bonusAmount) || 0,
          absentDeduction: Number(salaryForm.absentDeduction) || 0,
          advanceDeduction: Number(salaryForm.advanceDeduction) || 0,
          loanDeduction: Number(salaryForm.loanDeduction) || 0,
          paymentMethod: method,
          bankId: method === "bank" ? salaryForm.bankId : "",
          note: salaryForm.note,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.message);

      alert("Salary paid ✅");
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      alert(error.message || "Salary payment failed");
    } finally {
      setLoading(false);
    }
  };

  const payAdvance = async (employee) => {
    if (!advanceForm.amount || Number(advanceForm.amount) <= 0) {
      return alert("Valid advance amount required");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/salary/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee._id,
          amount: Number(advanceForm.amount),
          paidBy: advanceForm.paidBy,
          bankId: advanceForm.paidBy === "bank" ? advanceForm.bankId : "",
          note: advanceForm.note,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.message);

      alert("Advance salary paid ✅");
      setAdvanceForm({ amount: "", paidBy: "cash", bankId: "", note: "" });
      fetchEmployees();
    } catch (error) {
      alert(error.message || "Advance salary failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-7xl max-h-[88vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-[32px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] animate-employeeFloat">
        <div className="p-5 md:p-7 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Employee Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Company Name • Company Address • Phone Number
            </p>
          </div>

          <button onClick={onClose} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 md:p-7 space-y-5 overflow-y-auto max-h-[calc(88vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            <button onClick={fetchEmployees} className="h-12 px-5 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600">
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat title="Total Employee" value={data.totalEmployee} />
            <Stat title="Present Employee" value={data.presentEmployee} />
            <Stat title="Absent Employee" value={data.absentEmployee} danger />
            <Stat title="Monthly Leave" value={data.totalMonthlyLeave} />
            <Stat title="Yearly Leave" value={data.totalYearlyLeave} />
            <Stat title="Salary Paid" value={`৳ ${money(data.salaryPaid)}`} />
            <Stat title="Salary Due" value={`৳ ${money(data.salaryDue)}`} danger />
            <Stat title="Open Advance" value={`৳ ${money(data.advanceOpen)}`} danger />
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-semibold">Employee Details</h3>
              <span className="text-xs text-gray-500">{data.employees?.length || 0} employee</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Designation</th>
                    <th className="p-3 text-right">Salary</th>
                    <th className="p-3 text-left">Method</th>
                    <th className="p-3 text-left">Bank A/C</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-right">Monthly Leave</th>
                    <th className="p-3 text-right">Yearly Leave</th>
                    <th className="p-3 text-left">Progress</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {data.employees?.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-6 text-center text-gray-500">
                        No employee found
                      </td>
                    </tr>
                  ) : (
                    data.employees?.map((e) => (
                      <tr key={e._id} className="border-t hover:bg-blue-50/40">
                        <td className="p-3 font-medium">{e.name}</td>
                        <td className="p-3">{e.designation || "-"}</td>
                        <td className="p-3 text-right">৳ {money(e.basicSalary)}</td>
                        <td className="p-3 capitalize">{e.paymentMethod}</td>
                        <td className="p-3">{e.bankAccountNo || "-"}</td>
                        <td className="p-3 text-center">
                          {e.presentToday ? "Present" : "Absent"}
                        </td>
                        <td className="p-3 text-right">{e.monthlyLeave}</td>
                        <td className="p-3 text-right">{e.yearlyLeave}</td>
                        <td className="p-3 capitalize">{e.workProgress}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedEmployee(e)}
                            className="px-3 py-1.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                          >
                            Details / Pay
                          </button>
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

      {selectedEmployee && (
        <div className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-[28px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden">
            <div className="p-5 border-b flex justify-between">
              <div>
                <h3 className="text-lg font-bold">{selectedEmployee.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedEmployee.designation} • ৳ {money(selectedEmployee.basicSalary)}
                </p>
              </div>

              <button onClick={() => setSelectedEmployee(null)} className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500">
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="month" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })} className="border rounded-xl p-3" />
                <input type="number" placeholder="Overtime" value={salaryForm.overtimeAmount} onChange={(e) => setSalaryForm({ ...salaryForm, overtimeAmount: e.target.value })} className="border rounded-xl p-3" />
                <input type="number" placeholder="Bonus / Eid Bonus" value={salaryForm.bonusAmount} onChange={(e) => setSalaryForm({ ...salaryForm, bonusAmount: e.target.value })} className="border rounded-xl p-3" />
                <input type="number" placeholder="Absent Deduction" value={salaryForm.absentDeduction} onChange={(e) => setSalaryForm({ ...salaryForm, absentDeduction: e.target.value })} className="border rounded-xl p-3" />
                <input type="number" placeholder="Advance Deduction" value={salaryForm.advanceDeduction} onChange={(e) => setSalaryForm({ ...salaryForm, advanceDeduction: e.target.value })} className="border rounded-xl p-3" />
                <input type="number" placeholder="Loan Deduction" value={salaryForm.loanDeduction} onChange={(e) => setSalaryForm({ ...salaryForm, loanDeduction: e.target.value })} className="border rounded-xl p-3" />

                <select value={salaryForm.bankId} onChange={(e) => setSalaryForm({ ...salaryForm, bankId: e.target.value })} className="md:col-span-3 border rounded-xl p-3">
                  <option value="">Select Company Bank For Bank Salary</option>
                  {banks.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bankName} - ৳ {money(b.currentBalance)}
                    </option>
                  ))}
                </select>

                <textarea placeholder="Salary note" value={salaryForm.note} onChange={(e) => setSalaryForm({ ...salaryForm, note: e.target.value })} className="md:col-span-3 border rounded-xl p-3" />
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => paySalary(selectedEmployee, "cash")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600">
                  <Wallet size={16} />
                  Pay Cash Salary
                </button>

                <button onClick={() => paySalary(selectedEmployee, "bank")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600">
                  <Landmark size={16} />
                  Pay Bank Salary
                </button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Advance Salary</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="number" placeholder="Advance Amount" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} className="border rounded-xl p-3" />

                  <select value={advanceForm.paidBy} onChange={(e) => setAdvanceForm({ ...advanceForm, paidBy: e.target.value })} className="border rounded-xl p-3">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </select>

                  <select value={advanceForm.bankId} onChange={(e) => setAdvanceForm({ ...advanceForm, bankId: e.target.value })} className="border rounded-xl p-3">
                    <option value="">Select Bank</option>
                    {banks.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.bankName}
                      </option>
                    ))}
                  </select>

                  <textarea placeholder="Advance note" value={advanceForm.note} onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })} className="md:col-span-3 border rounded-xl p-3" />
                </div>

                <button onClick={() => payAdvance(selectedEmployee)} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600">
                  <Clock size={16} />
                  Pay Advance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes employeeFloat {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-employeeFloat {
          animation: employeeFloat 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function Stat({ title, value, danger }) {
  return (
    <div className={`rounded-3xl border p-4 md:p-5 ${danger ? "bg-red-50 text-red-600" : "bg-white"}`}>
      <p className="text-xs md:text-sm text-gray-500">{title}</p>
      <h3 className="text-xl md:text-2xl font-bold mt-3">{value}</h3>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}