import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useCompany } from "../context/CompanyContext";

const Invoice = dynamic(() => import("../components/Invoice"), {
  ssr: false,
});

const customers = ["Rahim", "Karim", "Jamal"];

const products = [
  { name: "Fan", price: 2000 },
  { name: "Light", price: 500 },
  { name: "Switch", price: 300 },
];

const Sales = () => {
  const { activeCompany } = useCompany();

  const [isClient, setIsClient] = useState(false);

  const [customer, setCustomer] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const [items, setItems] = useState([
    { product: "", price: 0, qty: 1, total: 0 },
  ]);

  const [paid, setPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [editIndex, setEditIndex] = useState(null);
  const [salesList, setSalesList] = useState([]);

  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !activeCompany) return;

    const saved = localStorage.getItem(`sales_${activeCompany.id}`);
    setSalesList(saved ? JSON.parse(saved) : []);

    const last =
      localStorage.getItem(`lastInvoice_${activeCompany.id}`) || 1000;
    setInvoiceNo(Number(last) + 1);
  }, [isClient, activeCompany]);

  useEffect(() => {
    if (!isClient || !activeCompany) return;

    localStorage.setItem(
      `sales_${activeCompany.id}`,
      JSON.stringify(salesList)
    );
  }, [salesList, activeCompany, isClient]);

  const addItem = () => {
    setItems([...items, { product: "", price: 0, qty: 1, total: 0 }]);
  };

  const handleProduct = (index, value) => {
    const selected = products.find((p) => p.name === value);
    const newItems = [...items];

    newItems[index].product = value;
    newItems[index].price = selected ? selected.price : 0;
    newItems[index].total = newItems[index].price * newItems[index].qty;

    setItems(newItems);
  };

  const handleQty = (index, value) => {
    const newItems = [...items];

    newItems[index].qty = Number(value) || 0;
    newItems[index].total = newItems[index].price * newItems[index].qty;

    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + item.total, 0);
  const due = total - paid;

  const saveSale = () => {
    if (!customer) return alert("Select customer");

    const exists = salesList.find((s) => s.invoiceNo == invoiceNo);

    if (exists && editIndex === null) {
      return alert("Invoice already exists!");
    }

    const newSale = {
      invoiceNo,
      customer,
      items,
      total,
      paid,
      due,
      paymentMethod,
      date: new Date().toLocaleString(),
    };

    if (editIndex !== null) {
      const updated = [...salesList];
      updated[editIndex] = newSale;
      setSalesList(updated);
      setEditIndex(null);
    } else {
      setSalesList([...salesList, newSale]);
    }

    if (isClient && activeCompany) {
      localStorage.setItem(`lastInvoice_${activeCompany.id}`, invoiceNo);
    }

    setInvoiceNo(Number(invoiceNo) + 1);
    setCustomer("");
    setSearchCustomer("");
    setItems([{ product: "", price: 0, qty: 1, total: 0 }]);
    setPaid(0);
    setPaymentMethod("cash");
  };

  const deleteSale = (index) => {
    setSalesList(salesList.filter((_, i) => i !== index));
  };

  const editSale = (sale, index) => {
    setCustomer(sale.customer);
    setSearchCustomer(sale.customer);
    setItems(sale.items);
    setPaid(sale.paid);
    setPaymentMethod(sale.paymentMethod);
    setInvoiceNo(sale.invoiceNo);
    setEditIndex(index);
  };

  const downloadPDF = async () => {
    if (typeof window === "undefined") return;

    const element = document.getElementById("invoice");
    if (!element) return;

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: 0.5,
      filename: `invoice_${selectedSale?.invoiceNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().from(element).set(opt).save();
  };

  if (!isClient) {
    return null;
  }

  if (!activeCompany) {
    return <h1 className="p-6">Select company first</h1>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Sales ({activeCompany.name})
      </h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <input
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
          className="border p-2 mb-2 w-full"
          placeholder="Invoice No"
        />

        <input
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          className="border p-2 mb-2 w-full"
          placeholder="Search Customer"
        />

        {customers
          .filter((c) =>
            c.toLowerCase().includes(searchCustomer.toLowerCase())
          )
          .map((c, i) => (
            <p key={i} onClick={() => setCustomer(c)}>
              {c}
            </p>
          ))}

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-2">
            <select
              value={item.product}
              onChange={(e) => handleProduct(index, e.target.value)}
            >
              <option>Select</option>
              {products.map((p, i) => (
                <option key={i}>{p.name}</option>
              ))}
            </select>

            <input value={item.price} readOnly />

            <input
              value={item.qty}
              onChange={(e) => handleQty(index, e.target.value)}
            />

            <input value={item.total} readOnly />
          </div>
        ))}

        <button onClick={addItem}>+ Add</button>

        <input
          value={paid}
          onChange={(e) => setPaid(Number(e.target.value))}
          placeholder="Paid"
        />

        <p>Total: {total}</p>
        <p>Due: {due}</p>

        <button onClick={saveSale}>{editIndex ? "Update" : "Save"}</button>
      </div>

      {salesList.map((sale, i) => (
        <div key={i}>
          {sale.invoiceNo} | {sale.customer} | ৳ {sale.total}

          <button onClick={() => editSale(sale, i)}>Edit</button>

          <button onClick={() => deleteSale(i)}>Delete</button>

          <button
            onClick={() => {
              setSelectedSale(sale);
              setTimeout(downloadPDF, 300);
            }}
            className="text-green-600"
          >
            PDF
          </button>
        </div>
      ))}

      <div className="hidden" id="invoice">
        {selectedSale && <Invoice sale={selectedSale} />}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Sales), {
  ssr: false,
});
