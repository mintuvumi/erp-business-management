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
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function makeSubject(month, salaries, sheetType) {
  const hasOvertime = salaries.some((s) => Number(s.overtimeAmount || 0) > 0);
  const hasBonus = salaries.some((s) => Number(s.bonusAmount || 0) > 0);
  const m = monthText(month);

  const mode =
    sheetType === "cheque"
      ? "Cheque Salary"
      : sheetType === "bank"
      ? "Bank Salary"
      : "Cash Salary";

  if (hasOvertime && hasBonus) {
    return `Request for ${mode}, Overtime and Festival Bonus Disbursement for the Month of ${m}`;
  }

  if (hasOvertime) {
    return `Request for ${mode} and Overtime Disbursement for the Month of ${m}`;
  }

  if (hasBonus) {
    return `Request for ${mode} and Festival Bonus Disbursement for the Month of ${m}`;
  }

  return `Request for ${mode} Disbursement for the Month of ${m}`;
}

export default function SalarySheetPage() {
  const router = useRouter();

  const [salaries, setSalaries] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [sheetType, setSheetType] = useState("bank");
  const [bankId, setBankId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const salaryRes = await fetch(`/api/salary/history?month=${month}`, {
        credentials: "include",
      });

      const salaryData = await salaryRes.json();

      if (salaryData.success) {
        setSalaries(salaryData.data || []);
      }

      const bankRes = await fetch("/api/bank", {
        credentials: "include",
      });

      const bankData = await bankRes.json();

      if (bankData.success) {
        setBanks(bankData.data?.banks || []);
      }
    } catch (error) {
      alert(error.message || "Failed to load salary sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedIds([]);
  }, [month]);

  const selectedBank = banks.find((b) => String(b._id) === String(bankId));

  const approvedSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const isApproved =
        s.approvalStatus === "approved" && s.paymentStatus === "due";

      if (!isApproved) return false;

      if (sheetType === "cheque") {
        return s.paymentMethod === "cheque" || s.paymentMethod === "bank";
      }

      return s.paymentMethod === sheetType;
    });
  }, [salaries, sheetType]);

  const selectedSalaries = useMemo(() => {
    return approvedSalaries.filter((s) => selectedIds.includes(s._id));
  }, [approvedSalaries, selectedIds]);

  const totalBasic = selectedSalaries.reduce(
    (sum, s) => sum + Number(s.basicSalary || 0),
    0
  );

  const totalOvertime = selectedSalaries.reduce(
    (sum, s) => sum + Number(s.overtimeAmount || 0),
    0
  );

  const totalBonus = selectedSalaries.reduce(
    (sum, s) => sum + Number(s.bonusAmount || 0),
    0
  );

  const totalDeduction = selectedSalaries.reduce(
    (sum, s) =>
      sum +
      Number(s.absentDeduction || 0) +
      Number(s.advanceDeduction || 0) +
      Number(s.loanDeduction || 0),
    0
  );

  const totalPayable = selectedSalaries.reduce(
    (sum, s) => sum + Number(s.dueAmount || s.finalSalary || 0),
    0
  );

  const subject = makeSubject(month, selectedSalaries, sheetType);

  const toggleAll = () => {
    if (selectedIds.length === approvedSalaries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(approvedSalaries.map((s) => s._id));
    }
  };

  const toggleSalary = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const downloadPDF = () => window.print();

  const downloadExcel = async () => {
    if (!selectedSalaries.length) return alert("Select salary first");

    const XLSX = await import("xlsx");

    const rows = selectedSalaries.map((s, index) => ({
      SL: index + 1,
      "Employee Name": s.employeeName,
      "Employee Code": s.employeeCode || "",
      "Account Number": "",
      "Basic Salary": Number(s.basicSalary || 0),
      Overtime: Number(s.overtimeAmount || 0),
      "Festival Bonus": Number(s.bonusAmount || 0),
      Deduction:
        Number(s.absentDeduction || 0) +
        Number(s.advanceDeduction || 0) +
        Number(s.loanDeduction || 0),
      "Net Payable": Number(s.dueAmount || s.finalSalary || 0),
    }));

    rows.push({
      SL: "",
      "Employee Name": "TOTAL",
      "Employee Code": "",
      "Account Number": "",
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
      sheetType === "cheque"
        ? "Cheque Salary"
        : sheetType === "bank"
        ? "Bank Salary"
        : "Cash Salary"
    );

    XLSX.writeFile(workbook, `${sheetType}-approved-salary-${month}.xlsx`);
  };

  const payApprovedSalary = async () => {
    if (!selectedIds.length) return alert("Select approved salary first");

    if ((sheetType === "bank" || sheetType === "cheque") && !bankId) {
      return alert("Select company bank account");
    }

    const ok = confirm(
      `Are you sure? ${selectedIds.length} approved salary will be paid by ${sheetType}. Total ৳ ${money(
        totalPayable
      )}`
    );

    if (!ok) return;

    try {
      setPaying(true);

      const res = await fetch("/api/salary/pay-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          salaryIds: selectedIds,
          paymentMethod: sheetType,
          bankId,
          note,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Salary payment failed");
      }

      if (sheetType === "cheque" && data?.data?.transactionList?.length) {
        const printNow = window.confirm(
          `${data.data.transactionList.length} cheque generated.\n\nPrint cheque now?`
        );

        if (printNow) {
          data.data.transactionList.forEach((txn, index) => {
            const chequeNo = data.data.chequeList?.[index]?.chequeNo || "";

            window.open(
              `/cheque-print?transactionId=${txn._id}&chequeNo=${chequeNo}`,
              "_blank"
            );
          });
        }
      }

      alert(`Salary paid successfully. Total ৳ ${money(data.data.totalPaid)}`);

      setSelectedIds([]);
      await fetchData();
    } catch (error) {
      alert(error.message || "Salary payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-5 print:bg-white">
      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden print:border-0 print:shadow-none">
        <div className="p-5 md:p-7 border-b flex flex-col md:flex-row md:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Salary Sheet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Approved salary advice, cheque payment and cash register.
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
                if (e.target.value === "cash") setBankId("");
              }}
              className="border rounded-xl p-3"
            >
              <option value="bank">Bank Salary Advice</option>
              <option value="cheque">Cheque Salary</option>
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
              onClick={payApprovedSalary}
              disabled={paying || selectedIds.length === 0}
              className={`rounded-xl px-4 py-3 text-white flex items-center justify-center gap-2 disabled:opacity-60 ${
                sheetType === "cash"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {sheetType === "cash" ? (
                <Wallet size={16} />
              ) : (
                <Landmark size={16} />
              )}

              {paying
                ? "Paying..."
                : sheetType === "bank"
                ? "Pay Bank Salary"
                : sheetType === "cheque"
                ? "Pay Cheque Salary"
                : "Pay Cash Salary"}
            </button>
          </div>

          {sheetType === "cheque" && (
            <div className="print:hidden bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl p-4 text-sm">
              Cheque salary uses active Cheque Book. Cheque numbers will be
              generated automatically and saved into Cheque Register.
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Payment note"
            className="w-full border rounded-xl p-3 print:hidden"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
            <Summary title="Approved Salary" value={approvedSalaries.length} />
            <Summary title="Selected" value={selectedIds.length} />
            <Summary
              title="Total Deduction"
              value={`৳ ${money(totalDeduction)}`}
            />
            <Summary
              title="Total Payable"
              value={`৳ ${money(totalPayable)}`}
              highlight
            />
          </div>

          <div className="border rounded-3xl overflow-hidden print:hidden">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-semibold">
                {sheetType === "bank"
                  ? "Approved Bank Salary List"
                  : sheetType === "cheque"
                  ? "Approved Cheque Salary List"
                  : "Approved Cash Salary List"}
              </h2>

              <button onClick={toggleAll} className="text-blue-600 text-sm">
                {selectedIds.length === approvedSalaries.length
                  ? "Unselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-center">Select</th>
                    <th className="p-3 text-left">SL</th>
                    <th className="p-3 text-left">Employee Name</th>
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-right">Basic</th>
                    <th className="p-3 text-right">Overtime</th>
                    <th className="p-3 text-right">Bonus</th>
                    <th className="p-3 text-right">Deduction</th>
                    <th className="p-3 text-right">Net Payable</th>
                  </tr>
                </thead>

                <tbody>
                  {approvedSalaries.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="p-6 text-center text-gray-500"
                      >
                        No approved unpaid {sheetType} salary found.
                      </td>
                    </tr>
                  ) : (
                    approvedSalaries.map((s, i) => {
                      const deduction =
                        Number(s.absentDeduction || 0) +
                        Number(s.advanceDeduction || 0) +
                        Number(s.loanDeduction || 0);

                      return (
                        <tr
                          key={s._id}
                          className="border-t hover:bg-blue-50/40"
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(s._id)}
                              onChange={() => toggleSalary(s._id)}
                            />
                          </td>
                          <td className="p-3">{i + 1}</td>
                          <td className="p-3 font-medium">{s.employeeName}</td>
                          <td className="p-3">{s.employeeCode || "-"}</td>
                          <td className="p-3 text-right">
                            ৳ {money(s.basicSalary)}
                          </td>
                          <td className="p-3 text-right">
                            ৳ {money(s.overtimeAmount)}
                          </td>
                          <td className="p-3 text-right">
                            ৳ {money(s.bonusAmount)}
                          </td>
                          <td className="p-3 text-right text-red-500">
                            ৳ {money(deduction)}
                          </td>
                          <td className="p-3 text-right font-bold text-blue-600">
                            ৳ {money(s.dueAmount || s.finalSalary)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {sheetType === "cash" ? (
            <CashRegister
              month={month}
              salaries={selectedSalaries}
              totalPayable={totalPayable}
            />
          ) : (
            <BankAdvice
              bank={selectedBank}
              month={month}
              subject={subject}
              salaries={selectedSalaries}
              totalPayable={totalPayable}
              totalBasic={totalBasic}
              totalOvertime={totalOvertime}
              totalBonus={totalBonus}
              totalDeduction={totalDeduction}
              sheetType={sheetType}
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
  salaries,
  totalPayable,
  totalBasic,
  totalOvertime,
  totalBonus,
  totalDeduction,
  sheetType,
}) {
  return (
    <div className="bg-white border rounded-[24px] p-6 print:border-0 print:rounded-none print:p-0">
      <div className="text-sm leading-6">
        <p>Date: {new Date().toLocaleDateString("en-GB")}</p>
        <p className="mt-4">To,</p>
        <p>The Manager</p>
        <p>{bank?.bankName || "Bank Name"}</p>
        <p>{bank?.branchName || "Branch Name"}</p>

        <p className="mt-6 font-bold">Subject: {subject}</p>

        <p className="mt-6">Dear Sir,</p>

        <p className="mt-4">
          {sheetType === "cheque"
            ? "We kindly request approval for cheque salary disbursement as per the details mentioned below."
            : "We kindly request you to transfer the salary amount from our account maintained with your branch to the respective employee accounts as per the details mentioned below."}
        </p>

        <table className="w-full text-sm border-collapse mt-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-[50px]">SL</th>
              <th className="border p-2 text-left">Employee Name</th>
              <th className="border p-2 text-left">Employee Code</th>
              <th className="border p-2 text-right">Amount (BDT)</th>
            </tr>
          </thead>

          <tbody>
            {salaries.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="border p-4 text-center text-gray-500"
                >
                  No approved salary selected.
                </td>
              </tr>
            ) : (
              salaries.map((s, i) => (
                <tr key={s._id}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2 font-semibold uppercase">
                    {s.employeeName}
                  </td>
                  <td className="border p-2">{s.employeeCode || "-"}</td>
                  <td className="border p-2 text-right">
                    {money(s.dueAmount || s.finalSalary)}
                  </td>
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
            Payment Mode:{" "}
            <b>{sheetType === "cheque" ? "Cheque" : "Bank Transfer"}</b>
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
          <div className="border-t w-52 pt-2">Authorized Signature</div>
          <div className="border-t w-52 pt-2 text-center">Company Seal</div>
        </div>
      </div>
    </div>
  );
}

function CashRegister({ month, salaries, totalPayable }) {
  return (
    <div className="bg-white border rounded-[24px] p-6 print:border-0 print:rounded-none print:p-0">
      <h2 className="text-xl font-bold text-center">Cash Salary Register</h2>
      <p className="text-center text-sm mt-1">
        Salary Month: {monthText(month)}
      </p>

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
          {salaries.length === 0 ? (
            <tr>
              <td colSpan="4" className="border p-4 text-center text-gray-500">
                No approved salary selected.
              </td>
            </tr>
          ) : (
            salaries.map((s, i) => (
              <tr key={s._id}>
                <td className="border p-2 text-center">{i + 1}</td>
                <td className="border p-2 font-semibold uppercase">
                  {s.employeeName}
                </td>
                <td className="border p-2 text-right">
                  {money(s.dueAmount || s.finalSalary)}
                </td>
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