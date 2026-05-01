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
      .catch(console.error);
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
        className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm print:shadow-none print:border-0"
      >
        <CompanyHeader title="Sales Invoice" />

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <div className="border rounded-2xl p-4">
            <h3 className="font-bold mb-3">Bill To</h3>
            <p className="font-semibold">{sale.customerName}</p>
            <p className="text-sm text-gray-500">{sale.customerPhone || "No phone"}</p>
            <p className="text-sm text-gray-500">{sale.customerAddress || "No address"}</p>
          </div>

          <div className="border rounded-2xl p-4 text-sm md:text-right">
            <p>Invoice: <b>{sale.manualBillNo || sale.billNo}</b></p>
            <p>PO / Work Order: <b>{sale.poWoNo || "-"}</b></p>
            <p>Date: <b>{formatDate(sale.date)}</b></p>
            <p>Payment: <b className="capitalize">{sale.paymentType || "-"}</b></p>
          </div>
        </div>

        <div className="mt-6 border rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">SL</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-left">Unit</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {sale.items?.map((i, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3">
                    <p className="font-semibold">{i.name}</p>
                    {i.description && (
                      <p className="text-xs text-gray-500">{i.description}</p>
                    )}
                  </td>
                  <td className="p-3 text-right">{Number(i.qty || 0)}</td>
                  <td className="p-3">{i.unit || "pcs"}</td>
                  <td className="p-3 text-right">৳ {money(i.price)}</td>
                  <td className="p-3 text-right font-semibold">৳ {money(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-[1fr_380px] mt-6 gap-5">
          <div className="space-y-4">
            <div className="border rounded-2xl p-4 bg-blue-50">
              <h4 className="font-bold">Amount in Words</h4>
              <p className="text-sm font-semibold text-blue-700 mt-1">
                {numberToWordsBD(calc.invoiceTotal)}
              </p>
            </div>

            <div className="border rounded-2xl p-4">
              <h4 className="font-bold">Terms & Notes</h4>
              <p className="text-sm text-gray-500 mt-1">
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
              <p className="text-xs font-bold text-gray-500">Statement Info</p>
              <Row label={`AIT Deducted (${Number(sale.aitPercent || 0)}%)`} value={calc.aitAmount} danger />
              <Row label="Net Receivable" value={calc.netReceivable} highlight />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 space-y-8">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="text-center">
              <div className="h-12 border-b border-dashed"></div>
              <p className="mt-2 font-semibold">Customer Signature</p>
            </div>

            <div className="text-center">
              <div className="h-12 border-b border-dashed"></div>
              <p className="mt-2 font-semibold">Authorized Signature</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="text-xs text-gray-600">
              <p className="font-bold">{settings?.companyName || "Company Name"}</p>
              <p>{settings?.companyAddress || "Company Address"}</p>
              <p>{settings?.companyPhone || "Phone"}</p>
              {settings?.companyEmail && <p>{settings.companyEmail}</p>}
            </div>

            <div className="flex justify-center">
              <div className="w-24 h-24 border-2 border-dashed rounded-full flex items-center justify-center text-[10px] text-gray-400">
                Company Seal
              </div>
            </div>

            <div className="text-xs text-right">
              <p className="font-semibold">Payment Terms</p>
              <p>Payment within 7 days</p>
              <p className="italic mt-2">
                {settings?.companySlogan || "Your trusted business partner"}
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 border-t pt-3">
            This is a system generated invoice.
          </div>
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