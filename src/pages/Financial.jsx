import React, { useEffect, useState } from "react";
import { useCompany } from "../context/CompanyContext";

const Financial = () => {
  const { activeCompany } = useCompany();

  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [banks, setBanks] = useState([]);

  // ✅ Company না থাকলে stop
  if (!activeCompany) {
    return <h1 className="p-6">Please select a company first</h1>;
  }

  useEffect(() => {
    const savedSales =
      JSON.parse(localStorage.getItem(`sales_${activeCompany.id}`)) || [];

    const savedExpenses =
      JSON.parse(localStorage.getItem(`expenses_${activeCompany.id}`)) || [];

    const savedBanks =
      JSON.parse(localStorage.getItem(`banks_${activeCompany.id}`)) || [];

    setSales(savedSales);
    setExpenses(savedExpenses);
    setBanks(savedBanks);
  }, [activeCompany]);

  // 👉 SALES
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalPaid = sales.reduce((sum, s) => sum + s.paid, 0);
  const totalDue = sales.reduce((sum, s) => sum + s.due, 0);

  // 👉 EXPENSE
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 👉 BANK হিসাব
  const bankTotal = banks.reduce((sum, b) => sum + b.balance, 0);

  // 👉 CASH (payment method based)
  const cash = sales
    .filter((s) => s.paymentMethod === "cash")
    .reduce((sum, s) => sum + s.paid, 0);

  // 👉 BANK (sales + bank accounts)
  const bank =
    bankTotal +
    sales
      .filter((s) => s.paymentMethod === "bank")
      .reduce((sum, s) => sum + s.paid, 0);

  // 👉 STOCK (later dynamic হবে inventory থেকে)
  const stock = 50000;

  // 👉 PAYABLE (future feature)
  const payable = 0;

  // 👉 FINAL CALCULATION
  const assets = cash + bank + stock + totalDue;
  const liabilities = payable + totalExpense;

  const financialPosition = assets - liabilities;

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">

      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Financial Position ({activeCompany.name})
      </h1>

      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Cash</p>
          <h2 className="font-bold text-lg">৳ {cash}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Bank</p>
          <h2 className="font-bold text-lg">৳ {bank}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Stock Value</p>
          <h2 className="font-bold text-lg">৳ {stock}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Due Receivable</p>
          <h2 className="font-bold text-lg text-red-500">৳ {totalDue}</h2>
        </div>

      </div>

      {/* 🔹 Extra Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Sales</p>
          <h2 className="font-bold text-blue-600">৳ {totalSales}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Expense</p>
          <h2 className="font-bold text-red-500">৳ {totalExpense}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Received</p>
          <h2 className="font-bold text-green-600">৳ {totalPaid}</h2>
        </div>

      </div>

      {/* 🔹 FINAL RESULT */}
      <div className="bg-white p-6 rounded-2xl shadow text-center">

        <h2 className="text-lg text-gray-500">
          Total Financial Position
        </h2>

        <p
          className={`text-3xl font-bold mt-2 ${
            financialPosition >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          ৳ {financialPosition}
        </p>

        <p className="text-sm text-gray-400 mt-2">
          {financialPosition >= 0 ? "Profit" : "Loss"}
        </p>

      </div>

    </div>
  );
};

export default Financial;
