import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Search, Loader2 } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search results on query change (simple debouncing)
  useEffect(() => {
    if (!query) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const data = await api.stocks.search(query);
        setResults(data);
      } catch (err) {
        console.error("Error searching stocks:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: str) => {
    setQuery("");
    setIsOpen(false);
    navigate(`/stocks/${symbol}`);
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stocks (e.g. AAPL, RELIANCE.NS, TSLA)..."
          className="w-full bg-card-dark border border-border-dark focus:border-emerald-500/50 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 shadow-lg shadow-black/20"
          onFocus={() => query && setIsOpen(true)}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 animate-spin" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card-dark border border-border-dark rounded-2xl shadow-xl overflow-hidden z-40 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length > 0 ? (
            <ul className="divide-y divide-border-dark/50">
              {results.map((stock) => (
                <li key={stock.symbol}>
                  <button
                    onClick={() => handleSelect(stock.symbol)}
                    className="w-full px-5 py-3.5 text-left hover:bg-emerald-500/5 flex items-center justify-between transition-colors duration-200"
                  >
                    <div>
                      <span className="block font-bold text-white text-sm">{stock.symbol}</span>
                      <span className="block text-xs text-gray-400 truncate max-w-xs">{stock.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-border-dark text-gray-400 font-semibold px-2 py-0.5 rounded">
                        {stock.exchange}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded">
                        {stock.type}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-gray-500">
              {query.length > 0 ? "No stocks matched your search." : "Type a symbol or company name..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
