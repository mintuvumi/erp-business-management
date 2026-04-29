import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useCompany } from "../context/CompanyContext";

const Financial = () => {
  const { activeCompany } = useCompany();

  const [isClient, setIsClient] = useState(false);

  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !activeCompany) return;

    const savedSales =
      JSON.parse(localStorage.getItem(`sales_${activeCompany.id}`)) || [];

    const savedExpenses =
      JSON.parse(localStorage.getItem(`expenses_${activeCompany.id}`)) || [];

    const savedBanks =
      JSON.parse(localStorage.getItem(`banks_${activeCompany.id}`)) || [];

    setSales(savedSales);
    setExpenses(savedExpenses);
    setBanks(savedBanks);
  }, [isClient, activeCompany]);

  if (!isClient) {
    return null;
  }

  if (!activeCompany) {
    return <h1 className="p-6">Please select a company first</h1>;
  }

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalPaid = sales.reduce((sum, s) => sum + s.paid, 0);
  const totalDue = sales.reduce((sum, s) => sum + s.due, 0);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const bankTotal = banks.reduce((sum, b) => sum + b.balance, 0);

  const cash = sales
    .filter((s) => s.paymentMethod === "cash")
    .reduce((sum, s) => sum + s.paid, 0);

  const bank =
    bankTotal +
    sales
      .filter((s) => s.paymentMethod === "bank")
      .reduce((sum, s) => sum + s.paid, 0);

  const stock = 50000;
  const payable = 0;

  const assets = cash + bank + stock + totalDue;
  const liabilities = payable + totalExpense;

  const financialPosition = assets - liabilities;

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Financial Position ({activeCompany.name})
      </h1>

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

      <div className="bg-white p-6 rounded-2xl shadow text-center">
        <h2 className="text-lg text-gray-500">Total Financial Position</h2>

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

export default dynamic(() => Promise.resolve(Financial), {
  ssr: false,
});