"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Save, Search } from "lucide-react";

const emptyForm = {
  productName: "",
  brand: "",
  country: "",
  icu: "",
  tripUnit: "",
  productCode: "",
  unit: "Nos.",
  listedPrice: "",
  technicalDescription: "",
};

export default function OfferProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/offer-products");
      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("PRODUCT_LOAD_ERROR:", error);
      alert("Product load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveProduct = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/offer-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      alert("Product saved");
      setForm(emptyForm);
      fetchProducts();
    } catch (error) {
      console.error("PRODUCT_SAVE_ERROR:", error);
      alert(error.message || "Product save failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((item) => {
    const q = search.toLowerCase();

    return (
      item.productName?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.country?.toLowerCase().includes(q) ||
      item.productCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[30px] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Offer Product Master</h1>
          <p className="text-sm text-gray-500 mt-1">
            Product technical information and listed price database.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="border px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-1 bg-white border rounded-[30px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Plus size={18} />
            <h2 className="font-bold text-lg">Add Product</h2>
          </div>

          <Input
            label="Product Name"
            value={form.productName}
            onChange={(v) => update("productName", v)}
            placeholder="Example: XT1C 160 TMD 100-1000 3p F F"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Brand"
              value={form.brand}
              onChange={(v) => update("brand", v)}
              placeholder="ABB"
            />

            <Input
              label="Country"
              value={form.country}
              onChange={(v) => update("country", v)}
              placeholder="Italy"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Icu"
              value={form.icu}
              onChange={(v) => update("icu", v)}
              placeholder="25 KA"
            />

            <Input
              label="Trip Unit"
              value={form.tripUnit}
              onChange={(v) => update("tripUnit", v)}
              placeholder="TMA"
            />
          </div>

          <Input
            label="Product Code"
            value={form.productCode}
            onChange={(v) => update("productCode", v)}
            placeholder="1SDA067397R1"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit"
              value={form.unit}
              onChange={(v) => update("unit", v)}
              placeholder="Nos."
            />

            <Input
              label="Listed Price"
              type="number"
              value={form.listedPrice}
              onChange={(v) => update("listedPrice", v)}
              placeholder="14800"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Technical Description
            </label>

            <textarea
              value={form.technicalDescription}
              onChange={(e) =>
                update("technicalDescription", e.target.value)
              }
              placeholder="Optional technical description"
              className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[90px]"
            />
          </div>

          <button
            onClick={saveProduct}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={17} />
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>

        <div className="xl:col-span-2 bg-white border rounded-[30px] p-6">
          <div className="relative mb-4">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, brand, country, code..."
              className="w-full border rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Brand</th>
                  <th className="p-3 text-left">Country</th>
                  <th className="p-3 text-left">Icu</th>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-right">Listed Price</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-semibold">
                      {item.productName}
                    </td>

                    <td className="p-3">{item.brand || "-"}</td>

                    <td className="p-3">{item.country || "-"}</td>

                    <td className="p-3">{item.icu || "-"}</td>

                    <td className="p-3">{item.productCode || "-"}</td>

                    <td className="p-3 text-right font-bold">
                      ৳ {Number(item.listedPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-400">
                      No product found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}