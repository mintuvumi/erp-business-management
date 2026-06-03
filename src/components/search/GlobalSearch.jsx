"use client";

import React, { useState, useEffect } from "react";
import { FaSearch, FaMicrophone } from "react-icons/fa";
import { useRouter } from "next/navigation";

const softwareOptions = [
  {
    type: "Menu",
    name: "Dashboard",
    path: "/dashboard",
  },

  {
    type: "Menu",
    name: "Sales",
    path: "/sales",
  },

  {
    type: "Menu",
    name: "Purchase",
    path: "/purchase",
  },

  {
    type: "Menu",
    name: "Stock",
    path: "/stock",
  },

  {
    type: "Menu",
    name: "Employee",
    path: "/employee",
  },

  {
    type: "Menu",
    name: "Reports",
    path: "/reports",
  },

  {
    type: "Menu",
    name: "Settings",
    path: "/settings",
  },
];

const GlobalSearch = ({ isOpen, onClose }) => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  // 🔥 LIVE SEARCH
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);

        // API SEARCH
        const res = await fetch(
          `/api/global-search?q=${encodeURIComponent(query)}`
        );

        let apiResults = [];

        if (res.ok) {
          const data = await res.json();
          apiResults = data?.data || [];
        }

        // SOFTWARE OPTION SEARCH
        const optionResults = softwareOptions.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase())
        );

        setResults([...optionResults, ...apiResults]);

        // SAVE HISTORY
        localStorage.setItem("searchHistory", query);
      } catch (error) {
        console.error("GLOBAL_SEARCH_ERROR:", error);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // 🎤 VOICE SEARCH
  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported");
      return;
    }

    const recognition =
      new window.webkitSpeechRecognition();

    recognition.lang = "bn-BD";

    recognition.onresult = (e) => {
      setQuery(e.results[0][0].transcript);
    };

    recognition.start();
  };

  // ✨ HIGHLIGHT
  const highlight = (text) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");

    return text.replace(
      regex,
      `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`
    );
  };

  // ⌨️ ENTER KEY SEARCH
  const handleEnter = (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    if (results.length > 0) {
      const first = results[0];

      router.push(first.path || "/dashboard");

      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[999999] flex items-start justify-center pt-24 px-4">
      <div className="bg-white w-full max-w-[700px] rounded-2xl shadow-2xl p-4">
        {/* 🔍 INPUT */}
        <div className="flex items-center gap-2 border-b pb-2">
          <FaSearch className="text-gray-400" />

          <input
            autoFocus
            value={query}
            onKeyDown={handleEnter}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, sale, voucher, product..."
            className="w-full outline-none text-sm"
          />

          <FaMicrophone
            onClick={startVoice}
            className="cursor-pointer text-blue-500"
          />
        </div>

        {/* RESULTS */}
        <div className="mt-3 max-h-[450px] overflow-auto">
          {loading ? (
            <p className="text-sm text-gray-400 p-2">
              Searching...
            </p>
          ) : results.length === 0 ? (
            <p className="text-gray-400 text-sm p-2">
              No result
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.type}-${i}`}
                onClick={() => {
                  router.push(
                    r.path || "/dashboard"
                  );

                  onClose?.();
                }}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg border-b"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p
                      className="font-medium text-sm"
                      dangerouslySetInnerHTML={{
                        __html: highlight(
                          r.title || r.name || ""
                        ),
                      }}
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      {r.subtitle ||
                        r.type}
                    </p>
                  </div>

                  {r.amount !==
                    undefined && (
                    <p className="text-xs font-semibold text-blue-600">
                      ৳{" "}
                      {Number(
                        r.amount || 0
                      ).toFixed(2)}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;