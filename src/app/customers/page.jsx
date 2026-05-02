"use client";

import { useEffect, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Load customers
  const loadCustomers = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();

    if (data.success) {
      setCustomers(data.data);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Save customer
  const handleSave = async () => {
    if (!name.trim()) {
      alert("Customer name required");
      return;
    }

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        address,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Customer saved ✅");
      setName("");
      setPhone("");
      setAddress("");
      loadCustomers();
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Customers</h1>

      {/* Add Customer */}
      <div className="bg-white p-5 rounded-2xl border space-y-3">

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer Name"
          className="border p-3 w-full rounded-xl"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="border p-3 w-full rounded-xl"
        />

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className="border p-3 w-full rounded-xl"
        />

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          Save Customer
        </button>
      </div>

      {/* Customer List */}
      <div className="bg-white p-5 rounded-2xl border">

        <h2 className="font-bold mb-3">Customer List</h2>

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Address</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((c) => (
              <tr key={c._id}>
                <td className="p-2 border">{c.name}</td>
                <td className="p-2 border">{c.phone}</td>
                <td className="p-2 border">{c.address}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}