"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, BookOpen } from "lucide-react";

function money(v) {
  return Number(v || 0).toFixed(2);
}

function arr(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.banks)) return data.data.banks;
  if (Array.isArray(data?.banks)) return data.banks;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function ChequeBook() {
  const [banks, setBanks] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [bankId, setBankId] = useState("");
  const [bookNo, setBookNo] = useState("");
  const [startNo, setStartNo] = useState("");
  const [endNo, setEndNo] = useState("");
  const [note, setNote] = useState("");

  const selectedBank = useMemo(
    () => banks.find((b) => String(b._id) === String(bankId)),
    [banks, bankId]
  );

  const loadAll = async () => {
    try {
      setLoading(true);

      const [bankRes, bookRes] = await Promise.all([
        fetch("/api/bank?limit=100", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/cheque-book", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const bankData = await bankRes.json();
      const bookData = await bookRes.json();

      if (!bankRes.ok || !bankData.success) {
        throw new Error(bankData.message || "Bank load failed");
      }

      if (!bookRes.ok || !bookData.success) {
        throw new Error(bookData.message || "Cheque book load failed");
      }

      setBanks(arr(bankData));
      setBooks(arr(bookData));
    } catch (error) {
      alert(error.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const clearForm = () => {
    setBankId("");
    setBookNo("");
    setStartNo("");
    setEndNo("");
    setNote("");
  };

  const saveBook = async () => {
    if (!bankId) return alert("Select bank");
    if (!startNo || !endNo) return alert("Enter cheque range");

    try {
      setSaving(true);

      const res = await fetch("/api/cheque-book", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankId,
          bookNo,
          startNo: Number(startNo),
          endNo: Number(endNo),
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Cheque book save failed");
      }

      clearForm();
      await loadAll();
      alert("Cheque book saved ✅");
    } catch (error) {
      alert(error.message || "Cheque book save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cheque Book Management</h1>
          <p className="text-sm text-gray-500">
            Create cheque book ranges and track used / remaining leaves.
          </p>
        </div>

        <button onClick={loadAll} className="btn">
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            Add Cheque Book
          </h2>

          <select
            className="input"
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
          >
            <option value="">Select Bank</option>
            {banks.map((b) => (
              <option key={b._id} value={b._id}>
                {b.bankName} - ৳ {money(b.currentBalance)}
              </option>
            ))}
          </select>

          {selectedBank && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm">
              Selected: <b>{selectedBank.bankName}</b>
            </div>
          )}

          <input
            className="input"
            placeholder="Cheque Book No / Series"
            value={bookNo}
            onChange={(e) => setBookNo(e.target.value)}
          />

          <input
            className="input"
            type="number"
            placeholder="Start Cheque No"
            value={startNo}
            onChange={(e) => setStartNo(e.target.value)}
          />

          <input
            className="input"
            type="number"
            placeholder="End Cheque No"
            value={endNo}
            onChange={(e) => setEndNo(e.target.value)}
          />

          <textarea
            className="input min-h-[90px]"
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button onClick={saveBook} disabled={saving} className="primary-btn">
            <Save size={16} />
            {saving ? "Saving..." : "Save Cheque Book"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold">Cheque Books</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Bank</th>
                  <th className="p-3 text-left">Book</th>
                  <th className="p-3 text-right">Start</th>
                  <th className="p-3 text-right">End</th>
                  <th className="p-3 text-right">Next</th>
                  <th className="p-3 text-right">Used</th>
                  <th className="p-3 text-right">Remaining</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No cheque book found.
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr key={book._id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-semibold">{book.bankName}</td>
                      <td className="p-3">{book.bookNo || "-"}</td>
                      <td className="p-3 text-right">{book.startNo}</td>
                      <td className="p-3 text-right">{book.endNo}</td>
                      <td className="p-3 text-right font-bold">{book.nextNo}</td>
                      <td className="p-3 text-right">{book.usedLeaves}</td>
                      <td className="p-3 text-right">{book.remainingLeaves}</td>
                      <td className="p-3 text-center">
                        <span className={`status ${book.status}`}>
                          {book.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 14px;
          outline: none;
          background: white;
        }

        .input:focus {
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
          border-color: #93c5fd;
        }

        .btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .primary-btn {
          width: 100%;
          background: #2563eb;
          color: white;
          border-radius: 14px;
          padding: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .primary-btn:disabled {
          opacity: 0.6;
        }

        .status {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
          background: #f3f4f6;
        }

        .status.active {
          background: #dcfce7;
          color: #15803d;
        }

        .status.completed {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}