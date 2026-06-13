"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Save,
  Printer,
  Download,
  RefreshCcw,
  X,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdvanceSalaryPage() {
  const [employees, setEmployees] = useState([]);
  const [banks, setBanks] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [summary, setSummary] = useState({});

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    status: "",
    from: "",
    to: "",
    outstandingOnly: false,
  });

  const [form, setForm] = useState({
    date: today(),
    amount: "",
    paymentTo: "cash",
    bankId: "",
    paymentMethod: "cash",
    transactionId: "",
    chequeNo: "",
    adjustmentMonth: "",
    reason: "",
    note: "",
  });

  const [printData, setPrintData] = useState(null);

  const loadEmployees = async () => {
    const res = await fetch("/api/employees", { credentials: "include" });
    const data = await res.json();
    if (data?.success) setEmployees(data.data?.employees || []);
  };

  const loadBanks = async () => {
    const res = await fetch("/api/bank", { credentials: "include" });
    const data = await res.json();
    if (data?.success) {
      const list = Array.isArray(data?.data)
        ? data.data
        : data?.data?.banks || data?.banks || [];
      setBanks(list);
    }
  };

  const loadAdvances = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.status) params.set("status", filters.status);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.outstandingOnly) params.set("outstandingOnly", "true");

      const res = await fetch(`/api/advance-salary?${params.toString()}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data?.success) {
        setAdvances(data.data?.advances || []);
        setSummary(data.data?.summary || {});
      }
    } catch (error) {
      alert(error.message || "Failed to load advance salary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadBanks();
    loadAdvances();
  }, []);

  const searchEmployee = (value) => {
    setEmployeeSearch(value);
    setSelectedEmployee(null);

    const q = value.toLowerCase().trim();
    if (!q) {
      setEmployeeSuggestions([]);
      return;
    }

    const list = employees
      .filter((e) =>
        [
          e.name,
          e.employeeCode,
          e.phone,
          e.designation,
          e.department,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8);

    setEmployeeSuggestions(list);
  };

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(`${emp.name} ${emp.phone ? `- ${emp.phone}` : ""}`);
    setEmployeeSuggestions([]);
  };

  const selectedEmployeeAdvance = useMemo(() => {
    if (!selectedEmployee?._id) return 0;

    return advances
      .filter(
        (a) =>
          String(a.employeeId?._id || a.employeeId) ===
            String(selectedEmployee._id) && a.status === "open"
      )
      .reduce((s, a) => s + Number(a.remainingAmount || 0), 0);
  }, [advances, selectedEmployee]);

  const resetForm = () => {
    setSelectedEmployee(null);
    setEmployeeSearch("");
    setEmployeeSuggestions([]);
    setForm({
      date: today(),
      amount: "",
      paymentTo: "cash",
      bankId: "",
      paymentMethod: "cash",
      transactionId: "",
      chequeNo: "",
      adjustmentMonth: "",
      reason: "",
      note: "",
    });
  };

  const saveAdvance = async () => {
    if (!selectedEmployee?._id) return alert("Please select employee");
    if (!form.amount || Number(form.amount) <= 0) {
      return alert("Valid advance amount required");
    }
    if (form.paymentTo === "bank" && !form.bankId) {
      return alert("Please select bank account");
    }

    try {
      setSaving(true);

      const res = await fetch("/api/advance-salary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          employeeId: selectedEmployee._id,
          amount: Number(form.amount || 0),
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        throw new Error(data.message || "Advance salary save failed");
      }

      alert("Advance Salary Saved");
      setPrintData(data.data);
      resetForm();
      await loadAdvances();
    } catch (error) {
      alert(error.message || "Advance salary save failed");
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("advance-salary-print");

    html2pdf()
      .set({
        margin: 0,
        filename: `${printData?.voucherNo || "advance-salary"}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Advance Salary</h1>
            <p className="text-sm text-gray-500 mt-1">
              Employee advance salary, cash/bank payment, print receipt and
              outstanding report.
            </p>
          </div>

          <button
            onClick={loadAdvances}
            className="border px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card title="Total Advance" value={`৳ ${money(summary.totalAdvance)}`} />
        <Card
          title="Outstanding"
          value={`৳ ${money(summary.outstandingAdvance)}`}
          danger
          onClick={() =>
            setFilters((p) => ({ ...p, outstandingOnly: true, status: "open" }))
          }
        />
        <Card
          title="Adjusted"
          value={`৳ ${money(summary.adjustedAdvance)}`}
          success
        />
        <Card
          title="Employees With Advance"
          value={summary.employeesWithAdvance || 0}
          onClick={() =>
            setFilters((p) => ({ ...p, outstandingOnly: true, status: "open" }))
          }
        />
        <Card title="Today" value={`৳ ${money(summary.todayAdvance)}`} />
        <Card
          title="This Month"
          value={`৳ ${money(summary.thisMonthAdvance)}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[430px_1fr] gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
          <h2 className="font-bold">New Advance Salary</h2>

          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Employee Search
            </label>

            <input
              value={employeeSearch}
              onChange={(e) => searchEmployee(e.target.value)}
              placeholder="Search employee name, code, phone..."
              className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100"
            />

            {employeeSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-2xl shadow-xl z-[9999] max-h-64 overflow-auto">
                {employeeSuggestions.map((emp) => (
                  <button
                    key={emp._id}
                    onClick={() => selectEmployee(emp)}
                    className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                  >
                    <p className="font-bold text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500">
                      {emp.employeeCode || "No Code"} • {emp.phone || "No Phone"}{" "}
                      • {emp.designation || "No Designation"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedEmployee && (
            <div className="border rounded-2xl p-4 bg-blue-50/50">
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-full bg-white border overflow-hidden flex items-center justify-center">
                  {selectedEmployee.photo ? (
                    <img
                      src={selectedEmployee.photo}
                      alt={selectedEmployee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-blue-600">
                      {selectedEmployee.name?.charAt(0)}
                    </span>
                  )}
                </div>

                <div>
                  <p className="font-bold">{selectedEmployee.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedEmployee.designation || "-"} •{" "}
                    {selectedEmployee.department || "-"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Salary: ৳ {money(selectedEmployee.basicSalary)} • Previous
                    Advance: ৳ {money(selectedEmployeeAdvance)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="date"
              label="Date"
              value={form.date}
              onChange={(v) => setForm((p) => ({ ...p, date: v }))}
            />

            <Input
              type="number"
              label="Advance Amount"
              value={form.amount}
              onChange={(v) => setForm((p) => ({ ...p, amount: v }))}
            />

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Payment To
              </label>
              <select
                value={form.paymentTo}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    paymentTo: e.target.value,
                    paymentMethod: e.target.value,
                    bankId: "",
                  }))
                }
                className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="mobile_banking">Mobile Banking</option>
              </select>
            </div>

            {form.paymentTo === "bank" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Bank Account
                </label>
                <select
                  value={form.bankId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bankId: e.target.value }))
                  }
                  className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
                >
                  <option value="">Select Bank</option>
                  {banks.map((bank) => (
                    <option key={bank._id || bank.id} value={bank._id || bank.id}>
                      {bank.bankName} -{" "}
                      {bank.accountNo || bank.accountNumber || "No Account"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Transaction ID"
              value={form.transactionId}
              onChange={(v) => setForm((p) => ({ ...p, transactionId: v }))}
            />

            <Input
              type="month"
              label="Adjustment Month"
              value={form.adjustmentMonth}
              onChange={(v) => setForm((p) => ({ ...p, adjustmentMonth: v }))}
            />
          </div>

          <textarea
            value={form.reason}
            onChange={(e) =>
              setForm((p) => ({ ...p, reason: e.target.value }))
            }
            placeholder="Reason"
            className="border p-3 rounded-xl w-full min-h-[80px] outline-none focus:ring-4 focus:ring-blue-100"
          />

          <textarea
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Note"
            className="border p-3 rounded-xl w-full min-h-[80px] outline-none focus:ring-4 focus:ring-blue-100"
          />

          <button
            onClick={saveAdvance}
            disabled={saving}
            className="w-full bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Advance Salary"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={filters.q}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, q: e.target.value }))
                }
                placeholder="Search employee, phone, voucher..."
                className="w-full border rounded-xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
              className="border p-3 rounded-xl bg-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="adjusted">Adjusted</option>
            </select>

            <button
              onClick={loadAdvances}
              className="bg-gray-900 text-white px-4 py-3 rounded-xl font-semibold"
            >
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Voucher</th>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Adjusted</th>
                  <th className="p-3 text-right">Remaining</th>
                  <th className="p-3 text-left">Paid By</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Print</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : advances.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">
                      No advance salary found.
                    </td>
                  </tr>
                ) : (
                  advances.map((a) => (
                    <tr key={a._id} className="border-t">
                      <td className="p-3 font-semibold">{a.voucherNo}</td>
                      <td className="p-3">
                        <p className="font-semibold">{a.employeeName}</p>
                        <p className="text-xs text-gray-500">
                          {a.employeeCode || "-"} • {a.phone || "-"}
                        </p>
                      </td>
                      <td className="p-3">{a.date}</td>
                      <td className="p-3 text-right">৳ {money(a.amount)}</td>
                      <td className="p-3 text-right">
                        ৳ {money(a.adjustedAmount)}
                      </td>
                      <td className="p-3 text-right text-red-600 font-bold">
                        ৳ {money(a.remainingAmount)}
                      </td>
                      <td className="p-3 capitalize">{a.paymentTo || a.paidBy}</td>
                      <td className="p-3 capitalize">{a.status}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setPrintData(a)}
                          className="border px-3 py-2 rounded-xl hover:bg-blue-50"
                        >
                          Print
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

      {printData && (
        <div className="fixed inset-0 bg-black/50 z-[9999] p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-auto">
            <div className="no-print flex justify-between items-center p-4 border-b">
              <h3 className="font-bold">Advance Salary Receipt</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  onClick={downloadPDF}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Download size={16} /> PDF
                </button>
                <button
                  onClick={() => setPrintData(null)}
                  className="border w-10 h-10 rounded-full flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div id="advance-salary-print" className="p-10 bg-white">
              <div className="border-2 border-gray-900 p-8 min-h-[620px]">
                <div className="text-center border-b pb-5">
                  <h1 className="text-2xl font-black">ADVANCE SALARY RECEIPT</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Voucher: {printData.voucherNo || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 text-sm">
                  <Info label="Employee Name" value={printData.employeeName} />
                  <Info label="Employee Code" value={printData.employeeCode} />
                  <Info label="Phone" value={printData.phone} />
                  <Info label="Department" value={printData.department} />
                  <Info label="Designation" value={printData.designation} />
                  <Info label="Date" value={printData.date} />
                  <Info label="Payment Method" value={printData.paymentTo || printData.paidBy} />
                  <Info label="Adjustment Month" value={printData.adjustmentMonth || "-"} />
                </div>

                <div className="mt-8 border rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-100 font-bold text-sm">
                    <div className="p-4">Advance Amount</div>
                    <div className="p-4">Adjusted</div>
                    <div className="p-4">Remaining</div>
                  </div>
                  <div className="grid grid-cols-3 text-lg font-black">
                    <div className="p-4">৳ {money(printData.amount)}</div>
                    <div className="p-4">৳ {money(printData.adjustedAmount)}</div>
                    <div className="p-4">৳ {money(printData.remainingAmount)}</div>
                  </div>
                </div>

                <div className="mt-8 text-sm">
                  <p>
                    <b>Reason:</b> {printData.reason || "-"}
                  </p>
                  <p className="mt-2">
                    <b>Note:</b> {printData.note || "-"}
                  </p>
                </div>

                <div className="flex justify-between mt-20 text-center text-sm">
                  <div>
                    <div className="border-t border-gray-900 w-44 pt-2">
                      Employee Signature
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-gray-900 w-44 pt-2">
                      Authorized Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #advance-salary-print,
                #advance-salary-print * {
                  visibility: visible;
                }
                #advance-salary-print {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 210mm;
                  min-height: 297mm;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, success, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white border rounded-[22px] p-4 text-left shadow-sm ${
        danger ? "border-red-100" : success ? "border-green-100" : ""
      } ${onClick ? "hover:bg-blue-50" : ""}`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-lg font-bold mt-1 ${
          danger ? "text-red-600" : success ? "text-green-600" : "text-gray-900"
        }`}
      >
        {value}
      </h3>
    </button>
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

function Info({ label, value }) {
  return (
    <div className="border-b pb-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold">{value || "-"}</p>
    </div>
  );
}