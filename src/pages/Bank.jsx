import React, { useState, useEffect } from "react";
import { useCompany } from "../context/CompanyContext";

const Bank = () => {
  const { activeCompany } = useCompany();

  const [banks, setBanks] = useState([]);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);

  if (!activeCompany) {
    return <h1 className="p-6">Select a company first</h1>;
  }

  // Load
  useEffect(() => {
    const saved =
      JSON.parse(localStorage.getItem(`banks_${activeCompany.id}`)) || [];
    setBanks(saved);
  }, [activeCompany]);

  // Save
  useEffect(() => {
    localStorage.setItem(
      `banks_${activeCompany.id}`,
      JSON.stringify(banks)
    );
  }, [banks, activeCompany]);

  // 👉 Add Bank
  const addBank = () => {
    if (!name) return alert("Enter bank name");

    const newBank = {
      name,
      balance: Number(balance),
    };

    setBanks([...banks, newBank]);

    setName("");
    setBalance(0);
  };

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        Bank Accounts ({activeCompany.name})
      </h1>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">

        <input
          type="text"
          placeholder="Bank Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Opening Balance"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <button
          onClick={addBank}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Bank
        </button>

      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold mb-3">Bank List</h2>

        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Bank</th>
              <th className="p-2 border">Balance</th>
            </tr>
          </thead>

          <tbody>
            {banks.map((b, i) => (
              <tr key={i}>
                <td className="p-2 border">{b.name}</td>
                <td className="p-2 border text-green-600">
                  ৳ {b.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
};

export default Bank;
