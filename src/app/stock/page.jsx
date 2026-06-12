"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Printer,
  Download,
  Share2,
  X,
  Package,
  AlertTriangle,
  Users,
} from "lucide-react";

function money(value) {
  return Number(value || 0).toFixed(2);
}

export default function StockPage() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [stockRes, companyRes] = await Promise.all([
          fetch("/api/dashboard/stock", { credentials: "include" }),
          fetch("/api/company-settings", { credentials: "include" }),
        ]);

        const stockData = await stockRes.json();
        const companyData = await companyRes.json();

        if (stockData.success) {
          setStocks(stockData.data.stocks || []);
          setSummary(stockData.data || null);
        }

        if (companyData.success) {
          setCompany(companyData.data || null);
        }
      } catch (error) {
        console.error("STOCK_LOAD_ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedId || stocks.length === 0) return;

    const found = stocks.find((s) => String(s._id) === String(selectedId));

    if (found) {
      setSelectedStock(found);

      setTimeout(() => {
        const row = document.getElementById(`stock-${selectedId}`);
        if (row) {
          row.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);
    }
  }, [selectedId, stocks]);

  const filteredStocks = useMemo(() => {
    const text = query.toLowerCase().trim();

    if (!text) return stocks;

    return stocks.filter((s) =>
      String(s.itemName || "").toLowerCase().includes(text)
    );
  }, [stocks, query]);

  const totals = useMemo(() => {
    return filteredStocks.reduce(
      (acc, s) => {
        acc.qty += Number(s.qty || 0);
        acc.value += Number(s.totalValue || 0);
        acc.soldQty += Number(s.totalSoldQty || 0);
        acc.soldAmount += Number(s.totalSoldAmount || 0);
        return acc;
      },
      { qty: 0, value: 0, soldQty: 0, soldAmount: 0 }
    );
  }, [filteredStocks]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return filteredStocks.slice(0, 8);
  }, [query, filteredStocks]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("stock-report-print");

    html2pdf()
      .set({
        margin: 0,
        filename: "stock-report.pdf",
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  const handleShare = () => {
    const text = `Stock Report\nTotal Qty: ${totals.qty}\nTotal Value: ৳ ${money(
      totals.value
    )}`;

    if (navigator.share) {
      navigator.share({ title: "Stock Report", text });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-2xl p-5">
        Loading stock...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="no-print bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">Stock Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Product stock, sold customer details, search, print and PDF report.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
            >
              <Printer size={16} /> Print
            </button>

            <button
              onClick={handlePDF}
              className="px-4 py-2 rounded-xl bg-green-600 text-white flex items-center gap-2"
            >
              <Download size={16} /> PDF
            </button>

            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white flex items-center gap-2"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center border rounded-2xl px-4 bg-gray-50">
            <Search size={18} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product name..."
              className="w-full bg-transparent p-3 outline-none"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s._id}
                  onClick={() => {
                    setQuery(s.itemName);
                    setSelectedStock(s);
                  }}
                  className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                >
                  <p className="font-bold">{s.itemName}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {s.qty} | Value: ৳ {money(s.totalValue)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        id="stock-report-print"
        className="bg-white border rounded-[28px] shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logo ? (
              <img
                src={company.logo}
                alt="logo"
                className="w-14 h-14 rounded-2xl object-cover border"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black">
                {String(company?.companyName || "N").charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h2 className="text-xl font-black">
                {company?.companyName || "NextCore ERP"}
              </h2>
              <p className="text-xs text-gray-500">
                {company?.companyAddress || ""}
              </p>
              <p className="text-xs text-gray-500">
                {company?.companyPhone || ""} {company?.companyEmail || ""}
              </p>
            </div>
          </div>

          <div className="text-right">
            <h3 className="text-2xl font-black text-blue-700">
              STOCK REPORT
            </h3>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 border-b">
          <SummaryCard
            icon={<Package />}
            title="Total Stock Qty"
            value={summary?.totalPcs || 0}
          />
          <SummaryCard
            title="Total Stock Value"
            value={`৳ ${money(summary?.totalValue)}`}
          />
          <SummaryCard
            title="Today Stock In"
            value={summary?.todayStockIn || 0}
          />
          <SummaryCard
            title="Today Stock Out"
            value={summary?.todayStockOut || 0}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="bg-blue-950 text-white">
              <tr>
                <th className="p-4 text-left">SL</th>
                <th className="p-4 text-left">Item</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Avg Cost</th>
                <th className="p-4 text-right">Stock Value</th>
                <th className="p-4 text-right">Sold Qty</th>
                <th className="p-4 text-right">Sold Amount</th>
                <th className="p-4 text-right">Low Limit</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">
                    No stock found
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock, index) => {
                  const isLow =
                    Number(stock.qty || 0) <= Number(stock.lowStockLimit || 5);

                  const isSelected =
                    String(stock._id) === String(selectedId);

                  return (
                    <tr
                      id={`stock-${stock._id}`}
                      key={stock._id}
                      onClick={() => setSelectedStock(stock)}
                      className={`border-t hover:bg-blue-50/50 cursor-pointer ${
                        isSelected ? "bg-yellow-100 ring-2 ring-yellow-400" : ""
                      }`}
                    >
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4 font-bold">{stock.itemName}</td>
                      <td className="p-4 text-right">{stock.qty}</td>
                      <td className="p-4 text-right">
                        ৳ {money(stock.avgCost)}
                      </td>
                      <td className="p-4 text-right">
                        ৳ {money(stock.totalValue)}
                      </td>
                      <td className="p-4 text-right">
                        {stock.totalSoldQty || 0}
                      </td>
                      <td className="p-4 text-right">
                        ৳ {money(stock.totalSoldAmount)}
                      </td>
                      <td className="p-4 text-right">
                        {stock.lowStockLimit || 5}
                      </td>
                      <td
                        className={`p-4 text-right font-bold ${
                          isLow ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {isLow ? "Low Stock" : "Available"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot className="bg-gray-50 font-black">
              <tr>
                <td className="p-4" colSpan="2">
                  Total
                </td>
                <td className="p-4 text-right">{totals.qty}</td>
                <td className="p-4"></td>
                <td className="p-4 text-right">৳ {money(totals.value)}</td>
                <td className="p-4 text-right">{totals.soldQty}</td>
                <td className="p-4 text-right">৳ {money(totals.soldAmount)}</td>
                <td className="p-4"></td>
                <td className="p-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-5 border-t flex items-center justify-between text-xs text-gray-500">
          <div>
            <p className="font-bold">{company?.companyName || "NextCore ERP"}</p>
            <p>{company?.companyAddress || ""}</p>
          </div>

          <div className="text-center">
            {company?.logo ? (
              <img
                src={company.logo}
                alt="logo"
                className="h-10 mx-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {String(company?.companyName || "N").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="text-right">
            <p>{company?.companyPhone || ""}</p>
            <p>{company?.companyEmail || ""}</p>
          </div>
        </div>
      </div>

      {selectedStock && (
        <StockDetailsModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          body * {
            visibility: hidden;
          }

          #stock-report-print,
          #stock-report-print * {
            visibility: visible;
          }

          #stock-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr {
            page-break-inside: avoid;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <div className="border rounded-2xl p-4 bg-gray-50">
      <div className="text-blue-600">{icon}</div>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      <h3 className="text-xl font-black mt-1">{value}</h3>
    </div>
  );
}

function StockDetailsModal({ stock, onClose }) {
  const buyers = stock.buyers || [];

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">{stock.itemName}</h2>
            <p className="text-sm text-gray-500">
              Current Qty: {stock.qty} | Value: ৳ {money(stock.totalValue)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniBox title="Current Qty" value={stock.qty} />
          <MiniBox title="Avg Cost" value={`৳ ${money(stock.avgCost)}`} />
          <MiniBox title="Sold Qty" value={stock.totalSoldQty || 0} />
          <MiniBox
            title="Sold Amount"
            value={`৳ ${money(stock.totalSoldAmount)}`}
          />
        </div>

        <div className="p-5 pt-0">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Users size={18} /> Customers who bought this product
          </h3>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Invoice</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {buyers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-5 text-center text-gray-500">
                      No sale history found
                    </td>
                  </tr>
                ) : (
                  buyers.map((b, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{b.date || "-"}</td>
                      <td className="p-3 font-bold">{b.invoiceNo || "-"}</td>
                      <td className="p-3">{b.customerName || "-"}</td>
                      <td className="p-3">{b.customerPhone || "-"}</td>
                      <td className="p-3 text-right">{b.qty}</td>
                      <td className="p-3 text-right">৳ {money(b.price)}</td>
                      <td className="p-3 text-right font-bold">
                        ৳ {money(b.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {Number(stock.qty || 0) <= Number(stock.lowStockLimit || 5) && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex gap-2">
              <AlertTriangle size={18} />
              <p className="text-sm font-semibold">
                This product is low stock. Please purchase/re-stock soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniBox({ title, value }) {
  return (
    <div className="border rounded-2xl p-4 bg-gray-50">
      <p className="text-xs text-gray-500">{title}</p>
      <h4 className="text-lg font-black mt-1">{value}</h4>
    </div>
  );
}