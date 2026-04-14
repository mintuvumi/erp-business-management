import React from "react";

const Invoice = ({ sale }) => {
  if (!sale) return null;

  return (
    <div id="invoice" className="p-6 bg-white text-black">

      <h2 className="text-xl font-bold mb-2">
        Invoice: {sale.invoiceNo}
      </h2>

      <p>Customer: {sale.customer}</p>
      <p>Date: {sale.date}</p>

      <table className="w-full mt-4 border">
        <thead>
          <tr>
            <th className="border p-2">Product</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>

        <tbody>
          {sale.items.map((item, i) => (
            <tr key={i}>
              <td className="border p-2">{item.product}</td>
              <td className="border p-2">{item.qty}</td>
              <td className="border p-2">{item.price}</td>
              <td className="border p-2">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mt-4">Total: ৳ {sale.total}</h3>
      <h3>Paid: ৳ {sale.paid}</h3>
      <h3>Due: ৳ {sale.due}</h3>

    </div>
  );
};

export default Invoice;
