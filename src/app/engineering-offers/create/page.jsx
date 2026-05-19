"use client";

import { useState } from "react";

import {
  Plus,
  Trash2,
  Save,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function CreateEngineeringOfferPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [suggestions, setSuggestions] =
    useState([]);

  const [activeIndex, setActiveIndex] =
    useState(null);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    projectName: "",
    subject: "",
    validity: "7 Days",

    items: [
      {
        stockItemId: "",

        itemName: "",

        description: "",

        brand: "",

        qty: 1,

        unit: "pcs",

        purchasePrice: "",

        marginPercent: 20,

        unitPrice: "",

        total: "",
      },
    ],
  });

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateItem = (
    index,
    field,
    value
  ) => {
    const items = [...form.items];

    items[index][field] = value;

    const qty = Number(
      items[index].qty || 0
    );

    const purchasePrice = Number(
      items[index].purchasePrice || 0
    );

    const marginPercent = Number(
      items[index].marginPercent || 0
    );

    const unitPrice =
      purchasePrice +
      (purchasePrice *
        marginPercent) /
        100;

    items[index].unitPrice =
      unitPrice;

    items[index].total =
      qty * unitPrice;

    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  const searchStock = async (
    value,
    index
  ) => {
    try {
      if (!value.trim()) {
        setSuggestions([]);
        return;
      }

      const res = await fetch(
        `/api/engineering-offers/stock-search?q=${value}`
      );

      const data = await res.json();

      if (data.success) {
        setSuggestions(
          data.data || []
        );

        setActiveIndex(index);
      }
    } catch (error) {
      console.error(
        "STOCK_SEARCH_ERROR:",
        error
      );
    }
  };

  const selectStockItem = (
    stock,
    index
  ) => {
    const items = [...form.items];

    const purchasePrice =
      Number(
        stock.lastPurchasePrice ||
          stock.avgCost ||
          0
      );

    const marginPercent = 20;

    const unitPrice =
      purchasePrice +
      (purchasePrice *
        marginPercent) /
        100;

    items[index] = {
      ...items[index],

      stockItemId: stock._id,

      itemName:
        stock.itemName || "",

      brand: stock.brand || "",

      unit: stock.unit || "pcs",

      purchasePrice,

      marginPercent,

      unitPrice,

      qty: 1,

      total: unitPrice,
    };

    setForm((prev) => ({
      ...prev,
      items,
    }));

    setSuggestions([]);

    setActiveIndex(null);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,

      items: [
        ...prev.items,

        {
          stockItemId: "",

          itemName: "",

          description: "",

          brand: "",

          qty: 1,

          unit: "pcs",

          purchasePrice: "",

          marginPercent: 20,

          unitPrice: "",

          total: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    const items = form.items.filter(
      (_, i) => i !== index
    );

    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  const subtotal = form.items.reduce(
    (sum, item) =>
      sum + Number(item.total || 0),
    0
  );

  const saveOffer = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/engineering-offers",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...form,

            subtotal,

            grandTotal: subtotal,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(
          data.message
        );
      }

      alert("Offer Created");

      router.push(
        "/engineering-offers"
      );
    } catch (error) {
      console.error(
        "OFFER_CREATE_ERROR:",
        error
      );

      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[30px] p-6">
        <h1 className="text-2xl font-bold">
          Create Engineering
          Offer
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Technical &
          Commercial Offer
          System
        </p>
      </div>

      <div className="bg-white border rounded-[30px] p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            value={
              form.customerName
            }
            onChange={(v) =>
              update(
                "customerName",
                v
              )
            }
          />

          <Input
            label="Customer Phone"
            value={
              form.customerPhone
            }
            onChange={(v) =>
              update(
                "customerPhone",
                v
              )
            }
          />

          <Input
            label="Project Name"
            value={
              form.projectName
            }
            onChange={(v) =>
              update(
                "projectName",
                v
              )
            }
          />

          <Input
            label="Subject"
            value={form.subject}
            onChange={(v) =>
              update(
                "subject",
                v
              )
            }
          />
        </div>
      </div>

      <div className="bg-white border rounded-[30px] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">
            Technical Items
          </h2>

          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>

        <div className="overflow-x-auto mt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left">
                  Item
                </th>

                <th className="p-3 text-left">
                  Brand
                </th>

                <th className="p-3 text-left">
                  Qty
                </th>

                <th className="p-3 text-left">
                  Cost
                </th>

                <th className="p-3 text-left">
                  Margin %
                </th>

                <th className="p-3 text-left">
                  Offer Price
                </th>

                <th className="p-3 text-left">
                  Total
                </th>

                <th className="p-3 text-left"></th>
              </tr>
            </thead>

            <tbody>
              {form.items.map(
                (item, index) => (
                  <tr
                    key={index}
                    className="border-t"
                  >
                    <td className="p-2">
                      <div className="relative">
                        <input
                          value={
                            item.itemName
                          }
                          onChange={(
                            e
                          ) => {
                            updateItem(
                              index,
                              "itemName",
                              e.target
                                .value
                            );

                            searchStock(
                              e.target
                                .value,
                              index
                            );
                          }}
                          placeholder="Search stock item..."
                          className="w-full border rounded-xl p-2"
                        />

                        {activeIndex ===
                          index &&
                          suggestions.length >
                            0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-[250px] overflow-auto">
                              {suggestions.map(
                                (
                                  stock
                                ) => (
                                  <button
                                    key={
                                      stock._id
                                    }
                                    type="button"
                                    onClick={() =>
                                      selectStockItem(
                                        stock,
                                        index
                                      )
                                    }
                                    className="w-full text-left p-3 hover:bg-blue-50 border-b"
                                  >
                                    <p className="font-semibold">
                                      {
                                        stock.itemName
                                      }
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                      {
                                        stock.brand
                                      }{" "}
                                      •{" "}
                                      {
                                        stock.availableQty
                                      }{" "}
                                      {
                                        stock.unit
                                      }
                                    </p>

                                    <p className="text-xs text-blue-600 mt-1">
                                      Cost:
                                      ৳
                                      {Number(
                                        stock.lastPurchasePrice ||
                                          stock.avgCost ||
                                          0
                                      ).toFixed(
                                        2
                                      )}
                                    </p>
                                  </button>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    </td>

                    <td className="p-2">
                      <input
                        value={
                          item.brand
                        }
                        onChange={(
                          e
                        ) =>
                          updateItem(
                            index,
                            "brand",
                            e.target
                              .value
                          )
                        }
                        className="w-full border rounded-xl p-2"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(
                          e
                        ) =>
                          updateItem(
                            index,
                            "qty",
                            e.target
                              .value
                          )
                        }
                        className="w-24 border rounded-xl p-2"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        value={
                          item.purchasePrice
                        }
                        onChange={(
                          e
                        ) =>
                          updateItem(
                            index,
                            "purchasePrice",
                            e.target
                              .value
                          )
                        }
                        className="w-28 border rounded-xl p-2"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        value={
                          item.marginPercent
                        }
                        onChange={(
                          e
                        ) =>
                          updateItem(
                            index,
                            "marginPercent",
                            e.target
                              .value
                          )
                        }
                        className="w-24 border rounded-xl p-2"
                      />
                    </td>

                    <td className="p-2 font-semibold">
                      ৳{" "}
                      {Number(
                        item.unitPrice ||
                          0
                      ).toFixed(2)}
                    </td>

                    <td className="p-2 font-bold">
                      ৳{" "}
                      {Number(
                        item.total || 0
                      ).toFixed(2)}
                    </td>

                    <td className="p-2">
                      <button
                        onClick={() =>
                          removeItem(
                            index
                          )
                        }
                        className="text-red-500"
                      >
                        <Trash2
                          size={18}
                        />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-[320px] bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Grand Total
              </span>

              <span className="font-bold text-2xl">
                ৳{" "}
                {subtotal.toFixed(
                  2
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveOffer}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2"
          >
            <Save size={18} />

            {loading
              ? "Saving..."
              : "Save Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="text-sm text-gray-500">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full mt-1 border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}