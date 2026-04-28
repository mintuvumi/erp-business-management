"use client";

import { useEffect, useState } from "react";
import {
  Printer,
  Download,
  Share2,
  MessageCircle,
} from "lucide-react";

import CompanyHeader from "@/components/common/CompanyHeader";
import {
  exportElementToPDF,
  shareText,
} from "@/utils/exportPDF";

import { sendInvoiceToWhatsApp } from "@/utils/shareInvoice";

export default function SalesInvoice({ sale }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();

        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchSettings();
  }, []);

  if (!sale) {
    return <div className="p-5">Loading invoice...</div>;
  }

  return (
    <div className="space-y-5">

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-2 print:hidden">

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
        >
          <Printer size={16} />
          Print
        </button>

        <button
          onClick={() =>
            exportElementToPDF({
              elementId: "sales-invoice-pdf",
              fileName: `${sale.billNo || "sales-invoice"}.pdf`,
            })
          }
          className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
        >
          <Download size={16} />
          PDF
        </button>

        <button
          onClick={() =>
            shareText({
              title: `Sales Invoice ${sale.billNo}`,
              text: `Invoice ready for ${sale.customerName}`,
            })
          }
          className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
        >
          <Share2 size={16} />
          Share
        </button>

        {/* ✅ NEW WHATSAPP BUTTON (NO DESIGN CHANGE IMPACT) */}
        <button
          onClick={() => sendInvoiceToWhatsApp({ sale })}
          className="px-4 py-2 rounded-xl bg-green-500 text-white flex items-center gap-2 hover:bg-green-600"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>

      </div>

      {/* INVOICE */}
      <div
        id="sales-invoice-pdf"
        className="bg-white border rounded-[30px] p-5 md:p-8 shadow-sm print:shadow-none print:border-0"
      >
        <CompanyHeader title="Sales Invoice" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="border rounded-2xl p-4">
            <h3 className="font-bold mb-3">Bill To</h3>
            <p className="font-semibold">{sale.customerName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {sale.customerPhone || "No phone"}
            </p>
            {sale.note && (
              <p className="text-sm text-gray-500 mt-2">
                Note: {sale.note}
              </p>
            )}
          </div>

          <div className="border rounded-2xl p-4 md:text-right">
            <h3 className="font-bold mb-3">Invoice Info</h3>

            <p className="text-sm">
              <span className="text-gray-500">Invoice No:</span>{" "}
              <b>{sale.billNo}</b>
            </p>

            <p className="text-sm mt-1">
              <span className="text-gray-500">Date:</span>{" "}
              <b>{new Date(sale.date).toLocaleDateString()}</b>
            </p>

            <p className="text-sm mt-1 capitalize">
              <span className="text-gray-500">Payment:</span>{" "}
              <b>{sale.paymentType}</b>
            </p>

            <p className="text-sm mt-1">
              <span className="text-gray-500">Status:</span>{" "}
              <b className={sale.status === "completed" ? "text-green-600" : "text-red-500"}>
                {sale.status || "completed"}
              </b>
            </p>

          </div>
        </div>

        <div className="mt-6 border rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">SL</th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {sale.items?.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-right">{Number(item.qty || 0)}</td>
                    <td className="p-3 text-right">৳ {money(item.price)}</td>
                    <td className="p-3 text-right font-semibold">
                      ৳ {money(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-5 mt-6">
          <div className="border rounded-2xl p-4">
            <h3 className="font-bold">Terms & Notes</h3>
            <p className="text-sm text-gray-500 mt-2">
              {settings?.invoiceFooter || "Thank you for doing business with us."}
            </p>
          </div>

          <div className="border rounded-2xl p-4 space-y-2">
            <Row label="Sub Total" value={sale.subTotal} />
            <Row label="Discount" value={sale.discount} danger />
            <Row label="After Discount" value={sale.afterDiscount} />
            <Row label={`VAT (${Number(sale.vatPercent || 0)}%)`} value={sale.vatAmount} />
            <Row label={`AIT (${Number(sale.aitPercent || 0)}%)`} value={sale.aitAmount} />

            <div className="border-t pt-2 mt-2">
              <Row label="Net Total" value={sale.netTotal} bold />
              <Row label="Paid" value={sale.paidAmount} success />
              <Row label="Due" value={sale.dueAmount} danger bold />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ROW */
function Row({ label, value, bold, danger, success }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-bold text-base" : ""} ${danger ? "text-red-500" : ""} ${success ? "text-green-600" : ""}`}>
      <span>{label}</span>
      <span>৳ {money(value)}</span>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}