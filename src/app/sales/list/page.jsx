"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ added

export default function SalesListPage() {
  const router = useRouter(); // ✅ added

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await fetch("/api/sales");
        const data = await res.json();

        if (data.success) {
          setSales(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  if (loading) {
    return <div className="p-4">Loading sales...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Sales List</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-4 text-sm font-semibold">Bill No</th>
              <th className="p-4 text-sm font-semibold">Date</th>
              <th className="p-4 text-sm font-semibold">Customer</th>
              <th className="p-4 text-sm font-semibold">Payment</th>
              <th className="p-4 text-sm font-semibold">Net Total</th>
              <th className="p-4 text-sm font-semibold">Paid</th>
              <th className="p-4 text-sm font-semibold">Due</th>
              <th className="p-4 text-sm font-semibold text-center">Action</th> {/* ✅ added */}
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No sales found
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale._id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{sale.billNo}</td>
                  <td className="p-4">{sale.date}</td>
                  <td className="p-4">{sale.customerName}</td>
                  <td className="p-4 capitalize">{sale.paymentType}</td>
                  <td className="p-4">৳ {sale.netTotal?.toFixed(2)}</td>
                  <td className="p-4">৳ {sale.paidAmount?.toFixed(2)}</td>
                  <td className="p-4 text-red-500">
                    ৳ {sale.dueAmount?.toFixed(2)}
                  </td>

                  {/* ✅ ACTION BUTTON */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => router.push(`/sales/invoice/${sale._id}`)}
                      className="px-3 py-1.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Invoice
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}