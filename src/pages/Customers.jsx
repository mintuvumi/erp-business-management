import React, { useState, useEffect } from "react";

const Customers = () => {
  const [salesList, setSalesList] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [payment, setPayment] = useState(0);

  // 👉 Load data
  useEffect(() => {
    const saved = localStorage.getItem("sales");
    if (saved) {
      setSalesList(JSON.parse(saved));
    }
  }, []);

  // 👉 Get unique customers
  const customers = [...new Set(salesList.map((s) => s.customer))];

  // 👉 Filter selected customer
  const customerSales = salesList.filter(
    (s) => s.customer === selectedCustomer
  );

  // 👉 Calculate totals
  const total = customerSales.reduce((sum, s) => sum + s.total, 0);
  const paid = customerSales.reduce((sum, s) => sum + s.paid, 0);
  const due = customerSales.reduce((sum, s) => sum + s.due, 0);

  // 👉 Receive Payment
  const handlePayment = () => {
    if (!selectedCustomer || payment <= 0) return;

    let remaining = payment;

    const updatedSales = salesList.map((sale) => {
      if (sale.customer !== selectedCustomer || remaining <= 0) return sale;

      let payNow = Math.min(sale.due, remaining);

      remaining -= payNow;

      return {
        ...sale,
        paid: sale.paid + payNow,
        due: sale.due - payNow,
      };
    });

    setSalesList(updatedSales);
    localStorage.setItem("sales", JSON.stringify(updatedSales));

    setPayment(0);
  };

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">

      <h1 className="text-2xl font-bold mb-6 text-gray-700">
        Customer Ledger
      </h1>

      {/* Customer Select */}
      <select
        value={selectedCustomer}
        onChange={(e) => setSelectedCustomer(e.target.value)}
        className="p-2 border rounded mb-4"
      >
        <option>Select Customer</option>
        {customers.map((c, i) => (
          <option key={i}>{c}</option>
        ))}
      </select>

      {/* Summary */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <p>Total: ৳ {total}</p>
        <p className="text-green-600">Paid: ৳ {paid}</p>
        <p className="text-red-500">Due: ৳ {due}</p>
      </div>

      {/* Payment Receive */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <h2 className="font-bold mb-2">Receive Payment</h2>

        <input
          type="number"
          value={payment}
          onChange={(e) => setPayment(Number(e.target.value))}
          placeholder="Enter amount"
          className="p-2 border rounded w-full mb-2"
        />

        <button
          onClick={handlePayment}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Receive Payment
        </button>
      </div>

      {/* Transaction Table */}
      <div className="bg-white p-4 rounded-xl shadow-sm">

        <h2 className="font-bold mb-2">Transactions</h2>

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Paid</th>
              <th className="p-2 border">Due</th>
            </tr>
          </thead>

          <tbody>
            {customerSales.map((sale, i) => (
              <tr key={i}>
                <td className="p-2 border">{sale.date}</td>
                <td className="p-2 border">৳ {sale.total}</td>
                <td className="p-2 border text-green-600">৳ {sale.paid}</td>
                <td className="p-2 border text-red-500">৳ {sale.due}</td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Customers;
