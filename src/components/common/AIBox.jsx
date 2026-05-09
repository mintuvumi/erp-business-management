"use client";

import { useState } from "react";
import {
  Sparkles,
  Search,
  Loader2,
  BrainCircuit,
} from "lucide-react";

export default function AIBox({
  endpoint = "/api/ai-search",
  placeholder = "Ask AI about sales, profit, due, stock, cash...",
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState({
    title: "",
    answer: "",
    suggestions: [],
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${endpoint}?q=${encodeURIComponent(query)}`
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "AI search failed");
        return;
      }

      setResult(data.data);
    } catch (error) {
      console.error(error);
      alert("AI search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
          <BrainCircuit size={20} />
        </div>

        <div>
          <h2 className="font-bold flex items-center gap-2">
            AI Business Assistant

            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
              <Sparkles size={11} />
              AI
            </span>
          </h2>

          <p className="text-xs text-gray-500">
            Smart business analysis and suggestions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder={placeholder}
            className="w-full border rounded-2xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className={`
            px-5 py-3 rounded-2xl text-white font-medium
            inline-flex items-center justify-center gap-2
            transition-all duration-200
            ${
              loading
                ? "bg-purple-300"
                : "bg-purple-600 hover:bg-purple-700"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Ask AI
            </>
          )}
        </button>
      </div>

      {(result.title || result.answer) && (
        <div className="mt-5 border rounded-2xl overflow-hidden">
          <div className="bg-purple-50 border-b px-4 py-3">
            <h3 className="font-semibold text-purple-700">
              {result.title}
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-gray-50 border rounded-2xl p-4">
              <p className="text-sm leading-7 text-gray-700">
                {result.answer}
              </p>
            </div>

            {result.suggestions?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3">
                  AI Suggestions
                </h4>

                <div className="space-y-2">
                  {result.suggestions.map((item, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-700"
                    >
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}