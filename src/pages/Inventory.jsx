import React, { useState } from "react";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [qty, setQty] = useState(0);

  const addItem = () => {
    const newItem = {
      name,
      price: Number(price),
      qty: Number(qty),
    };

    setItems([...items, newItem]);
    setName("");
    setPrice(0);
    setQty(0);
  };

  // 👉 Total Stock Value
  const stockValue = items.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  return (
    <div className="p-6">

      <h1 className="text-xl font-bold mb-4">Inventory</h1>

      <input
        placeholder="Product"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 mb-2 w-full"
      />

      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-2 mb-2 w-full"
      />

      <input
        type="number"
        placeholder="Quantity"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="border p-2 mb-2 w-full"
      />

      <button
        onClick={addItem}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add Product
      </button>

      <h2 className="mt-4 font-bold">
        Stock Value: ৳ {stockValue}
      </h2>

    </div>
  );
};

export default Inventory;
