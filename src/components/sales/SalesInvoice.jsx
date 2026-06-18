"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Printer,
  Download,
  Share2,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  UserRound,
} from "lucide-react";

import { exportElementToPDF, shareText } from "@/utils/exportPDF";
import { numberToWordsBD } from "@/utils/numberToWords";
import { sendInvoiceToWhatsApp } from "@/utils/shareInvoice";

export default function SalesInvoice({ sale }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        let res = await fetch("/api/company-settings", { cache: "no-store" });
        let data = await res.json();

        if (!data.success) {
          res = await fetch("/api/settings", { cache: "no-store" });
          data = await res.json();
        }

        if (data.success) setSettings(data.data);
      } catch (error) {
        console.error(error);
      }
    }

    loadSettings();
  }, []);

  const calc = useMemo(() => {
    const subTotal = Number(sale?.subTotal || 0);
    const discount = Number(sale?.discount || 0);
    const salesAmount = Number(sale?.salesAmount || sale?.afterDiscount || 0);
    const vatAmount = Number(sale?.vatAmount || 0);
    const paid = Number(sale?.paidAmount || 0);

    const invoiceTotal = Number(
      sale?.invoiceTotal || sale?.netTotal || salesAmount + vatAmount
    );

    const previousDue = Number(
      sale?.previousDue ||
        sale?.previousDueAmount ||
        sale?.oldDue ||
        sale?.customerPreviousDue ||
        0
    );

    const hidePreviousDue =
      sale?.hidePreviousDue === true ||
      sale?.showPreviousDue === false ||
      sale?.previousDueMode === "hide" ||
      settings?.defaultDueMode === "hide";

    const showPreviousDue = previousDue > 0 && !hidePreviousDue;

    const netPrice = showPreviousDue ? invoiceTotal + previousDue : invoiceTotal;
    const invoiceDue = Math.max(invoiceTotal - paid, 0);

    return {
      subTotal,
      discount,
      salesAmount,
      vatAmount,
      paid,
      invoiceTotal,
      previousDue,
      showPreviousDue,
      netPrice,
      invoiceDue,
    };
  }, [sale, settings]);

  if (!sale) return <div className="p-5">Loading invoice...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} className="btn bg-blue-600 text-white">
          <Printer size={16} /> Print
        </button>

        <button
          onClick={() =>
            exportElementToPDF({
              elementId: "sales-invoice-pdf",
              fileName: `${sale.billNo || "sales-invoice"}.pdf`,
            })
          }
          className="btn bg-green-600 text-white"
        >
          <Download size={16} /> PDF
        </button>

        <button
          onClick={() => sendInvoiceToWhatsApp({ sale })}
          className="btn bg-emerald-600 text-white"
        >
          <MessageCircle size={16} /> WhatsApp
        </button>

        <button
          onClick={() =>
            shareText({
              title: `Invoice ${sale.billNo}`,
              text: `Invoice for ${sale.customerName}`,
            })
          }
          className="btn bg-purple-600 text-white"
        >
          <Share2 size={16} /> Share
        </button>
      </div>

      <div
        id="sales-invoice-pdf"
        className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm print:shadow-none print:border-0"
      >
        <div className="grid grid-cols-[1fr_320px] gap-8 border-b pb-6">
          <div className="flex gap-5">
            <LogoCircle logo={settings?.logo} name={settings?.companyName} />

            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase">
                {settings?.companyName || "SeeERP"}
              </h1>

              {settings?.companySlogan && (
                <p className="text-sm font-medium text-gray-600">
                  {settings.companySlogan}
                </p>
              )}

              <Info icon={<MapPin size={15} />} text={settings?.companyAddress} />
              <Info icon={<Phone size={15} />} text={settings?.companyPhone} />
              <Info icon={<Mail size={15} />} text={settings?.companyEmail} />
              <Info icon={<Globe size={15} />} text={settings?.companyWebsite} />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900 to-sky-500 text-white rounded-sm flex flex-col items-center justify-center p-6">
            <h2 className="text-4xl font-black tracking-wide">INVOICE</h2>
            <p className="mt-4 px-5 py-2 rounded-full border border-white/40 font-bold">
              INVOICE NO: {sale.manualBillNo || sale.billNo}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-blue-700 font-black uppercase">Bill To</h3>
            <p className="font-black text-lg mt-2">{sale.customerName || "-"}</p>
            <Info icon={<MapPin size={15} />} text={sale.customerAddress} />
            <Info icon={<Phone size={15} />} text={sale.customerPhone} />
            <Info
              icon={<UserRound size={15} />}
              text={
                sale.contactPerson ||
                sale.customerContact ||
                sale.customerName ||
                "-"
              }
              label="Contact"
            />
          </div>

          <div className="text-sm flex justify-end">
            <div className="space-y-2 min-w-[280px]">
              <Meta label="Invoice Date" value={formatDate(sale.date)} />
              <Meta label="Time" value={formatTime(sale.createdAt)} />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-blue-950 text-white">
              <tr>
                <th className="p-3 text-center w-16">SL</th>
                <th className="p-3 text-left">Item Description</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-center">Unit</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {sale.items?.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3 text-center">{idx + 1}</td>
                  <td className="p-3">
                    <p className="font-bold">{item.name || item.itemName}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500">{item.description}</p>
                    )}
                  </td>
                  <td className="p-3 text-center">{Number(item.qty || item.quantity || 0)}</td>
                  <td className="p-3 text-center">{item.unit || "pcs"}</td>
                  <td className="p-3 text-right">৳ {money(item.price || item.rate)}</td>
                  <td className="p-3 text-right font-bold">৳ {money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-[1fr_430px] gap-8 mt-6">
          <div className="flex items-end">
            {sale.billPrint !== false && sale.showBillReceipt !== false && (
              <div className="border border-dashed rounded-xl p-4 w-[260px]">
                <p className="font-bold text-blue-800">Bill / Receipt</p>
                <p className="text-xs text-gray-500 mt-3">
                  {settings?.invoiceFooter || "Thank you for doing business with us."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Row label="Subtotal" value={calc.subTotal} />
            <Row label="Discount" value={calc.discount} />
            <Row label={`VAT (${Number(sale.vatPercent || 0)}%)`} value={calc.vatAmount} />
            <Row label="Total Price in Taka" value={calc.invoiceTotal} />

            {calc.showPreviousDue && (
              <Row label="Previous Due Amount" value={calc.previousDue} boxed />
            )}

            <div className="flex justify-between bg-blue-700 text-white rounded-xl px-4 py-3 font-black">
              <span>Net Price in Taka</span>
              <span>৳ {money(calc.netPrice)}</span>
            </div>

            <div className="border rounded-xl p-3 bg-gray-50">
              <p className="text-xs text-gray-500">In Words:</p>
              <p className="font-black text-blue-800">
                {numberToWordsBD(calc.netPrice)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <div className="text-center w-56">
            <p className="italic text-2xl">Authorized</p>
            <div className="border-t border-black mt-1 pt-1 text-xs font-bold">
              AUTHORIZED SIGNATURE
            </div>
          </div>
        </div>

        <div className="mt-10 border-t-2 border-blue-700 pt-5 grid grid-cols-3 items-center">
          <div className="flex gap-3 items-center text-sm">
            <PhoneBox />
            <div>
              <p>{settings?.companyPhone || "-"}</p>
              <p>{settings?.companyEmail || "-"}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <LogoCircle logo={settings?.logo} name={settings?.companyName} small />
          </div>

          <div className="flex justify-end gap-3 items-center text-sm text-right">
            <div>
              <p>{settings?.companyAddress || "-"}</p>
              <p>{settings?.companyWebsite || ""}</p>
            </div>
            <MapBox />
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn {
          padding: 8px 14px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

function LogoCircle({ logo, name, small }) {
  return (
    <div
      className={`rounded-full border-2 border-blue-300 bg-white flex items-center justify-center overflow-hidden ${
        small ? "w-16 h-16" : "w-28 h-28"
      }`}
    >
      {logo ? (
        <img src={logo} alt={name || "Company Logo"} className="w-full h-full object-contain p-3" />
      ) : (
        <span className="font-black text-blue-700">{String(name || "C").charAt(0)}</span>
      )}
    </div>
  );
}

function Info({ icon, text, label }) {
  if (!text && !label) return null;

  return (
    <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
      <span className="text-blue-900">{icon}</span>
      {label && <strong>{label}:</strong>}
      <span>{text || "-"}</span>
    </p>
  );
}

function Meta({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_12px_1fr] gap-2">
      <b>{label}</b>
      <span>:</span>
      <span>{value || "-"}</span>
    </div>
  );
}

function Row({ label, value, boxed }) {
  return (
    <div
      className={`flex justify-between px-4 py-1.5 text-sm ${
        boxed ? "border border-blue-400 rounded-lg font-bold text-blue-800" : ""
      }`}
    >
      <span>{label}</span>
      <span>৳ {money(value)}</span>
    </div>
  );
}

function PhoneBox() {
  return (
    <div className="w-11 h-11 rounded-xl bg-blue-800 text-white flex items-center justify-center">
      <Phone size={20} />
    </div>
  );
}

function MapBox() {
  return (
    <div className="w-11 h-11 rounded-xl bg-blue-800 text-white flex items-center justify-center">
      <MapPin size={20} />
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB");
}

function formatTime(date) {
  if (!date) return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}