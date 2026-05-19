"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  Mail,
  Plus,
  Printer,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const logoPath = "/offer/hitech-logo.png";
const footerPath = "/offer/hitech-footer.png";

const emptyItem = {
  description: "",
  qty: "1",
  unit: "Set",
  unitPrice: "",
  totalPrice: "",
};

const defaultTerms = [
  "Validity : Our offer will remain valid for a period of 10 days from the date of this offer.",
  "Delivery : Within 15 days after receipt of confirmed order & payment as per clause # 3.",
  "Payment : 70% Cash along with order & 30% Before Delivery.",
  "Guarantee : We guarantee the goods of our supply against any defects in materials and workmanship during manufacturing for a period of 12 months.",
];

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcItem(row) {
  const qty = Number(row.qty || 0);
  const unitPrice = Number(row.unitPrice || 0);

  return {
    ...row,
    totalPrice: qty * unitPrice,
  };
}

export default function CommercialOfferPage() {
  const router = useRouter();
  const refs = useRef({});

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [offerId, setOfferId] = useState("");
  const [header, setHeader] = useState({
    offerNo: "",
    referenceNo: "",
    customerName: "PAKIZA KNIT COMPOSITE LIMITED",
    customerAddress: "A-1/5, Mojibur (Borobolimeher) Savar,\nDhaka, Bangladesh.",
    kindAttention: "Head of Purchase",
    subject: "Offer for supply of ELECTRICAL DISTRIBUTION PANEL BOARD'S.",
    date: new Date().toISOString().slice(0, 10),
    validDate: "",
    requisitionNo: "N/A",
  });

  const [items, setItems] = useState([
    {
      description: "1000A MDB Panel: Floor Mount",
      qty: "1",
      unit: "Set",
      unitPrice: "692057.29",
      totalPrice: 692057.29,
    },
  ]);

  const [extraRows, setExtraRows] = useState([]);
  const [discount, setDiscount] = useState("");
  const [vatPercent, setVatPercent] = useState("");
  const [terms, setTerms] = useState(defaultTerms);

  const totals = useMemo(() => {
    const totalPrice = items.reduce(
      (sum, row) => sum + Number(row.totalPrice || 0),
      0
    );

    const extraTotal = extraRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const totalWithExtra = totalPrice + extraTotal;
    const discountAmount = Number(discount || 0);
    const afterDiscount = totalWithExtra - discountAmount;
    const vatAmount = afterDiscount * (Number(vatPercent || 0) / 100);
    const netPrice = afterDiscount + vatAmount;

    return {
      totalPrice,
      extraTotal,
      totalWithExtra,
      discountAmount,
      afterDiscount,
      vatAmount,
      netPrice,
    };
  }, [items, extraRows, discount, vatPercent]);

  useEffect(() => {
    loadCommercial();
    loadTechnicalItems();
  }, []);

  const loadCommercial = async () => {
    try {
      const res = await fetch("/api/commercial-offers");
      const data = await res.json();

      if (data.success && data.data) {
        const saved = data.data;
        setOfferId(saved._id || "");
        setHeader({
          offerNo: saved.offerNo || "",
          referenceNo: saved.referenceNo || "",
          customerName: saved.customerName || "",
          customerAddress: saved.customerAddress || "",
          kindAttention: saved.kindAttention || "",
          subject: saved.subject || "",
          date: saved.date || new Date().toISOString().slice(0, 10),
          validDate: saved.validDate || "",
          requisitionNo: saved.requisitionNo || "N/A",
        });
        setItems((saved.items || []).map(calcItem));
        setExtraRows(saved.extraRows || []);
        setDiscount(saved.discount || "");
        setVatPercent(saved.vatPercent || "");
        setTerms(saved.terms?.length ? saved.terms : defaultTerms);
      }
    } catch (error) {
      console.error("COMMERCIAL_LOAD_ERROR:", error);
    }
  };

  const loadTechnicalItems = async () => {
    try {
      const res = await fetch("/api/engineering-offer-builder");
      const data = await res.json();

      const saved = data?.data?.offerData;
      if (!saved) return;

      const technicalRows = [
        ...(saved.incomingRows || []),
        ...(saved.outgoingRows || []),
      ];

      const mapped = technicalRows
        .filter((row) => row.description)
        .map((row) =>
          calcItem({
            description: row.description || "",
            qty: row.qty || "1",
            unit: row.unit || "Set",
            unitPrice: row.totalPrice
              ? Number(row.totalPrice) / Number(row.qty || 1)
              : row.unitPrice || row.listedPrice || "",
            totalPrice: "",
          })
        );

      if (mapped.length > 0) {
        setItems(mapped);
      }

      if (saved.offer?.subject) {
        setHeader((prev) => ({
          ...prev,
          subject: saved.offer.subject,
        }));
      }
    } catch (error) {
      console.error("TECHNICAL_PULL_ERROR:", error);
    }
  };

  const setRef = (key, el) => {
    if (el) refs.current[key] = el;
  };

  const focusCell = (key) => {
    refs.current[key]?.focus();
  };

  const handleKey = (e, rowIndex, colIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (rowIndex === items.length - 1) {
        addItem();
      }

      setTimeout(() => {
        focusCell(`item-${rowIndex + 1}-0`);
      }, 40);
      return;
    }

    if (e.key === "Tab") {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(`item-${rowIndex + 1}-${colIndex}`);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(`item-${Math.max(rowIndex - 1, 0)}-${colIndex}`);
      return;
    }

    if (e.key === "ArrowRight") return;
    if (e.key === "ArrowLeft") return;
    if (e.key === "Backspace") return;
    if (e.key === "Delete") return;
  };

  const updateHeader = (field, value) => {
    setHeader((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = calcItem({
        ...copy[index],
        [field]: value,
      });
      return copy;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addExtraRow = () => {
    setExtraRows((prev) => [...prev, { title: "", amount: "" }]);
  };

  const updateExtra = (index, field, value) => {
    setExtraRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const removeExtra = (index) => {
    setExtraRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addTerm = () => {
    setTerms((prev) => [...prev, ""]);
  };

  const updateTerm = (index, value) => {
    setTerms((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const removeTerm = (index) => {
    setTerms((prev) => prev.filter((_, i) => i !== index));
  };

  const saveCommercial = async () => {
    try {
      setSaving(true);

      const payload = {
        _id: offerId || undefined,
        ...header,
        items,
        extraRows,
        terms,
        discount: Number(discount || 0),
        vatPercent: Number(vatPercent || 0),
        totals,
      };

      const res = await fetch("/api/commercial-offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setOfferId(data.data._id);
      setHeader((prev) => ({
        ...prev,
        offerNo: data.data.offerNo,
      }));

      setToast("Commercial offer saved successfully");
      setTimeout(() => setToast(""), 3000);
    } catch (error) {
      alert(error.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const shareOffer = async () => {
    const text = `Commercial Offer\nCustomer: ${header.customerName}\nNet Price: BDT ${money(
      totals.netPrice
    )}`;

    if (navigator.share) {
      await navigator.share({ title: "Commercial Offer", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Offer text copied");
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-[#d7d7d7] overflow-auto print:static print:bg-white">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .commercial-print-area,
          .commercial-print-area * {
            visibility: visible !important;
          }

          .commercial-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .no-print {
            display: none !important;
          }

          input,
          textarea {
            border: none !important;
            outline: none !important;
          }
        }
      `}</style>

      <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="font-bold text-xl">Commercial Offer Builder</h1>
            <p className="text-xs text-gray-500">
              Linked with technical offer and costing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadTechnicalItems}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
          >
            Pull Technical
          </button>

          <button
            onClick={addItem}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Item
          </button>

          <button
            onClick={saveCommercial}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border bg-white flex items-center gap-2 hover:bg-gray-50"
          >
            <Printer size={16} />
            Print
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border bg-white flex items-center gap-2 hover:bg-gray-50"
          >
            <Download size={16} />
            PDF
          </button>

          <button
            onClick={shareOffer}
            className="px-4 py-2 rounded-xl border bg-white flex items-center gap-2 hover:bg-gray-50"
          >
            <Share2 size={16} />
            Share
          </button>

          <button className="px-4 py-2 rounded-xl border bg-white flex items-center gap-2 hover:bg-gray-50">
            <Mail size={16} />
            Mail
          </button>
        </div>
      </div>

      {toast && (
        <div className="no-print fixed top-20 right-5 z-[9999999] bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold">
          {toast}
        </div>
      )}

      <div className="p-5 flex justify-center overflow-auto">
        <div className="commercial-print-area bg-white shadow-xl w-[794px] min-h-[1123px] px-[34px] pt-[28px] pb-[22px] relative">
          <Header />

          <div className="grid grid-cols-2 gap-16 mt-3 text-[11px]">
            <div className="border border-black">
              <EditableTitle value="CUSTOMER DETAILS" />
              <textarea
                value={`To,\n${header.customerName}\n${header.customerAddress}`}
                onChange={(e) => {
                  const lines = e.target.value.split("\n");
                  updateHeader("customerName", lines[1] || "");
                  updateHeader("customerAddress", lines.slice(2).join("\n"));
                }}
                className="w-full min-h-[78px] p-1 resize-none outline-none"
              />
            </div>

            <div className="border border-black">
              <InfoRow
                label="Kind Attn:"
                value={header.kindAttention}
                onChange={(v) => updateHeader("kindAttention", v)}
              />
              <InfoRow
                label="Reference No:"
                value={header.referenceNo}
                onChange={(v) => updateHeader("referenceNo", v)}
              />
              <InfoRow
                label="Date:"
                value={header.date}
                onChange={(v) => updateHeader("date", v)}
              />
              <InfoRow
                label="Valid Date:"
                value={header.validDate}
                onChange={(v) => updateHeader("validDate", v)}
              />
              <InfoRow
                label="Requisition No:"
                value={header.requisitionNo}
                onChange={(v) => updateHeader("requisitionNo", v)}
              />
            </div>
          </div>

          <div className="border border-black bg-[#f8e8e8] text-center font-bold text-[12px] mt-6 py-[2px]">
            FINANCIAL OFFER
          </div>

          <div className="border border-black mt-3 text-[11px] flex">
            <span className="font-bold px-1 border-r border-black">Sub:</span>
            <input
              value={header.subject}
              onChange={(e) => updateHeader("subject", e.target.value)}
              className="flex-1 px-1 outline-none font-semibold"
            />
          </div>

          <div className="text-[11px] mt-4 leading-5">
            <p>Dear Sir,</p>
            <p>
              Thanks for your enquiry, we are pleased to quote as per attached
              technical specifications & commercial terms and conditions stated below:
            </p>
          </div>

          <table className="w-full border-collapse border border-black text-[11px] mt-4">
            <thead>
              <tr className="font-bold text-center">
                <th className="border border-black w-[36px]">SL</th>
                <th className="border border-black">Descriptions</th>
                <th className="border border-black w-[52px]">Qty.</th>
                <th className="border border-black w-[52px]">Unit</th>
                <th className="border border-black w-[105px]">
                  Unit price<br />in taka
                </th>
                <th className="border border-black w-[110px]">
                  Total price<br />in taka
                </th>
                <th className="border border-black w-[26px] no-print"></th>
              </tr>
            </thead>

            <tbody>
              {items.map((row, index) => (
                <tr key={index}>
                  <td className="border border-black text-center">{index + 1}</td>

                  <td className="border border-black">
                    <input
                      ref={(el) => setRef(`item-${index}-0`, el)}
                      value={row.description}
                      onKeyDown={(e) => handleKey(e, index, 0)}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className="w-full px-1 py-[5px] outline-none font-semibold"
                    />
                  </td>

                  <td className="border border-black">
                    <input
                      ref={(el) => setRef(`item-${index}-1`, el)}
                      value={row.qty}
                      onKeyDown={(e) => handleKey(e, index, 1)}
                      onChange={(e) => updateItem(index, "qty", e.target.value)}
                      className="w-full px-1 py-[5px] outline-none text-center"
                    />
                  </td>

                  <td className="border border-black">
                    <input
                      ref={(el) => setRef(`item-${index}-2`, el)}
                      value={row.unit}
                      onKeyDown={(e) => handleKey(e, index, 2)}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                      className="w-full px-1 py-[5px] outline-none text-center"
                    />
                  </td>

                  <td className="border border-black">
                    <input
                      ref={(el) => setRef(`item-${index}-3`, el)}
                      value={row.unitPrice}
                      onKeyDown={(e) => handleKey(e, index, 3)}
                      onChange={(e) =>
                        updateItem(index, "unitPrice", e.target.value)
                      }
                      className="w-full px-1 py-[5px] outline-none text-right"
                    />
                  </td>

                  <td className="border border-black text-right px-1 font-semibold">
                    {money(row.totalPrice)}
                  </td>

                  <td className="border border-black text-center no-print">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:bg-red-600 hover:text-white p-1 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addItem}
            className="no-print text-blue-600 text-xs mt-2 hover:underline"
          >
            + Add product row
          </button>

          {extraRows.length > 0 && (
            <table className="w-full border-collapse border border-black text-[11px] mt-3">
              <tbody>
                {extraRows.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-black p-1 font-semibold">
                      <input
                        value={row.title}
                        onChange={(e) =>
                          updateExtra(index, "title", e.target.value)
                        }
                        placeholder="Optional Charge / Note"
                        className="w-full outline-none"
                      />
                    </td>
                    <td className="border border-black p-1 w-[130px]">
                      <input
                        value={row.amount}
                        onChange={(e) =>
                          updateExtra(index, "amount", e.target.value)
                        }
                        placeholder="Amount"
                        className="w-full outline-none text-right"
                      />
                    </td>
                    <td className="border border-black p-1 w-[30px] no-print">
                      <button
                        onClick={() => removeExtra(index)}
                        className="text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button
            onClick={addExtraRow}
            className="no-print text-blue-600 text-xs mt-2 hover:underline"
          >
            + Add optional charge / row
          </button>

          <div className="grid grid-cols-[1fr_230px] gap-3 mt-3 text-[11px]">
            <div className="text-[10px]">
              <p>as per attached Technical Specification</p>
              <p>(Note: Including AIT + Excluding VAT)</p>
            </div>

            <table className="border-collapse border border-black">
              <tbody>
                <SummaryRow label="Total price in Taka" value={money(totals.totalWithExtra)} />
                <tr>
                  <td className="border border-black px-2 font-bold">Discount</td>
                  <td className="border border-black">
                    <input
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-1 py-[3px] outline-none text-right"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 font-bold">VAT %</td>
                  <td className="border border-black">
                    <input
                      value={vatPercent}
                      onChange={(e) => setVatPercent(e.target.value)}
                      className="w-full px-1 py-[3px] outline-none text-right"
                    />
                  </td>
                </tr>
                <SummaryRow label="VAT Amount" value={money(totals.vatAmount)} />
                <SummaryRow red label="Net price in Taka" value={`BDT ${money(totals.netPrice)}`} />
              </tbody>
            </table>
          </div>

          <div className="border border-black mt-7 text-[11px]">
            <div className="bg-[#f8e8e8] border-b border-black text-center font-bold">
              TERMS & CONDITIONS :
            </div>

            {terms.map((term, index) => (
              <div key={index} className="grid grid-cols-[35px_1fr_24px] border-b border-black last:border-b-0">
                <div className="border-r border-black text-center py-[3px]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <textarea
                  value={term}
                  onChange={(e) => updateTerm(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && index === terms.length - 1) {
                      setTimeout(addTerm, 20);
                    }
                  }}
                  className="w-full min-h-[25px] px-2 py-[3px] resize-none outline-none"
                />

                <button
                  onClick={() => removeTerm(index)}
                  className="no-print text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addTerm}
            className="no-print text-blue-600 text-xs mt-2 hover:underline"
          >
            + Add terms row
          </button>

          <div className="text-[11px] mt-5 leading-6">
            <p>Yours very truly,</p>
            <p className="text-red-600 font-semibold">
              Hi-Tech Automation & Engineering Limited
            </p>

            <div className="mt-8">
              <input
                defaultValue="Engr. Arif Ahmed"
                className="outline-none font-bold bg-transparent"
              />
              <br />
              <input
                defaultValue="Managing Director"
                className="outline-none bg-transparent"
              />
              <br />
              <input
                defaultValue="Cell: 0188-6578722"
                className="outline-none bg-transparent"
              />
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex justify-center">
      <img src={logoPath} alt="Logo" className="w-[520px] object-contain" />
    </div>
  );
}

function Footer() {
  return (
    <div className="absolute bottom-[18px] left-[34px] right-[34px]">
      <img src={footerPath} alt="Footer" className="w-full object-contain" />
    </div>
  );
}

function EditableTitle({ value }) {
  const [text, setText] = useState(value);

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      className="w-full bg-[#f8e8e8] border-b border-black px-1 font-bold outline-none"
    />
  );
}

function InfoRow({ label, value, onChange }) {
  return (
    <div className="grid grid-cols-[95px_1fr] border-b border-black last:border-b-0">
      <div className="border-r border-black px-1 font-semibold">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-1 outline-none"
      />
    </div>
  );
}

function SummaryRow({ label, value, red }) {
  return (
    <tr>
      <td className="border border-black px-2 font-bold">{label}</td>
      <td
        className={`border border-black px-2 text-right font-bold ${
          red ? "text-red-600" : ""
        }`}
      >
        {value}
      </td>
    </tr>
  );
}