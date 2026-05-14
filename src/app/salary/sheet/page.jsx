"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Download, RefreshCcw, Landmark, Wallet } from "lucide-react";

export default function SalarySheetPage() {
  const [employees, setEmployees] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [sheetType, setSheetType] = useState("bank");
  const [bankId, setBankId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const [overtimeAmount, setOvertimeAmount] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [absentDeduction, setAbsentDeduction] = useState(0);
  const [advanceDeduction, setAdvanceDeduction] = useState(0);
  const [loanDeduction, setLoanDeduction] = useState(0);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const empRes = await fetch("/api/employees");
    const empData = await empRes.json();

    if (empData.success) {
      setEmployees(empData.data.employees || []);
    }

    const bankRes = await fetch("/api/bank");
    const bankData = await bankRes.json();

    if (bankData.success) {
      setBanks(bankData.data.banks || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => e.paymentMethod === sheetType);
  }, [employees, sheetType]);

  const selectedEmployees = useMemo(() => {
    return filteredEmployees.filter((e) => selectedIds.includes(e._id));
  }, [filteredEmployees, selectedIds]);

  const finalSalary = (employee) => {
    return (
      Number(employee.basicSalary || 0) +
      Number(overtimeAmount || 0) +
      Number(bonusAmount || 0) -
      Number(absentDeduction || 0) -
      Number(advanceDeduction || 0) -
      Number(loanDeduction || 0)
    );
  };

  const totalPayable = selectedEmployees.reduce(
    (sum, e) => sum + Math.max(finalSalary(e), 0),
    0
  );

  const toggleAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map((e) => e._id));
    }
  };

  const toggleEmployee = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const paySalarySheet = async () => {
    if (!selectedIds.length) return alert("Select employee first");

    if (sheetType === "bank" && !bankId) {
      return alert("Select company bank account");
    }

    const confirmPay = confirm(
      `Are you sure? ${selectedIds.length} employee salary will be paid. Total ৳ ${totalPayable.toFixed(
        2
      )}`
    );

    if (!confirmPay) return;

    try {
      setLoading(true);

      const res = await fetch("/api/salary/bulk-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: selectedIds,
          month,
          paymentMethod: sheetType,
          bankId,
          overtimeAmount,
          bonusAmount,
          absentDeduction,
          advanceDeduction,
          loanDeduction,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Salary payment failed");
      }

      alert(
        `Salary paid ✅\nPaid Count: ${data.data.paidCount}\nTotal: ৳ ${Number(
          data.data.totalPaid || 0
        ).toFixed(2)}`
      );

      setSelectedIds([]);
      fetchData();
    } catch (error) {
      alert(error.message || "Salary payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 print:bg-white">
      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="p-5 md:p-7 border-b flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Salary Sheet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Company Name • Company Address • Phone Number
            </p>
            <p className="text-sm text-gray-500">
              Month: <b>{month}</b> • Type: <b className="capitalize">{sheetType}</b>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50">
              <Download size={16} />
              PDF
            </button>

            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-5 md:p-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 print:hidden">
            <select
              value={sheetType}
              onChange={(e) => {
                setSheetType(e.target.value);
                setSelectedIds([]);
              }}
              className="border rounded-xl p-3"
            >
              <option value="bank">Bank Salary Sheet</option>
              <option value="cash">Cash Salary Sheet</option>
            </select>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-xl p-3"
            />

            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              disabled={sheetType === "cash"}
              className="border rounded-xl p-3 disabled:bg-gray-100"
            >
              <option value="">Select Company Bank</option>
              {banks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bankName} - ৳ {Number(b.currentBalance || 0).toFixed(2)}
                </option>
              ))}
            </select>

            <button
              onClick={paySalarySheet}
              disabled={loading}
              className={`rounded-xl px-4 py-3 text-white flex items-center justify-center gap-2 disabled:opacity-60 ${
                sheetType === "bank"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {sheetType === "bank" ? <Landmark size={16} /> : <Wallet size={16} />}
              {loading ? "Paying..." : sheetType === "bank" ? "Pay Bank Sheet" : "Pay Cash Sheet"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 print:hidden">
            <input
              type="number"
              value={overtimeAmount}
              onChange={(e) => setOvertimeAmount(Number(e.target.value) || 0)}
              placeholder="Overtime"
              className="border rounded-xl p-3"
            />

            <input
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(Number(e.target.value) || 0)}
              placeholder="Eid Bonus / Bonus"
              className="border rounded-xl p-3"
            />

            <input
              type="number"
              value={absentDeduction}
              onChange={(e) => setAbsentDeduction(Number(e.target.value) || 0)}
              placeholder="Absent Deduction"
              className="border rounded-xl p-3"
            />

            <input
              type="number"
              value={advanceDeduction}
              onChange={(e) => setAdvanceDeduction(Number(e.target.value) || 0)}
              placeholder="Advance Deduction"
              className="border rounded-xl p-3"
            />

            <input
              type="number"
              value={loanDeduction}
              onChange={(e) => setLoanDeduction(Number(e.target.value) || 0)}
              placeholder="Loan Deduction"
              className="border rounded-xl p-3"
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Salary sheet note"
            className="w-full border rounded-xl p-3 print:hidden"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Summary title="Selected Employee" value={selectedIds.length} />
            <Summary title="Total Payable" value={`৳ ${totalPayable.toFixed(2)}`} highlight />
            <Summary title="Sheet Type" value={sheetType} />
            <Summary title="Month" value={month} />
          </div>

          <div className="border rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-semibold">
                {sheetType === "bank" ? "Bank Salary Sheet" : "Cash Salary Sheet"}
              </h2>

              <button onClick={toggleAll} className="text-blue-600 text-sm print:hidden">
                {selectedIds.length === filteredEmployees.length ? "Unselect All" : "Select All"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-center print:hidden">Select</th>
                    <th className="p-3 text-left">SL</th>
                    <th className="p-3 text-left">Employee Name</th>
                    <th className="p-3 text-left">Designation</th>
                    <th className="p-3 text-left">Bank Name</th>
                    <th className="p-3 text-left">A/C No</th>
                    <th className="p-3 text-right">Basic</th>
                    <th className="p-3 text-right">Overtime</th>
                    <th className="p-3 text-right">Bonus</th>
                    <th className="p-3 text-right">Deduction</th>
                    <th className="p-3 text-right">Net Payable</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="p-6 text-center text-gray-500">
                        No {sheetType} salary employee found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((e, i) => {
                      const deduction =
                        Number(absentDeduction || 0) +
                        Number(advanceDeduction || 0) +
                        Number(loanDeduction || 0);

                      return (
                        <tr key={e._id} className="border-t hover:bg-blue-50/40">
                          <td className="p-3 text-center print:hidden">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(e._id)}
                              onChange={() => toggleEmployee(e._id)}
                            />
                          </td>
                          <td className="p-3">{i + 1}</td>
                          <td className="p-3 font-medium">{e.name}</td>
                          <td className="p-3">{e.designation || "-"}</td>
                          <td className="p-3">{e.bankName || "-"}</td>
                          <td className="p-3">{e.bankAccountNo || "-"}</td>
                          <td className="p-3 text-right">
                            ৳ {Number(e.basicSalary || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            ৳ {Number(overtimeAmount || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            ৳ {Number(bonusAmount || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right text-red-500">
                            ৳ {deduction.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold text-blue-600">
                            ৳ {Math.max(finalSalary(e), 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {filteredEmployees.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="p-3 print:hidden"></td>
                      <td className="p-3" colSpan="9">
                        Total Payable
                      </td>
                      <td className="p-3 text-right">
                        ৳ {totalPayable.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Summary({ title, value, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "bg-blue-500 text-white" : "bg-white"
      }`}
    >
      <p className={`text-xs ${highlight ? "text-blue-50" : "text-gray-500"}`}>
        {title}
      </p>
      <h3 className="text-xl font-bold mt-2 capitalize">{value}</h3>
    </div>
  );
}