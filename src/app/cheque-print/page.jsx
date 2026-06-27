"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Save } from "lucide-react";

function numberToWords(num) {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${convert(n % 100)}`.trim();
    if (n < 100000) return `${convert(Math.floor(n / 1000))} Thousand ${convert(n % 1000)}`.trim();
    if (n < 10000000) return `${convert(Math.floor(n / 100000))} Lac ${convert(n % 100000)}`.trim();
    return `${convert(Math.floor(n / 10000000))} Crore ${convert(n % 10000000)}`.trim();
  };

  const amount = Number(num || 0);
  if (!amount) return "";
  return `The Sum of Taka ${convert(amount)} Only`;
}

function splitWordsForCheque(words) {
  const clean = String(words || "").replace("The Sum of Taka", "").trim();

  if (clean.length <= 52) {
    return { firstLine: clean, secondLine: "" };
  }

  const parts = clean.split(" ");
  let firstLine = "";
  let secondLine = "";

  for (const word of parts) {
    if ((firstLine + " " + word).trim().length <= 52) {
      firstLine = `${firstLine} ${word}`.trim();
    } else {
      secondLine = `${secondLine} ${word}`.trim();
    }
  }

  return { firstLine, secondLine };
}

function formatChequeDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "00000000";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());

  return `${dd}${mm}${yyyy}`;
}

const defaultTemplate = {
  bankName: "NCC Bank PLC",

  chequeWidthMm: 192,
  chequeHeightMm: 90,

  // সব লেখা একসাথে ডানে/বামে, উপরে/নিচে সরানোর জন্য
  printOffsetX: 20,
  printOffsetY: 0,

  payTo: {
    topMm: 29,
    leftMm: 20,
    fontSize: 12,
    heightMm: 9,
  },

  amountNumber: {
    topMm: 37,
    leftMm: 135,
    fontSize: 13,
    heightMm: 12.5,
  },

  amountWords: {
    topMm: 41,
    leftMm: 30,
    fontSize: 11,
    widthMm: 95,
  },

  amountWordsSecondLine: {
    topMm: 57,
    leftMm: 10,
    fontSize: 11,
    widthMm: 115,
  },

  date: {
    topMm: 15,
    leftMm: 135,
    fontSize: 11,
    boxWidthMm: 5.5,
    boxHeightMm: 6,
    gapMm: 0.85,
  },
};

export default function ChequePrintPage() {
  const [template, setTemplate] = useState(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [transactionId, setTransactionId] = useState("");
const [chequeRegisterId, setChequeRegisterId] = useState("");

  const [form, setForm] = useState({
    payTo: "",
    amount: "",
    chequeDate: new Date().toISOString().slice(0, 10),
  });

  const amountWords = useMemo(() => numberToWords(form.amount), [form.amount]);
  const wordsLine = useMemo(() => splitWordsForCheque(amountWords), [amountWords]);
  const chequeDateDigits = useMemo(
    () => formatChequeDate(form.chequeDate),
    [form.chequeDate]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const templateRes = await fetch("/api/cheque-template");
        const templateData = await templateRes.json();

        if (templateData.success && templateData.data) {
          setTemplate({
            ...defaultTemplate,
            ...templateData.data,
            printOffsetX:
              templateData.data.printOffsetX ?? defaultTemplate.printOffsetX,
            printOffsetY:
              templateData.data.printOffsetY ?? defaultTemplate.printOffsetY,
            payTo: {
              ...defaultTemplate.payTo,
              ...(templateData.data.payTo || {}),
            },
            amountNumber: {
              ...defaultTemplate.amountNumber,
              ...(templateData.data.amountNumber || {}),
            },
            amountWords: {
              ...defaultTemplate.amountWords,
              ...(templateData.data.amountWords || {}),
            },
            amountWordsSecondLine: {
              ...defaultTemplate.amountWordsSecondLine,
              ...(templateData.data.amountWordsSecondLine || {}),
            },
            date: {
              ...defaultTemplate.date,
              ...(templateData.data.date || {}),
            },
          });
        } else {
          setTemplate(defaultTemplate);
        }

        const params = new URLSearchParams(window.location.search);
        const transactionId = params.get("transactionId");

setTransactionId(transactionId || "");

        if (transactionId) {
          const txRes = await fetch("/api/accounts/transactions?limit=300");
          const txData = await txRes.json();

          if (txData.success) {
            const transaction = (txData.data || []).find(
              (item) => String(item._id) === String(transactionId)
            );

            if (transaction) {
              setForm({
                payTo:
                  transaction.personName ||
                  transaction.title ||
                  transaction.categoryName ||
                  "",
                amount: String(transaction.amount || ""),
                chequeDate: transaction.transactionDate
                  ? new Date(transaction.transactionDate).toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10),
              });
            }
          }
        }
      } catch (error) {
        console.error("CHEQUE_PAGE_LOAD_ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateTemplate = (path, value) => {
    setTemplate((prev) => {
      const copy = structuredClone(prev);
      const keys = path.split(".");
      let obj = copy;

      keys.slice(0, -1).forEach((key) => {
        obj[key] = obj[key] || {};
        obj = obj[key];
      });

      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };


  const saveTemplate = async () => {
  const res = await fetch("/api/cheque-template", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(template),
  });

  const data = await res.json();

  if (data.success) {
    alert("Cheque template saved");
  } else {
    alert(data.message || "Save failed");
  }
};

const resetNccTemplate = () => {
  setTemplate(defaultTemplate);
};

// ✅ এখানেই নতুন function বসবে
const registerCheque = async () => {
  if (!form.payTo || !form.amount) return null;

  const res = await fetch("/api/cheque-register", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactionId,
      chequeNo:
        new URLSearchParams(window.location.search).get("chequeNo") ||
        transactionId ||
        `CHQ-${Date.now()}`,
      payTo: form.payTo,
      amount: Number(form.amount),
      chequeDate: form.chequeDate,
      sourceType: "bank",
      status: "pending",
    }),
  });

  const data = await res.json();

  if (data.success) {
    setChequeRegisterId(data.data._id);
  }

  return data;
};

const printCheque = async () => {
  const result = await registerCheque();

  if (result?.success && result?.data?._id) {
    await fetch("/api/cheque-register", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id: result.data._id,
        markPrinted: true,
      }),
    });
  }

  window.print();
};


return (

    <div className="min-h-screen bg-gray-100 p-5">
      <style jsx global>{`
        @page {
          size: ${template.chequeWidthMm}mm ${template.chequeHeightMm}mm;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: ${template.chequeWidthMm}mm !important;
            height: ${template.chequeHeightMm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden !important;
          }

          .cheque-print-area,
          .cheque-print-area * {
            visibility: visible !important;
          }

          .cheque-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print bg-white rounded-3xl p-5 mb-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cheque Print - NCC Bank PLC</h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading cheque data..." : "NCC Bank PLC cheque template ready."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetNccTemplate}
            className="px-5 py-3 rounded-xl border bg-white hover:bg-gray-50"
          >
            Reset NCC
          </button>

          <button
            onClick={saveTemplate}
            className="px-5 py-3 rounded-xl bg-green-600 text-white flex items-center gap-2 hover:bg-green-700"
          >
            <Save size={18} />
            Save Template
          </button>

          <button
            onClick={printCheque}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700"
          >
            <Printer size={18} />
            Print Cheque
          </button>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-lg">Cheque Information</h2>

          <Input
            label="Pay To"
            value={form.payTo}
            onChange={(v) => setForm((p) => ({ ...p, payTo: v }))}
          />

          <Input
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(v) => setForm((p) => ({ ...p, amount: v }))}
          />

          <Input
            label="Date"
            type="date"
            value={form.chequeDate}
            onChange={(v) => setForm((p) => ({ ...p, chequeDate: v }))}
          />

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm font-semibold text-blue-900">
            {amountWords || "Amount in words will show here"}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-xs text-amber-900 leading-6">
            Print settings: Scale 100%, Margins None/Minimum, Headers & Footers Off.
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4 xl:col-span-2">
          <h2 className="font-bold text-lg">NCC Template Position Setting (MM)</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              label="Cheque Width"
              type="number"
              value={template.chequeWidthMm}
              onChange={(v) => updateTemplate("chequeWidthMm", Number(v))}
            />

            <Input
              label="Cheque Height"
              type="number"
              value={template.chequeHeightMm}
              onChange={(v) => updateTemplate("chequeHeightMm", Number(v))}
            />

            <Input
              label="Global Right/Left"
              type="number"
              value={template.printOffsetX || 0}
              onChange={(v) => updateTemplate("printOffsetX", Number(v))}
            />

            <Input
              label="Global Up/Down"
              type="number"
              value={template.printOffsetY || 0}
              onChange={(v) => updateTemplate("printOffsetY", Number(v))}
            />

            <Input
              label="Pay Top"
              type="number"
              value={template.payTo.topMm}
              onChange={(v) => updateTemplate("payTo.topMm", Number(v))}
            />

            <Input
              label="Pay Left"
              type="number"
              value={template.payTo.leftMm}
              onChange={(v) => updateTemplate("payTo.leftMm", Number(v))}
            />

            <Input
              label="Amount Top"
              type="number"
              value={template.amountNumber.topMm}
              onChange={(v) => updateTemplate("amountNumber.topMm", Number(v))}
            />

            <Input
              label="Amount Left"
              type="number"
              value={template.amountNumber.leftMm}
              onChange={(v) => updateTemplate("amountNumber.leftMm", Number(v))}
            />

            <Input
              label="Words 1 Top"
              type="number"
              value={template.amountWords.topMm}
              onChange={(v) => updateTemplate("amountWords.topMm", Number(v))}
            />

            <Input
              label="Words 1 Left"
              type="number"
              value={template.amountWords.leftMm}
              onChange={(v) => updateTemplate("amountWords.leftMm", Number(v))}
            />

            <Input
              label="Words 2 Top"
              type="number"
              value={template.amountWordsSecondLine.topMm}
              onChange={(v) =>
                updateTemplate("amountWordsSecondLine.topMm", Number(v))
              }
            />

            <Input
              label="Words 2 Left"
              type="number"
              value={template.amountWordsSecondLine.leftMm}
              onChange={(v) =>
                updateTemplate("amountWordsSecondLine.leftMm", Number(v))
              }
            />

            <Input
              label="Date Top"
              type="number"
              value={template.date.topMm}
              onChange={(v) => updateTemplate("date.topMm", Number(v))}
            />

            <Input
              label="Date Left"
              type="number"
              value={template.date.leftMm}
              onChange={(v) => updateTemplate("date.leftMm", Number(v))}
            />

            <Input
              label="Date Box Width"
              type="number"
              value={template.date.boxWidthMm}
              onChange={(v) => updateTemplate("date.boxWidthMm", Number(v))}
            />

            <Input
              label="Date Box Height"
              type="number"
              value={template.date.boxHeightMm}
              onChange={(v) => updateTemplate("date.boxHeightMm", Number(v))}
            />

            <Input
              label="Date Gap"
              type="number"
              value={template.date.gapMm}
              onChange={(v) => updateTemplate("date.gapMm", Number(v))}
            />
          </div>
        </div>
      </div>

      <div className="no-print overflow-auto bg-white rounded-3xl p-5 shadow-sm mb-5">
        <h2 className="font-bold mb-3">
          Preview Size: {template.chequeWidthMm}mm × {template.chequeHeightMm}mm
        </h2>

        <div className="text-xs text-gray-500 mb-3">
          Preview border শুধু alignment বুঝার জন্য। Print এ border যাবে না।
        </div>

        <ChequeCanvas
          template={template}
          form={form}
          wordsLine={wordsLine}
          chequeDateDigits={chequeDateDigits}
          showBorder
        />
      </div>

      <div className="hidden print:block">
        <ChequeCanvas
          template={template}
          form={form}
          wordsLine={wordsLine}
          chequeDateDigits={chequeDateDigits}
        />
      </div>
    </div>
  );
}

