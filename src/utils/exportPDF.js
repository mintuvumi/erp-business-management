import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPDF({
  elementId,
  fileName = "report.pdf",
}) {
  const element = document.getElementById(elementId);

  if (!element) {
    alert("PDF section not found");
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}

export async function shareText({ title = "ERP Report", text = "", url = "" }) {
  if (navigator.share) {
    await navigator.share({
      title,
      text,
      url: url || window.location.href,
    });
  } else {
    await navigator.clipboard.writeText(`${title}\n${text}\n${url || window.location.href}`);
    alert("Share link copied ✅");
  }
}