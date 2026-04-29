import React, { useState } from "react";
import { useCompany } from "../context/CompanyContext";

const Company = () => {
  const {
    companies,
    addCompany,
    setActiveCompany,
    activeCompany,
  } = useCompany();

  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name) return alert("Enter company name");
    addCompany(name);
    setName("");
  };

  const handleDelete = (id) => {
    const updated = companies.filter((c) => c.id !== id);
    localStorage.setItem("companies", JSON.stringify(updated));
    window.location.reload(); // simple refresh
  };

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">

      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Company Management
      </h1>

      {/* ➕ Add Company */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">

        <input
          placeholder="Enter company name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border rounded-lg mb-3 outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={handleAdd}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
        >
          + Add Company
        </button>

      </div>

      {/* 📋 Company List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">

        <h2 className="text-lg font-bold mb-4 text-gray-600">
          Your Companies
        </h2>

        {companies.length === 0 && (
          <p className="text-gray-400">No company added yet</p>
        )}

        {companies.map((c) => {
          const isActive = activeCompany?.id === c.id;

          return (
            <div
              key={c.id}
              className={`flex justify-between items-center p-3 mb-2 rounded-xl cursor-pointer transition
                ${
                  isActive
                    ? "bg-blue-100 border border-blue-400"
                    : "hover:bg-gray-100"
                }
              `}
              onClick={() => setActiveCompany(c)}
            >
              <div>
                <p className="font-medium text-gray-700">{c.name}</p>
                {isActive && (
                  <span className="text-xs text-blue-500">
                    Active Company
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCompany(c);
                  }}
                  className="text-green-500 text-sm"
                >
                  Select
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id);
                  }}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
};

export default Company;
