"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Printer,
  RefreshCcw,
  Landmark,
  Wallet,
  History,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useRouter } from "next/navigation";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function monthText(month) {
  if (!month) return "";
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function makeSubject(month, overtime, bonus) {
  const m = monthText(month);

  if (Number(overtime || 0) > 0 && Number(bonus || 0) > 0) {
    return `Request for Salary, Overtime and Festival Bonus Disbursement for the Month of ${m}`;
  }

  if (Number(overtime || 0) > 0) {
    return `Request for Salary and Overtime Disbursement for the Month of ${m}`;
  }

  if (Number(bonus || 0) > 0) {
    return `Request for Salary and Festival Bonus Disbursement for the Month of ${m}`;
  }

  return `Request for Salary Disbursement for the Month of ${m}`;
}

export default function SalarySheetPage() {
  const router = useRouter();

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
    const empRes = await fetch("/api/employees", { credentials: "include" });
    const empData = await empRes.json();

    if (empData.success) {
      setEmployees(empData.data.employees || []);
    }

    const bankRes = await fetch("/api/bank", { credentials: "include" });
    const bankData = await bankRes.json();

    if (bankData.success) {
      setBanks(bankData.data.banks || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedBank = banks.find((b) => b._id === bankId);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => e.paymentMethod === sheetType);
  }, [employees, sheetType]);

  const selectedEmployees = useMemo(() => {
    return filteredEmployees.filter((e) => selectedIds.includes(e._id));
  }, [filteredEmployees, selectedIds]);

  const deductionTotal =
    Number(absentDeduction || 0) +
    Number(advanceDeduction || 0) +
    Number(loanDeduction || 0);

  const finalSalary = (employee) => {
    return (
      Number(employee.basicSalary || 0) +
      Number(overtimeAmount || 0) +
      Number(bonusAmount || 0) -
      deductionTotal
    );
  };

  const totalBasic = selectedEmployees.reduce(
    (sum, e) => sum + Number(e.basicSalary || 0),
    0
  );

  const totalOvertime = selectedEmployees.length * Number(overtimeAmount || 0);
  const totalBonus = selectedEmployees.length * Number(bonusAmount || 0);
  const totalDeduction = selectedEmployees.length * deductionTotal;

  const totalPayable = selectedEmployees.reduce(
    (sum, e) => sum + Math.max(finalSalary(e), 0),
    0
  );

  const subject = makeSubject(month, overtimeAmount, bonusAmount);

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

  const downloadPDF = () => {
    window.print();
  };

  const downloadExcel = async () => {
    if (selectedEmployees.length === 0) {
      return alert("Select employee first");
    }

    const XLSX = await import("xlsx");

    const rows = selectedEmployees.map((e, index) => ({
      SL: index + 1,
      "Employee Name": e.name,
      "Account Number": e.bankAccountNo || "",
      "Bank Name": e.bankName || "",
      "Basic Salary": Number(e.basicSalary || 0),
      Overtime: Number(overtimeAmount || 0),
      "Festival Bonus": Number(bonusAmount || 0),
      Deduction: Number(deductionTotal || 0),
      "Net Payable": Math.max(finalSalary(e), 0),
    }));

    rows.push({
      SL: "",
      "Employee Name": "TOTAL",
      "Account Number": "",
      "Bank Name": "",
      "Basic Salary": totalBasic,
      Overtime: totalOvertime,
      "Festival Bonus": totalBonus,
      Deduction: totalDeduction,
      "Net Payable": totalPayable,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetType === "bank" ? "Bank Salary" : "Cash Salary"
    );

    XLSX.writeFile(
      workbook,
      `${sheetType}-salary-${month || "sheet"}.xlsx`
    );
  };

  const paySalarySheet = async () => {
    if (!selectedIds.length) return alert("Select employee first");

    if (sheetType === "bank" && !bankId) {
      return alert("Select company bank account");
    }

    const confirmPay = confirm(
      `Are you sure? ${selectedIds.length} salary will be paid. Total ৳ ${money(
        totalPayable
      )}`
    );

    if (!confirmPay) return;

    try {
      setLoading(true);

      const res = await fetch("/api/salary/bulk-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

      alert(`Salary paid successfully. Total ৳ ${money(data.data.totalPaid)}`);

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
      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden print:border-0 print:shadow-none">
        <div className="p-5 md:p-7 border-b flex flex-col md:flex-row md:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Salary Sheet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Bank salary advice, cash salary register and salary payment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/salary/history")}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <History size={16} />
              History
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={downloadPDF}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <FileText size={16} />
              PDF
            </button>

            <button
              onClick={downloadExcel}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <FileSpreadsheet size={16} />
              Excel
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

        <div className="p-5 md:p-7 space-y-5 print:p-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 print:hidden">
            <select
              value={sheetType}
              onChange={(e) => {
                setSheetType(e.target.value);
                setSelectedIds([]);
              }}
              className="border rounded-xl p-3"
            >
              <option value="bank">Bank Salary Advice</option>
              <option value="cash">Cash Salary Register</option>
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
                  {b.bankName} - {b.branchName || "Branch"} - ৳{" "}
                  {money(b.currentBalance)}
                </option>
              ))}
            </select>

            <button
              onClick={paySalarySheet}
              disabled={loading}
              className={`rounded-xl px-4 py-3 text-white flex items-center justify-center gap-2 disabled:opacity-60 ${
                sheetType === "bank"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {sheetType === "bank" ? <Landmark size={16} /> : <Wallet size={16} />}
              {loading ? "Paying..." : sheetType === "bank" ? "Pay Bank Salary" : "Pay Cash Salary"}
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
              placeholder="Festival Bonus"
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
            placeholder="Note"
            className="w-full border rounded-xl p-3 print:hidden"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
            <Summary title="Selected Employee" value={selectedIds.length} />
            <Summary title="Basic Salary" value={`৳ ${money(totalBasic)}`} />
            <Summary title="Total Deduction" value={`৳ ${money(totalDeduction)}`} />
            <Summary title="Total Payable" value={`৳ ${money(totalPayable)}`} highlight />
          </div>

          <div className="border rounded-3xl overflow-hidden print:hidden">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-semibold">
                {sheetType === "bank" ? "Bank Salary Employee List" : "Cash Salary Employee List"}
              </h2>

              <button onClick={toggleAll} className="text-blue-600 text-sm">
                {selectedIds.length === filteredEmployees.length ? "Unselect All" : "Select All"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-center">Select</th>
                    <th className="p-3 text-left">SL</th>
                    <th className="p-3 text-left">Employee Name</th>
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
                      <td colSpan="10" className="p-6 text-center text-gray-500">
                        No {sheetType} salary employee found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((e, i) => (
                      <tr key={e._id} className="border-t hover:bg-blue-50/40">
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(e._id)}
                            onChange={() => toggleEmployee(e._id)}
                          />
                        </td>
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3 font-medium">{e.name}</td>
                        <td className="p-3">{e.bankName || "-"}</td>
                        <td className="p-3">{e.bankAccountNo || "-"}</td>
                        <td className="p-3 text-right">৳ {money(e.basicSalary)}</td>
                        <td className="p-3 text-right">৳ {money(overtimeAmount)}</td>
                        <td className="p-3 text-right">৳ {money(bonusAmount)}</td>
                        <td className="p-3 text-right text-red-500">৳ {money(deductionTotal)}</td>
                        <td className="p-3 text-right font-bold text-blue-600">
                          ৳ {money(Math.max(finalSalary(e), 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {filteredEmployees.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="p-3"></td>
                      <td className="p-3" colSpan="8">
                        Total Payable
                      </td>
                      <td className="p-3 text-right">৳ {money(totalPayable)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {sheetType === "bank" ? (
            <BankAdvice
              bank={selectedBank}
              month={month}
              subject={subject}
              employees={selectedEmployees}
              finalSalary={finalSalary}
              totalPayable={totalPayable}
              totalBasic={totalBasic}
              totalOvertime={totalOvertime}
              totalBonus={totalBonus}
              totalDeduction={totalDeduction}
            />
          ) : (
            <CashRegister
              month={month}
              employees={selectedEmployees}
              finalSalary={finalSalary}
              totalPayable={totalPayable}
            />
          )}
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

          @page {
            size: A4;
            margin: 18mm 14mm;
          }
        }
      `}</style>
    </div>
  );
}

