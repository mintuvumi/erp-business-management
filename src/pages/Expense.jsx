import React, { useState, useEffect } from "react";
import { useCompany } from "../context/CompanyContext";

const Expense = () => {
  const { activeCompany } = useCompany();

  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);

  if (!activeCompany) {
    return <h1 className="p-6">Select a company first</h1>;
  }

  // ✅ Load
  useEffect(() => {
    const saved =
      JSON.parse(localStorage.getItem(`expenses_${activeCompany.id}`)) || [];
    setExpenses(saved);
  }, [activeCompany]);

  // ✅ Save
  useEffect(() => {
    localStorage.setItem(
      `expenses_${activeCompany.id}`,
      JSON.stringify(expenses)
    );
  }, [expenses, activeCompany]);

  // 👉 Add Expense
  const addExpense = () => {
    if (!title || !amount) return alert("Fill all fields");

    const newExpense = {
      title,
      amount: Number(amount),
      date: new Date().toLocaleString(),
    };

    setExpenses([...expenses, newExpense]);

    setTitle("");
    setAmount(0);
  };

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        Expense ({activeCompany.name})
      </h1>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <input
          type="text"
          placeholder="Expense Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <button
          onClick={addExpense}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Add Expense
        </button>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold mb-3">Expense History</h2>

        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((e, i) => (
              <tr key={i}>
                <td className="p-2 border">{e.title}</td>
                <td className="p-2 border text-red-500">৳ {e.amount}</td>
                <td className="p-2 border">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Expense;
