import React, { useState, useEffect } from "react";
import { useCompany } from "../context/CompanyContext";

const Supplier = () => {
  const { activeCompany } = useCompany();

  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState("");

  if (!activeCompany) {
    return <h1 className="p-6">Select a company first</h1>;
  }

  // Load
  useEffect(() => {
    const saved =
      JSON.parse(localStorage.getItem(`suppliers_${activeCompany.id}`)) || [];
    setSuppliers(saved);
  }, [activeCompany]);

  // Save
  useEffect(() => {
    localStorage.setItem(
      `suppliers_${activeCompany.id}`,
      JSON.stringify(suppliers)
    );
  }, [suppliers, activeCompany]);

  const addSupplier = () => {
    if (!name) return alert("Enter supplier name");

    setSuppliers([...suppliers, { name }]);
    setName("");
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Supplier ({activeCompany.name})
      </h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Supplier Name"
        className="border p-2 mr-2"
      />

      <button
        onClick={addSupplier}
        className="bg-blue-500 text-white px-3 py-1"
      >
        Add
      </button>

      <ul className="mt-4">
        {suppliers.map((s, i) => (
          <li key={i} className="p-2 border mb-1">
            {s.name}
          </li>
        ))}
      </ul>

    </div>
  );
};

export default Supplier;
