"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Download, Share2, MessageCircle } from "lucide-react";

import CompanyHeader from "@/components/common/CompanyHeader";
import { exportElementToPDF, shareText } from "@/utils/exportPDF";
import { numberToWordsBD } from "@/utils/numberToWords";
import { sendInvoiceToWhatsApp } from "@/utils/shareInvoice";

export default function SalesInvoice({ sale }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => data.success && setSettings(data.data))
      .catch((error) => console.error(error));
  }, []);

  const calc = useMemo(() => {
    const salesAmount = Number(sale?.salesAmount || sale?.afterDiscount || 0);
    const vatAmount = Number(sale?.vatAmount || 0);
    const aitAmount = Number(sale?.aitAmount || 0);
    const paid = Number(sale?.paidAmount || 0);

    const invoiceTotal = Number(sale?.invoiceTotal || salesAmount + vatAmount);
    const invoiceDue = Math.max(invoiceTotal - paid, 0);
    const netReceivable = Math.max(salesAmount - vatAmount - aitAmount, 0);

    return {
      salesAmount,
      vatAmount,
      aitAmount,
      paid,
      invoiceTotal,
      invoiceDue,
      netReceivable,
    };
  }, [sale]);

  if (!sale) return <div className="p-5">Loading invoice...</div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} className="btn">
          <Printer size={16} /> Print
        </button>

        <button
          onClick={() =>
            exportElementToPDF({
              elementId: "sales-invoice-pdf",
              fileName: `${sale.billNo || "sales-invoice"}.pdf`,
            })
          }
          className="btn"
        >
          <Download size={16} /> PDF
        </button>

        <button
          onClick={() =>
            shareText({
              title: `Invoice ${sale.billNo}`,
              text: `Invoice for ${sale.customerName}`,
            })
          }
          className="btn"
        >
          <Share2 size={16} /> Share
        </button>

        <button
          onClick={() => sendInvoiceToWhatsApp({ sale })}
          className="btn bg-green-500 text-white border-green-500"
        >
          <MessageCircle size={16} /> WhatsApp
        </button>
      </div>

      <div
        id="sales-invoice-pdf"
        className="bg-white p-5 md:p-8 rounded-3xl border shadow-sm print:shadow-none print:border-0"
      >
        <CompanyHeader
          title="Sales Invoice"
          rightContent={
            <div className="text-sm space-y-1">
              <p>
                <span className="text-gray-500">Invoice No:</span>{" "}
                <b>{sale.manualBillNo || sale.billNo}</b>
              </p>
              <p>
                <span className="text-gray-500">PO / Work Order:</span>{" "}
                <b>{sale.poWoNo || "-"}</b>
              </p>
              <p>
                <span className="text-gray-500">Date:</span>{" "}
                <b>{formatDate(sale.date)}</b>
              </p>
              <p>
                <span className="text-gray-500">Time:</span>{" "}
                <b>{formatTime(sale.createdAt)}</b>
              </p>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="border rounded-2xl p-4">
            <h3 className="font-bold mb-3 text-gray-800">Bill To</h3>
            <p className="font-semibold">{sale.customerName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {sale.customerPhone || "No phone"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {sale.customerAddress || "No address"}
            </p>
          </div>

          <div className="border rounded-2xl p-4 md:text-right">
            <h3 className="font-bold mb-3 text-gray-800">Invoice Summary</h3>
            <p className="text-sm">
              Payment Type: <b className="capitalize">{sale.paymentType}</b>
            </p>
            <p className="text-sm mt-1">
              Status:{" "}
              <b
                className={
                  sale.status === "completed"
                    ? "text-green-600"
                    : "text-red-500"
                }
              >
                {sale.status || "completed"}
              </b>
            </p>
          </div>
        </div>

        <div className="mt-6 border rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left border-b">SL</th>
                  <th className="p-3 text-left border-b">Product Description</th>
                  <th className="p-3 text-right border-b">Qty</th>
                  <th className="p-3 text-left border-b">Unit</th>
                  <th className="p-3 text-right border-b">Unit Price</th>
                  <th className="p-3 text-right border-b">Total Price</th>
                </tr>
              </thead>

              <tbody>
                {sale.items?.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      <p className="font-semibold">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right">{Number(item.qty || 0)}</td>
                    <td className="p-3">{item.unit || "pcs"}</td>
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

        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-5 mt-6">
          <div className="space-y-4">
            <div className="border rounded-2xl p-4">
              <h3 className="font-bold">Amount in Words</h3>
              <p className="text-sm text-gray-600 mt-2 font-semibold">
                {numberToWordsBD(calc.invoiceTotal)}
              </p>
            </div>

            <div className="border rounded-2xl p-4">
              <h3 className="font-bold">Terms & Notes</h3>
              <p className="text-sm text-gray-500 mt-2">
                {sale.note ||
                  settings?.invoiceFooter ||
                  "Thank you for doing business with us."}
              </p>
            </div>
          </div>

          <div className="border rounded-2xl p-4 space-y-2">
            <Row label="Subtotal" value={sale.subTotal} />
            <Row label="Discount" value={sale.discount} danger />
            <Row label="Sales Amount" value={calc.salesAmount} />
            <Row label={`VAT Add (${Number(sale.vatPercent || 0)}%)`} value={calc.vatAmount} />

            <div className="border-t pt-2 mt-2">
              <Row label="Invoice Total" value={calc.invoiceTotal} bold />
              <Row label="Payment Amount" value={calc.paid} success />
              <Row label="Invoice Due" value={calc.invoiceDue} danger bold />
            </div>

            <div className="border-t pt-2 mt-2 bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-gray-500">
                Statement Info
              </p>
              <Row
                label={`AIT Deducted (${Number(sale.aitPercent || 0)}%)`}
                value={calc.aitAmount}
                danger
              />
              <Row label="Net Receivable" value={calc.netReceivable} highlight />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mt-10 text-sm">
          <div className="pt-8 border-t text-center">
            Customer Signature
          </div>
          <div className="pt-8 border-t text-center">
            Authorized Signature
          </div>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-gray-500">
          <p>{settings?.companyAddress || "Company Address"}</p>
          <p className="mt-1">
            {settings?.companySlogan ||
              settings?.slogan ||
              "Your trusted business partner"}
          </p>
        </div>
      </div>

      <style jsx>{`
        .btn {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
        }
        .btn:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, bold, danger, success, highlight }) {
  return (
    <div
      className={`flex justify-between text-sm ${
        bold ? "font-bold text-base" : ""
      } ${danger ? "text-red-500" : ""} ${
        success ? "text-green-600" : ""
      } ${highlight ? "font-bold text-blue-600" : ""}`}
    >
      <span>{label}</span>
      <span>৳ {money(value)}</span>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

function formatTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}