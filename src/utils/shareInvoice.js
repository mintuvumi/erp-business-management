export function formatPhoneForWhatsApp(phone) {
  const onlyDigits = String(phone || "").replace(/\D/g, "");

  if (!onlyDigits) return "";

  // Bangladesh local number: 017... => 88017...
  if (onlyDigits.startsWith("0")) {
    return `88${onlyDigits}`;
  }

  return onlyDigits;
}

export function sendInvoiceToWhatsApp({ sale }) {
  const phone = formatPhoneForWhatsApp(sale?.customerPhone);

  const invoiceUrl = `${window.location.origin}/sales/invoice/${sale?._id}`;

  const message = `
Hello ${sale?.customerName || "Customer"},

Your invoice is ready.

Invoice No: ${sale?.billNo || ""}
Date: ${sale?.date || ""}
Net Total: ৳ ${Number(sale?.netTotal || 0).toFixed(2)}
Paid: ৳ ${Number(sale?.paidAmount || 0).toFixed(2)}
Due: ৳ ${Number(sale?.dueAmount || 0).toFixed(2)}

Invoice Link:
${invoiceUrl}

Thank you.
`.trim();

  const url = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}