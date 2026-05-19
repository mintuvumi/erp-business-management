"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  Mail,
  Plus,
  Printer,
  Save,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const emptyProductRow = {
  description: "",
  icu: "",
  tripUnit: "",
  productId: "",
  qty: "",
  unit: "Nos.",
  brand: "",
  pcsKg: "",
  purchasePrice: "",
  listedPrice: "",
  discountPercent: "",
  unitPrice: "",
  totalCost: "",
  totalPrice: "",
};

const defaultIncomingRows = [
  {
    description: "1000A TP MCCB Adjustable",
    icu: "50 KA",
    tripUnit: "TMA",
    productId: "XT5 1000 Ekip Dip",
    qty: "1",
    unit: "Nos.",
    brand: "ABB, Italy",
    pcsKg: "",
    purchasePrice: "",
    listedPrice: "",
    discountPercent: "",
    unitPrice: "",
    totalCost: "",
    totalPrice: "",
  },
];

const defaultOutgoingRows = [
  {
    description: "160A TP MCCB, Adjustable",
    icu: "25 KA",
    tripUnit: "TMA",
    productId: "XT1C 160 TMD",
    qty: "2",
    unit: "Nos.",
    brand: "ABB, Italy",
    pcsKg: "",
    purchasePrice: "",
    listedPrice: "",
    discountPercent: "",
    unitPrice: "",
    totalCost: "",
    totalPrice: "",
  },
];

const blueBtn =
  "px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition";
const greenBtn =
  "px-4 py-2 rounded-xl bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60";
const whiteBtn =
  "px-4 py-2 rounded-xl border bg-white flex items-center gap-2 hover:bg-gray-100 hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98] transition";

