"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SmartSearch({
  placeholder = "Search anything...",
  className = "",
}) {
  const router = useRouter();
  const timerRef = useRef(null);

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [ai, setAi] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchResults = async (value) => {
    if (!value.trim()) {
      setResults([]);
      setAi(null);
      setOpen(false);
      return;
    }

    try {
      setLoading(true);

      const [searchRes, aiRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(value)}`),
        fetch(`/api/ai/search?q=${encodeURIComponent(value)}`),
      ]);

      const searchData = await searchRes.json();
      const aiData = await aiRes.json();

      if (searchData.success) {
        setResults(searchData.data || []);
      }

      if (aiData.success) {
        setAi(aiData.data);
      }

      setOpen(true);
    } catch (error) {
      console.error(error);
      setResults([]);
      setAi(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      fetchResults(q);
    }, 350);

    return () => clearTimeout(timerRef.current);
  }, [q]);

  const goTo = (path) => {
    setOpen(false);
    setQ("");
    router.push(path);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300">
        <Search size={18} className="text-gray-400" />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder={placeholder}
          className="w-full outline-none text-sm bg-transparent"
        />

        {loading && <Loader2 size={17} className="animate-spin text-blue-500" />}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[58px] z-[200] bg-white border rounded-[22px] shadow-[0_24px_70px_rgba(15,23,42,0.16)] overflow-hidden">
          {ai && (
            <div className="p-4 bg-blue-50 border-b">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <Sparkles size={16} />
                {ai.title}
              </div>

              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                {ai.answer}
              </p>

              {ai.suggestions?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {ai.suggestions.slice(0, 4).map((s, i) => (
                    <p key={i} className="text-xs text-blue-700">
                      • {s}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3 border-b text-xs text-gray-500">
            {results.length} result found
          </div>

          <div className="max-h-[330px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-5 text-center text-sm text-gray-500">
                No result found
              </div>
            ) : (
              results.map((item, index) => (
                <button
                  key={`${item.type}-${index}`}
                  onClick={() => goTo(item.path)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-blue-50 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.subtitle}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 capitalize">
                      {item.type?.replaceAll("_", " ")}{" "}
                      {item.date ? `• ${item.date}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-600">
                      ৳ {Number(item.amount || 0).toFixed(2)}
                    </span>
                    <ArrowRight size={15} className="text-gray-400" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}