function BankAdvice({
  bank,
  month,
  subject,
  employees,
  finalSalary,
  totalPayable,
  totalBasic,
  totalOvertime,
  totalBonus,
  totalDeduction,
}) {
  return (
    <div className="bg-white border rounded-[24px] p-6 print:border-0 print:rounded-none print:p-0">
      <div className="text-sm leading-6">
        <div className="flex justify-between">
          <div>
            <p>Date: {new Date().toLocaleDateString("en-GB")}</p>
            <p className="mt-4">To,</p>
            <p>The Manager</p>
            <p>{bank?.bankName || "Bank Name"}</p>
            <p>{bank?.branchName || "Branch Name"}</p>
          </div>
        </div>

        <p className="mt-6 font-bold">Subject: {subject}</p>

        <p className="mt-6">Dear Sir,</p>

        <p className="mt-4">
          We kindly request you to transfer the salary amount from our account
          maintained with your branch to the respective employee accounts as per
          the details mentioned below.
        </p>

        <table className="w-full text-sm border-collapse mt-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-[50px]">SL</th>
              <th className="border p-2 text-left">Employee Name</th>
              <th className="border p-2 text-left">Account Number</th>
              <th className="border p-2 text-right">Amount (BDT)</th>
            </tr>
          </thead>

          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="4" className="border p-4 text-center text-gray-500">
                  No employee selected.
                </td>
              </tr>
            ) : (
              employees.map((e, i) => (
                <tr key={e._id}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2 font-semibold uppercase">{e.name}</td>
                  <td className="border p-2">{e.bankAccountNo || "-"}</td>
                  <td className="border p-2 text-right">{money(finalSalary(e))}</td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot>
            <tr className="font-bold">
              <td colSpan="3" className="border p-2 text-right">
                Total Amount
              </td>
              <td className="border p-2 text-right">{money(totalPayable)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-5 border rounded-xl p-4 text-sm">
          <p>
            Salary Month: <b>{monthText(month)}</b>
          </p>
          <p>
            Basic Salary: <b>{money(totalBasic)} BDT</b>
          </p>
          <p>
            Overtime: <b>{money(totalOvertime)} BDT</b>
          </p>
          <p>
            Festival Bonus: <b>{money(totalBonus)} BDT</b>
          </p>
          <p>
            Total Deduction: <b>{money(totalDeduction)} BDT</b>
          </p>
          <p>
            Net Payable: <b>{money(totalPayable)} BDT</b>
          </p>
        </div>

        <p className="mt-6">
          We would appreciate your kind assistance in processing the above
          salary payments.
        </p>

        <p className="mt-6">Thanking You,</p>

        <div className="mt-16 flex justify-between">
          <div>
            <div className="border-t w-52 pt-2">Authorized Signature</div>
          </div>

          <div>
            <div className="border-t w-52 pt-2 text-center">Company Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CashRegister({ month, employees, finalSalary, totalPayable }) {
  return (
    <div className="bg-white border rounded-[24px] p-6 print:border-0 print:rounded-none print:p-0">
      <h2 className="text-xl font-bold text-center">Cash Salary Register</h2>
      <p className="text-center text-sm mt-1">Salary Month: {monthText(month)}</p>

      <table className="w-full text-sm border-collapse mt-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 w-[50px]">SL</th>
            <th className="border p-2 text-left">Employee Name</th>
            <th className="border p-2 text-right">Amount (BDT)</th>
            <th className="border p-2">Signature</th>
          </tr>
        </thead>

        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan="4" className="border p-4 text-center text-gray-500">
                No employee selected.
              </td>
            </tr>
          ) : (
            employees.map((e, i) => (
              <tr key={e._id}>
                <td className="border p-2 text-center">{i + 1}</td>
                <td className="border p-2 font-semibold uppercase">{e.name}</td>
                <td className="border p-2 text-right">{money(finalSalary(e))}</td>
                <td className="border p-2 h-10"></td>
              </tr>
            ))
          )}
        </tbody>

        <tfoot>
          <tr className="font-bold">
            <td colSpan="2" className="border p-2 text-right">
              Total Amount
            </td>
            <td className="border p-2 text-right">{money(totalPayable)}</td>
            <td className="border p-2"></td>
          </tr>
        </tfoot>
      </table>
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