export default function EngineeringOffersPage() {
  const router = useRouter();
  const cellRefs = useRef({});

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggest, setActiveSuggest] = useState(null);
  const [suggestIndex, setSuggestIndex] = useState(0);

  const [offer, setOffer] = useState({
    offerNo: "",
    title: "Technical Proposal for Supply of Electrical Distribution Board's",
    subject: "1000A MDB for 10th Floor : Floor Mount",
    description:
      "The Cubical Shall be vermin proof, well ventilated, floor stand indoor type factory assembled with hard drawn electrolytic copper busbars (TPNE) placed on porcelain insulator, suitable for 415V, 3 phase, 4 wires, 50Hz operation complete with all wiring and gutter space for maximum size of cable entrance suitable for top & bottom entry.",
    height: "1800",
    width: "1100",
    depth: "600",
    note: "±5%",
    cubicalBrand: "Hi-Tech AEL, BD",
    profitPercent: "20",
  });

  const [busbarRows, setBusbarRows] = useState([
    ["1240", "80", "10", "4", "TPN", "Copper Tech/Maghna"],
    ["620", "40", "10", "1", "Earthing", "Copper Tech/Maghna"],
    ["1085", "50", "14", "1", "1000A Connecting", "Copper Tech/Maghna"],
    ["155", "20", "5", "2", "160A Connecting", "Copper Tech/Maghna"],
    ["116.25", "15", "5", "13", "100A Copper / Cable", "Copper Tech/Maghna"],
    ["93", "15", "4", "3", "63+32A Cable", "Copper Tech/Maghna"],
  ]);

  const [incomingRows, setIncomingRows] = useState(defaultIncomingRows);
  const [outgoingRows, setOutgoingRows] = useState(defaultOutgoingRows);

  const [accessoryRows, setAccessoryRows] = useState([
    { description: "Panel Exhaust Fan", qty: "2", unit: "Set", brand: "Reputed" },
    { description: "Panel Exhaust-Inlet Filter & Louver", qty: "4", unit: "Set", brand: "Reputed" },
    {
      description:
        "All other Hinge, Door Lock, Panel Handle, Busbar Transparent, DIN rails, cable, lugs, gallon & accessories",
      qty: "1",
      unit: "Lot",
      brand: "Reputed",
    },
    { description: "Wiring & Assemble", qty: "1", unit: "Lot", brand: "HITAEL" },
  ]);

  useEffect(() => {
    const loadSavedOffer = async () => {
      try {
        const res = await fetch("/api/engineering-offer-builder");
        const data = await res.json();

        if (data.success && data.data?.offerData) {
          const saved = data.data.offerData;
          if (saved.offer) setOffer(saved.offer);
          if (saved.busbarRows) setBusbarRows(saved.busbarRows);
          if (saved.incomingRows) setIncomingRows(saved.incomingRows);
          if (saved.outgoingRows) setOutgoingRows(saved.outgoingRows);
          if (saved.accessoryRows) setAccessoryRows(saved.accessoryRows);
        }
      } catch (error) {
        console.error("LOAD_SAVED_OFFER_ERROR:", error);
      }
    };

    loadSavedOffer();
  }, []);

  const costingRows = useMemo(
    () => [
      ...incomingRows.map((row, i) => ({ ...row, section: "incoming", realIndex: i })),
      ...outgoingRows.map((row, i) => ({ ...row, section: "outgoing", realIndex: i })),
    ],
    [incomingRows, outgoingRows]
  );

  const totalCost = costingRows.reduce(
    (sum, row) => sum + Number(row.totalCost || 0),
    0
  );

  const totalItemSale = costingRows.reduce(
    (sum, row) => sum + Number(row.totalPrice || 0),
    0
  );

  const profitAmount = totalCost * (Number(offer.profitPercent || 0) / 100);
  const totalSale = totalCost + profitAmount;

  const updateOffer = (field, value) => {
    setOffer((prev) => ({ ...prev, [field]: value }));
  };

  const calculateRow = (row) => {
    const qty = Number(row.qty || 0);
    const purchasePrice = Number(row.purchasePrice || 0);
    const listedPrice = Number(row.listedPrice || 0);
    const discountPercent = Number(row.discountPercent || 0);

    const unitPrice =
      listedPrice > 0
        ? listedPrice - (listedPrice * discountPercent) / 100
        : Number(row.unitPrice || 0);

    const totalCostValue = purchasePrice * qty;
    const totalPriceValue = unitPrice * qty;

    return {
      ...row,
      unitPrice: unitPrice ? unitPrice.toFixed(2) : "",
      totalCost: totalCostValue ? totalCostValue.toFixed(2) : "",
      totalPrice: totalPriceValue ? totalPriceValue.toFixed(2) : "",
    };
  };

  const updateProductRow = (section, index, field, value) => {
    const setter = section === "incoming" ? setIncomingRows : setOutgoingRows;

    setter((prev) => {
      const copy = [...prev];
      copy[index] = calculateRow({
        ...copy[index],
        [field]: value,
      });
      return copy;
    });
  };

  const addProductRow = (section) => {
    const setter = section === "incoming" ? setIncomingRows : setOutgoingRows;
    setter((prev) => [...prev, { ...emptyProductRow }]);
  };

  const removeProductRow = (section, index) => {
    const setter = section === "incoming" ? setIncomingRows : setOutgoingRows;
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAccessory = (index, field, value) => {
    setAccessoryRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addAccessory = () => {
    setAccessoryRows((prev) => [
      ...prev,
      { description: "", qty: "", unit: "", brand: "" },
    ]);
  };

  const removeAccessory = (index) => {
    setAccessoryRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBusbar = (row, col, value) => {
    setBusbarRows((prev) => {
      const copy = [...prev];
      copy[row][col] = value;
      return copy;
    });
  };

  const setCellRef = (key, el) => {
    if (el) cellRefs.current[key] = el;
  };

  const focusCell = (key) => {
    cellRefs.current[key]?.focus();
  };

  const searchProducts = async (value, section, rowIndex) => {
    updateProductRow(section, rowIndex, "description", value);

    if (!value.trim()) {
      setSuggestions([]);
      setActiveSuggest(null);
      setSuggestIndex(0);
      return;
    }

    try {
      const res = await fetch(
        `/api/offer-products/search?q=${encodeURIComponent(value)}`
      );
      const data = await res.json();

      if (data.success) {
        setSuggestions(data.data || []);
        setActiveSuggest({ section, rowIndex });
        setSuggestIndex(0);
      }
    } catch (error) {
      console.error("PRODUCT_SEARCH_ERROR:", error);
    }
  };

  const selectProduct = (product) => {
    if (!activeSuggest) return;

    const { section, rowIndex } = activeSuggest;

    updateProductRow(section, rowIndex, "description", product.productName || "");
    updateProductRow(section, rowIndex, "brand", product.brand || "");
    updateProductRow(section, rowIndex, "unit", product.unit || "Nos.");
    updateProductRow(section, rowIndex, "icu", product.icu || "");
    updateProductRow(section, rowIndex, "tripUnit", product.tripUnit || "");
    updateProductRow(section, rowIndex, "productId", product.productCode || "");
    updateProductRow(section, rowIndex, "purchasePrice", product.purchasePrice || "");
    updateProductRow(section, rowIndex, "listedPrice", product.listedPrice || "");
    updateProductRow(section, rowIndex, "unitPrice", product.listedPrice || "");

    setSuggestions([]);
    setActiveSuggest(null);
    setSuggestIndex(0);

    setTimeout(() => {
      focusCell(`${section}-${rowIndex}-4`);
    }, 30);
  };

  const handleKey = (e, options) => {
    const { section, rowIndex, colIndex, maxCol = 6, type = "technical" } = options;

    const isSuggestionActive =
      activeSuggest?.section === section &&
      activeSuggest?.rowIndex === rowIndex &&
      suggestions.length > 0 &&
      colIndex === 0 &&
      type === "technical";

    if (isSuggestionActive && e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (isSuggestionActive && e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (isSuggestionActive && e.key === "Enter") {
      e.preventDefault();
      selectProduct(suggestions[suggestIndex]);
      return;
    }

    if (e.key === "Escape") {
      setSuggestions([]);
      setActiveSuggest(null);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (type === "technical") {
        if (section === "incoming" && rowIndex === incomingRows.length - 1) {
          addProductRow("incoming");
        }

        if (section === "outgoing" && rowIndex === outgoingRows.length - 1) {
          addProductRow("outgoing");
        }

        setTimeout(() => {
          focusCell(`${section}-${rowIndex + 1}-0`);
        }, 50);
      }

      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();

      if (e.shiftKey) {
        focusCell(`${section}-${rowIndex}-${Math.max(colIndex - 1, 0)}`);
      } else if (type === "technical" && colIndex === maxCol) {
        focusCell(`cost-${section}-${rowIndex}-0`);
      } else if (type === "cost" && colIndex === 5) {
        focusCell(`${section}-${rowIndex + 1}-0`);
      } else {
        focusCell(
          type === "cost"
            ? `cost-${section}-${rowIndex}-${Math.min(colIndex + 1, 5)}`
            : `${section}-${rowIndex}-${Math.min(colIndex + 1, maxCol)}`
        );
      }

      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(
        type === "cost"
          ? `cost-${section}-${rowIndex + 1}-${colIndex}`
          : `${section}-${rowIndex + 1}-${colIndex}`
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(
        type === "cost"
          ? `cost-${section}-${Math.max(rowIndex - 1, 0)}-${colIndex}`
          : `${section}-${Math.max(rowIndex - 1, 0)}-${colIndex}`
      );
      return;
    }

    // Left/Right, Backspace, Delete normal typing/editing behavior থাকবে
  };

  const saveOffer = async () => {
    try {
      setSaving(true);
      setMessage("");

      const res = await fetch("/api/engineering-offer-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerNo: offer.offerNo,
          title: offer.title,
          subject: offer.subject,
          description: offer.description,
          profitPercent: offer.profitPercent,
          offerData: {
            offer,
            busbarRows,
            incomingRows,
            outgoingRows,
            accessoryRows,
            totalCost,
            totalItemSale,
            profitAmount,
            totalSale,
          },
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      setOffer((prev) => ({
        ...prev,
        offerNo: data.data.offerNo,
      }));

      setMessage(`Saved successfully: ${data.data.offerNo}`);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      setMessage(error.message || "Save failed");

      setTimeout(() => {
        setMessage("");
      }, 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-[#d7d7d7] overflow-auto print:static print:bg-white">
      <div className="no-print sticky top-0 z-50 bg-white border-b p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className={whiteBtn}>
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 className="font-bold text-xl">Engineering Offer Builder</h1>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              placeholder="Search old offer, customer, item..."
              className="border rounded-xl pl-9 pr-3 py-2 w-[340px] outline-none hover:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
            />
          </div>
        </div>



        <div className="flex flex-wrap gap-2">
  <button onClick={() => addProductRow("incoming")} className={blueBtn}>
    <Plus size={16} />
    Add Incoming
  </button>

  <button onClick={() => addProductRow("outgoing")} className={blueBtn}>
    <Plus size={16} />
    Add Outgoing
  </button>

  <button onClick={saveOffer} disabled={saving} className={greenBtn}>
    <Save size={16} />
    {saving ? "Saving..." : "Save"}
  </button>

  <button
    onClick={() => {
      saveOffer();

      setTimeout(() => {
        window.open("/commercial-offers", "_blank");
      }, 500);
    }}
    className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-2"
  >
    Commercial Offer
  </button>

  <button onClick={() => window.print()} className={whiteBtn}>
    <Printer size={16} />
    Print
  </button>

  <button className={whiteBtn}>
    <Download size={16} />
    PDF
  </button>

  <button className={whiteBtn}>
    <Mail size={16} />
    Email
  </button>

  <button className={whiteBtn}>
    <Share2 size={16} />
    Share
  </button>
  </div>
</div>


      {message && (
        <div className="no-print fixed top-20 right-5 z-[9999999] bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold">
          {message}
        </div>
      )}

      <div className="print-area p-3 overflow-auto">
        <div className="min-w-[1380px] grid grid-cols-[820px_520px] gap-5 justify-center items-start">
          <A4Page>
            <Header />

            <Editable
              value={offer.title}
              onChange={(v) => updateOffer("title", v)}
              className="w-full border border-black text-center font-bold text-[12px] py-[3px] mt-4"
            />

            <table className="w-full table-fixed border-collapse border border-black text-[10px] mt-3">
              <tbody>
                <tr className="bg-[#f8eaea]">
                  <td className="border border-black text-center font-bold w-[38px]">
                    <Editable value="01" className="w-full text-center font-bold" />
                  </td>
                  <td className="border border-black text-center font-bold">
                    <Editable
                      value={offer.subject}
                      onChange={(v) => updateOffer("subject", v)}
                      className="w-full text-center font-bold"
                    />
                  </td>
                  <td className="border border-black text-center font-bold w-[65px]">
                    <Editable value="Qty." className="w-full text-center font-bold" />
                  </td>
                </tr>

                <tr>
                  <td className="border border-black text-center text-red-600 font-bold align-top">
                    <Editable value="→" className="w-full text-center text-red-600 font-bold" />
                  </td>
                  <td className="border border-black p-2">
                    <Editable value="Description Panel Board" className="w-full font-bold mb-1" />
                    <textarea
                      value={offer.description}
                      onChange={(e) => updateOffer("description", e.target.value)}
                      className="w-full min-h-[86px] text-[10px] leading-[15px] resize-none outline-none bg-transparent"
                    />
                  </td>
                  <td className="border border-black text-center text-blue-600 font-bold">
                    <Editable value="1" className="w-full text-center text-blue-600 font-bold" />
                  </td>
                </tr>
              </tbody>
            </table>

            <SectionTitle value="Cubical Dimension:" />

            <table className="w-full table-fixed border-collapse border border-black text-[10px]">
              <tbody>
                <tr>
                  {["Height (mm)", "Width (mm)", "Depth (mm)", "Note", "Brand & Origin"].map(
                    (h) => (
                      <Th key={h}>
                        <Editable value={h} className="w-full text-center font-bold" />
                      </Th>
                    )
                  )}
                </tr>
                <tr>
                  <Td red>
                    <Cell value={offer.height} onChange={(v) => updateOffer("height", v)} />
                  </Td>
                  <Td red>
                    <Cell value={offer.width} onChange={(v) => updateOffer("width", v)} />
                  </Td>
                  <Td red>
                    <Cell value={offer.depth} onChange={(v) => updateOffer("depth", v)} />
                  </Td>
                  <Td>
                    <Cell value={offer.note} onChange={(v) => updateOffer("note", v)} />
                  </Td>
                  <Td red>
                    <Cell
                      value={offer.cubicalBrand}
                      onChange={(v) => updateOffer("cubicalBrand", v)}
                    />
                  </Td>
                </tr>
              </tbody>
            </table>



            <SectionTitle value="Copper Busbar Size:" />

            <table className="w-full table-fixed border-collapse border border-black text-[10px]">
              <tbody>
                <tr>
                  {["Three Phase (A)", "H / mm", "W (mm)", "Qty.", "Zone", "Brand & Origin"].map(
                    (h) => (
                      <Th key={h}>
                        <Editable value={h} className="w-full text-center font-bold" />
                      </Th>
                    )
                  )}
                </tr>
                {busbarRows.map((row, r) => (
                  <tr key={r}>
                    {row.map((col, c) => (
                      <Td key={c}>
                        <Cell value={col} onChange={(v) => updateBusbar(r, c, v)} />
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <SectionTitle value="Incoming:" />
            <TechnicalRows
              section="incoming"
              rows={incomingRows}
              updateRow={updateProductRow}
              removeRow={removeProductRow}
              handleKey={handleKey}
              setCellRef={setCellRef}
              searchProducts={searchProducts}
              suggestions={suggestions}
              activeSuggest={activeSuggest}
              suggestIndex={suggestIndex}
              selectProduct={selectProduct}
            />

            <SectionTitle value="Outgoing:" />
            <TechnicalRows
              section="outgoing"
              rows={outgoingRows}
              updateRow={updateProductRow}
              removeRow={removeProductRow}
              handleKey={handleKey}
              setCellRef={setCellRef}
              searchProducts={searchProducts}
              suggestions={suggestions}
              activeSuggest={activeSuggest}
              suggestIndex={suggestIndex}
              selectProduct={selectProduct}
            />

            <SectionTitle value="Protection, Indication, Metering, Control Circuit & Accessories" />
            <AccessoryRows
              rows={accessoryRows}
              updateAccessory={updateAccessory}
              addAccessory={addAccessory}
              removeAccessory={removeAccessory}
            />

            <Footer />
          </A4Page>

          <div className="costing-panel bg-white shadow-xl p-[18px] mt-[164px] min-h-[640px] rounded-xl">
            <div className="mb-3 rounded-xl bg-blue-600 text-white px-4 py-2 font-bold text-center">
              Calculation Summary
            </div>

            <CostingSheet
              incomingRows={incomingRows}
              outgoingRows={outgoingRows}
              updateRow={updateProductRow}
              totalCost={totalCost}
              totalItemSale={totalItemSale}
              profitPercent={offer.profitPercent}
              updateProfit={(v) => updateOffer("profitPercent", v)}
              profitAmount={profitAmount}
              totalSale={totalSale}
              setCellRef={setCellRef}
              handleKey={handleKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function A4Page({ children }) {
  return (
    <div className="a4-page bg-white shadow-xl px-[58px] py-[16px] min-h-[1120px]">
      {children}
    </div>
  );
}

function Header() {
  return (
    <div className="flex justify-center">
      <img
        src="/offer/hitech-logo.png"
        alt="Hi-Tech Logo"
        className="w-[540px] h-auto object-contain"
      />
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-[70px]">
      <img
        src="/offer/hitech-footer.png"
        alt="Footer"
        className="w-full h-auto object-contain"
      />
    </div>
  );
}

function SectionTitle({ value }) {
  const [text, setText] = useState(value);
  return (
    <div className="border border-black border-t-0 bg-white text-[10px] font-bold px-2 py-[3px] flex gap-2">
      <Editable value="→" className="w-[14px] text-red-600 font-bold" />
      <Editable value={text} onChange={setText} className="font-bold flex-1" />
    </div>
  );
}

function TechnicalRows({
  section,
  rows,
  updateRow,
  removeRow,
  handleKey,
  setCellRef,
  searchProducts,
  suggestions,
  activeSuggest,
  suggestIndex,
  selectProduct,
}) {
  const columns = [
    ["description", "Description of Circuit Breaker", "28%"],
    ["icu", "Icu", "10%"],
    ["tripUnit", "Trip Unit", "12%"],
    ["productId", "Product ID", "18%"],
    ["qty", "Qty.", "8%"],
    ["unit", "Unit", "8%"],
    ["brand", "Brand & Origin", "14%"],
  ];





  return (
    <table className="w-full table-fixed border-collapse border border-black text-[10px]">
      <colgroup>
        {columns.map(([field, , width]) => (
          <col key={field} style={{ width }} />
        ))}
        <col className="no-print" style={{ width: "2%" }} />
      </colgroup>
      <tbody>
        <tr>
          {columns.map(([, label]) => (
            <Th key={label}>
              <Editable value={label} className="w-full text-center font-bold" />
            </Th>
          ))}
          <Th className="no-print"></Th>
        </tr>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map(([field], colIndex) => (
              <Td key={field} left={field === "description"}>
                <input
                  ref={(el) => setCellRef(`${section}-${rowIndex}-${colIndex}`, el)}
                  value={row[field] || ""}
                  onKeyDown={(e) =>
                    handleKey(e, {
                      section,
                      rowIndex,
                      colIndex,
                      maxCol: columns.length - 1,
                      type: "technical",
                    })
                  }
                  onChange={(e) => {
                    if (field === "description") {
                      searchProducts(e.target.value, section, rowIndex);
                    } else {
                      updateRow(section, rowIndex, field, e.target.value);
                    }
                  }}
                  className={`w-full min-h-[22px] bg-transparent outline-none px-1 ${
                    field === "description" ? "text-left" : "text-center"
                  }`}
                />

                {field === "description" &&
                  activeSuggest?.section === section &&
                  activeSuggest?.rowIndex === rowIndex &&
                  suggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-[999999] bg-white border shadow-xl rounded-xl w-[390px] max-h-[260px] overflow-auto no-print">
                      {suggestions.map((item, i) => (
                        <button
                          key={`${item.source || "item"}-${item._id || i}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectProduct(item);
                          }}
                          className={`w-full text-left px-3 py-2 border-b ${
                            i === suggestIndex ? "bg-blue-100" : "hover:bg-blue-50"
                          }`}
                        >
                          <div className="font-bold text-xs">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {item.brand || ""} {item.country ? `— ${item.country}` : ""} — ৳
                            {Number(item.listedPrice || 0).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </Td>
            ))}
            <Td className="no-print">

              <button
                onClick={() => removeRow(section, rowIndex)}
                className="text-red-600 hover:text-white hover:bg-red-600 rounded p-1 transition"
              >
                <Trash2 size={12} />
              </button>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}




function AccessoryRows({ rows, updateAccessory, addAccessory, removeAccessory }) {
  return (
    <table className="w-full table-fixed border-collapse border border-black text-[10px]">
      <tbody>
        <tr>
          {["Description", "Qty.", "Unit", "Brand & Origin"].map((h) => (
            <Th key={h}>
              <Editable value={h} className="w-full text-center font-bold" />
            </Th>
          ))}
          <Th className="no-print"></Th>
        </tr>
        {rows.map((row, index) => (
          <tr key={index}>
            <Td left>
              <Cell
                value={row.description}
                onChange={(v) => updateAccessory(index, "description", v)}
                left
              />
            </Td>
            <Td>
              <Cell value={row.qty} onChange={(v) => updateAccessory(index, "qty", v)} />
            </Td>
            <Td>
              <Cell value={row.unit} onChange={(v) => updateAccessory(index, "unit", v)} />
            </Td>
            <Td red={row.brand === "HITAEL"}>
              <Cell value={row.brand} onChange={(v) => updateAccessory(index, "brand", v)} />
            </Td>
            <Td className="no-print">
              <button
                onClick={() => removeAccessory(index)}
                className="text-red-600 hover:text-white hover:bg-red-600 rounded p-1 transition"
              >
                <Trash2 size={12} />
              </button>
            </Td>
          </tr>
        ))}
        <tr className="no-print">
          <td colSpan="5" className="border border-black p-1">
            <button
              onClick={addAccessory}
              className="text-blue-600 text-xs hover:text-blue-800 hover:underline transition"
            >
              + Add Accessory
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function CostingSheet({
  incomingRows,
  outgoingRows,
  updateRow,
  totalCost,
  totalItemSale,
  profitPercent,
  updateProfit,
  profitAmount,
  totalSale,
  setCellRef,
  handleKey,
}) {
  const rows = [
    ...incomingRows.map((r, i) => ({ ...r, section: "incoming", realIndex: i })),
    ...outgoingRows.map((r, i) => ({ ...r, section: "outgoing", realIndex: i })),
  ];

  return (
    <div>
      <table className="w-full table-fixed border-collapse border border-dotted border-black text-[10px]">
        <thead className="sticky top-0 z-20 bg-white">
          <tr>
            <td className="border border-dotted border-black p-1"></td>
            <td className="border border-dotted border-black p-1"></td>
            <td
              colSpan="4"
              className="border border-dotted border-black p-1 bg-[#f4c7c3] text-center font-bold"
            >
              Costing
            </td>
            <td className="border border-dotted border-black p-1 bg-[#00a6d6] text-center font-bold">
              Sale
            </td>
          </tr>
          <tr>
            {["Pcs/Kg", "Purchase", "Listed", "Disc %", "Unit", "Total Cost", "Total Sale"].map(
              (h) => (
                <CostTh key={h}>
                  <Editable value={h} className="w-full text-center font-bold" />
                </CostTh>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="h-[28px]">
              {[
                ["pcsKg", row.pcsKg],
                ["purchasePrice", row.purchasePrice],
                ["listedPrice", row.listedPrice],
                ["discountPercent", row.discountPercent],
                ["unitPrice", row.unitPrice],
              ].map(([field, value], colIndex) => (
                <CostTd key={field}>
                  <CostInput
                    refKey={`cost-${row.section}-${row.realIndex}-${colIndex}`}
                    setCellRef={setCellRef}
                    value={value}
                    onKeyDown={(e) =>
                      handleKey(e, {
                        section: row.section,
                        rowIndex: row.realIndex,
                        colIndex,
                        type: "cost",
                      })
                    }
                    onChange={(v) => updateRow(row.section, row.realIndex, field, v)}
                  />
                </CostTd>
              ))}

              <CostTd red>{Number(row.totalCost || 0).toFixed(2)}</CostTd>
              <CostTd green>{Number(row.totalPrice || 0).toFixed(2)}</CostTd>
            </tr>
          ))}
          {Array.from({ length: Math.max(12, 24 - rows.length) }).map((_, i) => (
            <tr key={`blank-${i}`} className="h-[28px]">
              <CostTd></CostTd>
              <CostTd></CostTd>
              <CostTd></CostTd>
              <CostTd></CostTd>
              <CostTd></CostTd>
              <CostTd></CostTd>
              <CostTd></CostTd>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm space-y-2">
        <div className="flex justify-between font-bold text-blue-900">
          <span>Total Cost</span>
          <span className="text-red-600">৳ {totalCost.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-bold text-blue-900">
          <span>Total Item Sale</span>
          <span className="text-green-700">৳ {totalItemSale.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center font-bold text-blue-900">
          <span>Profit %</span>
          <input
            value={profitPercent || ""}
            onChange={(e) => updateProfit(e.target.value)}
            className="w-[90px] text-center bg-white border rounded-lg px-2 py-1 outline-none"
          />
        </div>

        <div className="flex justify-between font-bold text-blue-900">
          <span>Profit Amount</span>
          <span className="text-blue-700">৳ {profitAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-black text-green-700 border-t border-blue-200 pt-2">
          <span>Total Sale Price</span>
          <span>৳ {totalSale.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function Editable({ value, onChange, className = "" }) {
  const [localValue, setLocalValue] = useState(value || "");
  const currentValue = onChange ? value || "" : localValue;

  return (
    <input
      value={currentValue}
      onChange={(e) => {
        if (onChange) onChange(e.target.value);
        else setLocalValue(e.target.value);
      }}
      className={`outline-none bg-transparent ${className}`}
    />
  );
}

function Cell({ value, onChange, left = false }) {
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full bg-transparent outline-none px-1 ${
        left ? "text-left" : "text-center"
      }`}
    />
  );
}

function Th({ children, className = "" }) {
  return (
    <td className={`border border-black px-1 py-[3px] text-center font-bold ${className}`}>
      {children}
    </td>
  );
}

function Td({ children, red = false, green = false, left = false, className = "" }) {
  return (
    <td
      className={`relative border border-black px-1 py-[3px] ${
        left ? "text-left" : "text-center"
      } ${red ? "text-red-600 font-bold" : ""} ${
        green ? "text-green-600 font-bold" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}

function CostTh({ children }) {
  return (
    <td className="border border-dotted border-black px-1 py-2 text-center font-bold">
      {children}
    </td>
  );
}

function CostTd({ children, red = false, green = false }) {
  return (
    <td
      className={`border border-dotted border-black px-1 py-1 text-center ${
        red ? "text-red-600" : ""
      } ${green ? "text-green-600" : ""}`}
    >
      {children}
    </td>
  );
}

function CostInput({ value, onChange, onKeyDown, refKey, setCellRef }) {
  return (
    <input
      ref={(el) => {
        if (refKey && setCellRef) setCellRef(refKey, el);
      }}
      value={value || ""}
      onKeyDown={onKeyDown}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-center bg-transparent outline-none px-1"
    />
  );
}