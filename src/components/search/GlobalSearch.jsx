import React, { useState, useEffect } from "react";
import { FaSearch, FaMicrophone } from "react-icons/fa";

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // 🔥 MOCK DATA (replace with API later)
  const data = [
    { type: "Product", name: "Rice", price: 50 },
    { type: "Product", name: "Sugar", price: 60 },
    { type: "Sale", name: "Invoice #123", amount: 500 },
    { type: "Customer", name: "Rahim" },
  ];

  // ⚡ LIVE SEARCH (instant)
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);

    // 💾 SAVE HISTORY
    localStorage.setItem("searchHistory", query);

  }, [query]);

  // 🎤 VOICE SEARCH
  const startVoice = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.onresult = (e) => {
      setQuery(e.results[0][0].transcript);
    };
    recognition.start();
  };

  // ✨ HIGHLIGHT
  const highlight = (text) => {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, `<mark>$1</mark>`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24">

      <div className="bg-white w-[600px] rounded-2xl shadow-2xl p-4">

        {/* 🔍 INPUT */}
        <div className="flex items-center gap-2 border-b pb-2">
          <FaSearch />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="w-full outline-none"
          />
          <FaMicrophone
            onClick={startVoice}
            className="cursor-pointer text-blue-500"
          />
        </div>

        {/* RESULTS */}
        <div className="mt-3 max-h-80 overflow-auto">
          {results.length === 0 ? (
            <p className="text-gray-400 text-sm">No result</p>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                dangerouslySetInnerHTML={{
                  __html: `${r.type}: ${highlight(r.name)}`,
                }}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default GlobalSearch;