function ChequeCanvas({
  template,
  form,
  wordsLine,
  chequeDateDigits,
  showBorder = false,
}) {
  return (
    <div
      className={`cheque-print-area relative bg-white ${
        showBorder ? "border border-dashed border-gray-400" : ""
      }`}
      style={{
        width: `${template.chequeWidthMm}mm`,
        height: `${template.chequeHeightMm}mm`,
        transform: `translate(${template.printOffsetX || 0}mm, ${
          template.printOffsetY || 0
        }mm)`,
      }}
    >
      <DateBoxes
        top={template.date.topMm}
        left={template.date.leftMm}
        boxWidth={template.date.boxWidthMm}
        boxHeight={template.date.boxHeightMm}
        gap={template.date.gapMm}
        fontSize={template.date.fontSize}
        value={chequeDateDigits}
      />

      <Text
        top={template.payTo.topMm}
        left={template.payTo.leftMm}
        fontSize={template.payTo.fontSize}
        height={template.payTo.heightMm}
        width={245}
      >
        {form.payTo}
      </Text>

      <Text
        top={template.amountNumber.topMm}
        left={template.amountNumber.leftMm}
        fontSize={template.amountNumber.fontSize}
        height={template.amountNumber.heightMm}
        width={70}
      >
        TK {Number(form.amount || 0).toLocaleString("en-US")}
      </Text>

      <Text
        top={template.amountWords.topMm}
        left={template.amountWords.leftMm}
        fontSize={template.amountWords.fontSize}
        width={template.amountWords.widthMm}
      >
        {wordsLine.firstLine}
      </Text>

      <Text
        top={template.amountWordsSecondLine.topMm}
        left={template.amountWordsSecondLine.leftMm}
        fontSize={template.amountWordsSecondLine.fontSize}
        width={template.amountWordsSecondLine.widthMm}
      >
        {wordsLine.secondLine}
      </Text>
    </div>
  );
}

function DateBoxes({ top, left, boxWidth, boxHeight, gap, fontSize, value }) {
  const chars = String(value || "00000000").padEnd(8, " ").slice(0, 8).split("");

  return (
    <div
      style={{
        position: "absolute",
        top: `${top}mm`,
        left: `${left}mm`,
        display: "flex",
        gap: `${gap}mm`,
      }}
    >
      {chars.map((char, i) => (
        <div
          key={i}
          style={{
            width: `${boxWidth}mm`,
            height: `${boxHeight}mm`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${fontSize}px`,
            fontWeight: "700",
            lineHeight: 1,
          }}
        >
          {char}
        </div>
      ))}
    </div>
  );
}

function Text({ top, left, fontSize, width, height, children }) {
  return (
    <div
      className="absolute whitespace-nowrap font-semibold text-black overflow-hidden"
      style={{
        top: `${top}mm`,
        left: `${left}mm`,
        fontSize: `${fontSize}px`,
        width: width ? `${width}mm` : "auto",
        height: height ? `${height}mm` : "auto",
        lineHeight: height ? `${height}mm` : "normal",
      }}
    >
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}