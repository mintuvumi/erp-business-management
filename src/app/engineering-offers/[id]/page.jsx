"use client";

import { useState } from "react";
import { Plus, Printer, Save, Trash2 } from "lucide-react";

const defaultDescription =
  "The Cubical Shall be vermin proof, well ventilated, floor stand indoor type factory assembled with hard drawn electrolytic copper busbars (TPNE) placed on porcelain insulator, suitable for 415V, 3 phase, 4 wires, 50Hz operation complete with all wiring and gutter space for maximum size of cable entrance suitable for top & bottom entry. The cubicle shall be made of 16/18 SWG steel clad sheet with weather proof powder coated color. All the doors shall be connected by ECC and all the live conductor will be protected by dead front construction inside the panel.";

export default function EngineeringOffersPage() {
  const [subject, setSubject] = useState("1000A MDB for 10th Floor : Floor Mount");
  const [description, setDescription] = useState(defaultDescription);

  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  const [items, setItems] = useState([
    {
      name: "1000A TP MCCB Adjustable",
      icu: "50 KA",
      trip: "TMA",
      productId: "XT5 1000 Ekip Dip",
      qty: 1,
      unit: "Nos.",
      brand: "ABB, Italy",
      pcsKg: "",
      purchasePrice: "",
      listedPrice: "",
      unitPrice: "",
      totalCost: "",
      totalPrice: "",
    },
  ]);

  const searchStock = async (value, index) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const res = await fetch(`/api/engineering-offers/stock-search?q=${value}`);
    const data = await res.json();

    if (data.success) {
      setSuggestions(data.data || []);
      setActiveIndex(index);
    }
  };

  const selectStock = (stock, index) => {
    const copy = [...items];

    const purchasePrice = Number(stock.lastPurchasePrice || stock.avgCost || 0);
    const listedPrice = Number(stock.salePrice || stock.mrp || purchasePrice || 0);

    copy[index] = {
      ...copy[index],
      name: stock.itemName || "",
      brand: stock.brand || "",
      unit: stock.unit || "Nos.",
      qty: Number(copy[index].qty || 1),
      purchasePrice,
      listedPrice,
      unitPrice: listedPrice,
      totalCost: purchasePrice * Number(copy[index].qty || 1),
      totalPrice: listedPrice * Number(copy[index].qty || 1),
    };

    setItems(copy);
    setSuggestions([]);
    setActiveIndex(null);
  };

  const updateItem = (index, field, value) => {
    const copy = [...items];
    copy[index][field] = value;

    const qty = Number(copy[index].qty || 0);
    const purchasePrice = Number(copy[index].purchasePrice || 0);
    const unitPrice = Number(copy[index].unitPrice || copy[index].listedPrice || 0);

    copy[index].totalCost = purchasePrice * qty;
    copy[index].totalPrice = unitPrice * qty;

    setItems(copy);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        name: "",
        icu: "",
        trip: "",
        productId: "",
        qty: 1,
        unit: "Nos.",
        brand: "",
        pcsKg: "",
        purchasePrice: "",
        listedPrice: "",
        unitPrice: "",
        totalCost: "",
        totalPrice: "",
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-200 p-3 md:p-5">
      <div className="mb-4 flex justify-between items-center bg-white rounded-2xl p-3 shadow-sm">
        <h1 className="font-bold text-xl">Engineering Offer Builder</h1>

        <div className="flex gap-2">
          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={16} />
            Add Item
          </button>

          <button
            onClick={() => window.print()}
            className="border px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </button>

          <button className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[900px_430px] gap-4 items-start">
        <div className="bg-white shadow-xl min-h-[1120px] p-8 mx-auto w-full relative">
          <Header />

          <div className="border border-black text-center font-bold text-sm py-1 mt-4">
            Technical Proposal for Supply of Electrical Distribution Board&apos;s
          </div>

          <table className="w-full border-collapse border border-black text-[11px] mt-4">
            <tbody>
              <tr className="bg-red-50">
                <td className="border border-black text-center font-bold w-10">01</td>
                <td className="border border-black text-center font-bold">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-center bg-transparent outline-none font-bold"
                  />
                </td>
                <td className="border border-black text-center font-bold w-16">Qty.</td>
              </tr>

              <tr>
                <td className="border border-black text-center text-red-600 font-bold">+</td>
                <td className="border border-black p-2">
                  <p className="font-bold mb-1">Description Panel Board</p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[95px] outline-none resize-none text-justify leading-5"
                  />
                </td>
                <td className="border border-black text-center text-blue-600 font-bold">1</td>
              </tr>
            </tbody>
          </table>

          <Section title="Cubical Dimension:" />

          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr>
                <Th>Height (mm)</Th>
                <Th>Width (mm)</Th>
                <Th>Depth (mm)</Th>
                <Th>Note</Th>
                <Th>Brand & Origin</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td red>1800</Td>
                <Td red>1100</Td>
                <Td red>600</Td>
                <Td>±5%</Td>
                <Td red>Hi-Tech AEL, BD</Td>
              </tr>
            </tbody>
          </table>

          <Section title="Copper Busbar Size:" />

          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr>
                <Th>Three Phase (A)</Th>
                <Th>H / mm</Th>
                <Th>W (mm)</Th>
                <Th>Qty.</Th>
                <Th>Zone</Th>
                <Th>Brand & Origin</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1240", "80", "10", "4", "TPN", "Copper Tech/Maghna"],
                ["620", "40", "10", "1", "Earthing", "Copper Tech/Maghna"],
                ["1085", "50", "14", "1", "1000A Connecting", "Copper Tech/Maghna"],
                ["155", "20", "5", "2", "160A Connecting", "Copper Tech/Maghna"],
                ["116.25", "15", "5", "13", "100A Copper / Cable", "Copper Tech/Maghna"],
                ["93", "15", "4", "3", "63+32A Cable", "Copper Tech/Maghna"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((col, j) => (
                    <Td key={j}>{col}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <Section title="Incoming:" />

          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr>
                <Th>Description of Circuit Breaker</Th>
                <Th>Icu</Th>
                <Th>Trip Unit</Th>
                <Th>Product ID</Th>
                <Th>Qty.</Th>
                <Th>Unit</Th>
                <Th>Brand & Origin</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <Td left>
                    <input
                      value={item.name}
                      onChange={(e) => {
                        updateItem(index, "name", e.target.value);
                        searchStock(e.target.value, index);
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  </Td>
                  <Td>
                    <input value={item.icu} onChange={(e) => updateItem(index, "icu", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.trip} onChange={(e) => updateItem(index, "trip", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.productId} onChange={(e) => updateItem(index, "productId", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.unit} onChange={(e) => updateItem(index, "unit", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.brand} onChange={(e) => updateItem(index, "brand", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          <Section title="Protection, Indication, Metering, Control Circuit & Accessories" />

          <table className="w-full border-collapse border border-black text-[11px]">
            <tbody>
              {[
                ["Panel Exhaust Fan", "2", "Set", "Reputed"],
                ["Panel Exhaust-Inlet Filter & Louver", "4", "Set", "Reputed"],
                ["All other Hinge, Door Lock, Panel Handle, Busbar Transparent, DIN rails, cable, lugs, gallon & accessories", "1", "Lot", "Reputed"],
                ["Wiring & Assemble", "1", "Lot", "HITAEL"],
              ].map((row, i) => (
                <tr key={i}>
                  <Td left>{row[0]}</Td>
                  <Td>{row[1]}</Td>
                  <Td>{row[2]}</Td>
                  <Td red={row[3] === "HITAEL"}>{row[3]}</Td>
                </tr>
              ))}
            </tbody>
          </table>

          <Footer />
        </div>

        <div className="bg-white shadow-xl p-6 sticky top-4">
          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr>
                <th className="border border-black p-2"></th>
                <th className="border border-black p-2"></th>
                <th colSpan="3" className="border border-black p-2 bg-red-100">
                  Costing
                </th>
                <th className="border border-black p-2 bg-cyan-400">
                  Sale
                </th>
              </tr>
              <tr>
                <Th>Pcs/Kg</Th>
                <Th>Purchase Price</Th>
                <Th>Listed Price</Th>
                <Th>Unit Price</Th>
                <Th>Total cost</Th>
                <Th>Total Price</Th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <Td>
                    <input value={item.pcsKg} onChange={(e) => updateItem(index, "pcsKg", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.purchasePrice} onChange={(e) => updateItem(index, "purchasePrice", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.listedPrice} onChange={(e) => updateItem(index, "listedPrice", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td>
                    <input value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} className="w-full text-center bg-transparent outline-none" />
                  </Td>
                  <Td red>{Number(item.totalCost || 0).toFixed(2)}</Td>
                  <Td green>{Number(item.totalPrice || 0).toFixed(2)}</Td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-2">
            {items.map((item, index) => (
              <div key={index} className="relative">
                {activeIndex === index && suggestions.length > 0 && (
                  <div className="bg-white border rounded-xl shadow-xl max-h-[250px] overflow-auto">
                    {suggestions.map((stock) => (
                      <button
                        key={stock._id}
                        onClick={() => selectStock(stock, index)}
                        className="w-full text-left p-3 border-b hover:bg-blue-50"
                      >
                        <p className="font-semibold">{stock.itemName}</p>
                        <p className="text-xs text-gray-500">
                          {stock.brand} • Stock: {stock.availableQty} {stock.unit}
                        </p>
                        <p className="text-xs text-blue-600">
                          Purchase: ৳ {Number(stock.lastPurchasePrice || stock.avgCost || 0).toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => removeItem(index)}
                  className="mt-2 text-red-500 text-sm flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Remove row {index + 1}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


import Image from "next/image";

function Header() {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className="w-[62px] h-[62px] rounded-full border-[4px] border-black flex items-center justify-center relative">
          <div className="absolute w-[4px] h-[55px] bg-red-600 rotate-45"></div>

          <div className="w-[26px] h-[26px] rounded-full border-[5px] border-black"></div>
        </div>

        <div>
          <h1 className="text-[34px] font-black text-red-600 leading-none tracking-wide uppercase">
            Hi-Tech Automation & Engineering Ltd.
          </h1>

          <p className="text-[11px] text-gray-700 mt-1 tracking-wide">
            We Believe in Ensuring Excellent in Commitment & Effort
          </p>
        </div>
      </div>

      <div className="w-[62px] h-[62px] rounded-full border-[4px] border-black flex items-center justify-center relative">
        <div className="absolute w-[4px] h-[55px] bg-red-600 rotate-45"></div>

        <div className="w-[26px] h-[26px] rounded-full border-[5px] border-black"></div>
      </div>
    </div>
  );
}


function Section({ title }) {
  return (
    <div className="border border-black border-t-0 px-2 py-1 text-[11px] font-bold flex gap-2">
      <span className="text-red-600">+</span>
      <span>{title}</span>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-16 text-center text-[9px] border-t border-red-500 pt-2">
      <p>House # 16/2, Road # 2, Section # 6/Ka, Senpara Parbata, Mirpur, Dhaka-1216</p>
      <p>Factory : Plot-101, Lane-10, Purbachal Road, Uttar Badda, Dhaka-1212</p>
      <p className="text-red-600 font-bold">
        Cell: +8801886578722, E-mail: info@hitechael.com, Web: www.hitechael.com
      </p>
    </div>
  );
}

function Th({ children }) {
  return <th className="border border-black px-1 py-1 text-center font-bold">{children}</th>;
}

function Td({ children, red = false, green = false, left = false }) {
  return (
    <td
      className={`border border-black px-1 py-1 ${
        left ? "text-left" : "text-center"
      } ${red ? "text-red-600" : ""} ${green ? "text-green-600" : ""}`}
    >
      {children}
    </td>
  );
}