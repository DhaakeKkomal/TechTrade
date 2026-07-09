import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import { Search, Loader2, Sparkles, Filter, Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, ShieldCheck, AlertCircle } from "lucide-react";

interface SelectedFilter {
  id: string;
  name: string;
  operator: string;
  operatorLabel: string;
  value: number | null;
}

export default function Scanner() {
  const [universe, setUniverse] = useState("us");
  const [activeFilters, setActiveFilters] = useState<SelectedFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [hasScanned, setHasScanned] = useState(false);

  // Form builder state
  const [selectedIndicator, setSelectedIndicator] = useState("rsi");
  const [selectedOperator, setSelectedOperator] = useState("lt");
  const [inputValue, setInputValue] = useState<string>("30");

  const filterOptions = {
    rsi: {
      name: "RSI (14)",
      operators: [
        { value: "lt", label: "Less Than (<)" },
        { value: "gt", label: "Greater Than (>)" }
      ],
      defaultValue: "30"
    },
    ma: {
      name: "Moving Averages",
      operators: [
        { value: "price_above_sma50", label: "Price Above SMA 50" },
        { value: "price_above_ema20", label: "Price Above EMA 20" },
        { value: "golden_cross", label: "Golden Cross (50/200 SMA)" },
        { value: "death_cross", label: "Death Cross (50/200 SMA)" }
      ],
      defaultValue: ""
    },
    bollinger: {
      name: "Bollinger Bands",
      operators: [
        { value: "price_below_lower", label: "Price Below Lower Band" },
        { value: "crosses_lower", label: "Price Crosses below Lower Band" },
        { value: "crosses_upper", label: "Price Crosses above Upper Band" }
      ],
      defaultValue: ""
    },
    volume_spike: {
      name: "Volume Spike",
      operators: [
        { value: "gt", label: "Volume Spike Ratio (> Average)" }
      ],
      defaultValue: "1.5"
    },
    breakout: {
      name: "Breakouts (20d)",
      operators: [
        { value: "bullish", label: "Bullish Breakout (20-day High)" },
        { value: "bearish", label: "Bearish Breakdown (20-day Low)" }
      ],
      defaultValue: ""
    },
    consolidation: {
      name: "Consolidation",
      operators: [
        { value: "lt", label: "Squeeze Bandwidth (<)" }
      ],
      defaultValue: "0.06"
    },
    atr: {
      name: "ATR Volatility",
      operators: [
        { value: "high", label: "High Volatility (> average)" },
        { value: "low", label: "Low Volatility (< average)" }
      ],
      defaultValue: ""
    },
    relative_strength: {
      name: "Relative Strength",
      operators: [
        { value: "strong", label: "Strong Outperformance (>)" },
        { value: "weak", label: "Weak Underperformance (<)" }
      ],
      defaultValue: "5"
    },
    gap: {
      name: "Price Gaps",
      operators: [
        { value: "up", label: "Gap Up Percent (>)" },
        { value: "down", label: "Gap Down Percent (<)" }
      ],
      defaultValue: "1.0"
    },
    "52week": {
      name: "52-Week Range",
      operators: [
        { value: "near_high", label: "Near 52-Week High (within 2.5%)" },
        { value: "near_low", label: "Near 52-Week Low (within 2.5%)" }
      ],
      defaultValue: ""
    }
  };

  const handleIndicatorChange = (ind: string) => {
    setSelectedIndicator(ind);
    const opts = (filterOptions as any)[ind];
    setSelectedOperator(opts.operators[0].value);
    setInputValue(opts.defaultValue);
  };

  const handleAddFilter = () => {
    const indicatorOpts = (filterOptions as any)[selectedIndicator];
    const operatorOpt = indicatorOpts.operators.find((op: any) => op.value === selectedOperator);
    
    const newFilter: SelectedFilter = {
      id: `${selectedIndicator}_${selectedOperator}_${Date.now()}`,
      name: selectedIndicator,
      operator: selectedOperator,
      operatorLabel: `${indicatorOpts.name}: ${operatorOpt.label}`,
      value: inputValue ? parseFloat(inputValue) : null
    };

    setActiveFilters([...activeFilters, newFilter]);
  };

  const handleRemoveFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  };

  const handleRunScan = async () => {
    if (activeFilters.length === 0) {
      setError("Please add at least one filter before executing the scanner.");
      return;
    }

    setLoading(true);
    setError("");
    setHasScanned(true);

    const payload = {
      universe,
      filters: activeFilters.map(f => ({
        name: f.name,
        operator: f.operator,
        value: f.value
      }))
    };

    try {
      const data = await api.scanner.runScan(payload);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to execute scan. Make sure watchlists are not empty if scanning watchlist universe.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const currentIndOpts = (filterOptions as any)[selectedIndicator];

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-card-dark to-card-dark/40 border border-border-dark rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
              <Filter className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">Swing Trading Scanner</h1>
              <p className="text-xs text-gray-400 mt-1">Multi-filter scanner engine configured for institutional swing entries and consolidation breakouts.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Filter Configurator */}
          <div className="lg:col-span-1 bg-card-dark border border-border-dark rounded-3xl p-6 space-y-6 h-fit">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border-dark/50 pb-3">1. Select Universe</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "us", label: "US Tech" },
                  { id: "nse", label: "NSE India" },
                  { id: "watchlist", label: "Watchlist" }
                ].map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUniverse(u.id)}
                    className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all duration-300 cursor-pointer ${
                      universe === u.id
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-bg-dark border-border-dark text-gray-400 hover:text-white"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border-dark/50 pb-3">2. Add Filter Condition</h3>
              <div className="space-y-3">
                {/* Select Indicator */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Indicator</label>
                  <select
                    value={selectedIndicator}
                    onChange={(e) => handleIndicatorChange(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    {Object.entries(filterOptions).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Operator */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Condition</label>
                  <select
                    value={selectedOperator}
                    onChange={(e) => setSelectedOperator(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    {currentIndOpts.operators.map((op: any) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Value Input */}
                {currentIndOpts.defaultValue !== "" && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Threshold Value</label>
                    <input
                      type="number"
                      step="any"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all duration-300"
                    />
                  </div>
                )}

                <button
                  onClick={handleAddFilter}
                  className="w-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Filter
                </button>
              </div>
            </div>

            {/* Active Filters list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border-dark/50 pb-3">Active Filters Chain</h3>
              {activeFilters.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic text-center py-2">No filters active. Add filters above.</p>
              ) : (
                <ul className="space-y-2">
                  {activeFilters.map((f) => (
                    <li key={f.id} className="flex justify-between items-center bg-bg-dark border border-border-dark p-3 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-bold text-gray-300">{f.operatorLabel}</span>
                        {f.value !== null && (
                          <span className="block text-[9px] text-gray-500">Value threshold: {f.value}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFilter(f.id)}
                        className="text-gray-500 hover:text-red-400 p-1 rounded-lg transition-colors duration-200"
                        title="Remove filter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={handleRunScan}
              disabled={loading || activeFilters.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/20 text-xs flex justify-center items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning Universe...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Run Market Scan
                </>
              )}
            </button>
          </div>

          {/* Right panel: Results Table */}
          <div className="lg:col-span-2 bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 flex flex-col min-h-[400px]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border-dark pb-4 mb-4 flex justify-between items-center">
              <span>Matching Stocks Feed</span>
              {results.length > 0 && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full normal-case font-bold">
                  {results.length} Stocks Matched
                </span>
              )}
            </h3>

            {loading ? (
              <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Scanning market indexes...</p>
                  <p className="text-xs text-gray-500">Retrieving historical data, compiling filters and scoring setups...</p>
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-500 border-b border-border-dark/50">
                      <th className="pb-3 font-semibold">Symbol</th>
                      <th className="pb-3 font-semibold text-right">Price</th>
                      <th className="pb-3 font-semibold text-right">Score</th>
                      <th className="pb-3 font-semibold">Momentum</th>
                      <th className="pb-3 font-semibold text-right">Risk</th>
                      <th className="pb-3 font-semibold text-right">Prob.</th>
                      <th className="pb-3 font-semibold pl-4">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/50">
                    {results.map((stock) => {
                      const isUp = stock.change_percent >= 0;
                      const priceColor = isUp ? "text-emerald-400" : "text-red-400";
                      
                      const momentumColor = stock.momentum.includes("Bullish")
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : stock.momentum.includes("Bearish")
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-border-dark text-gray-400 border-transparent";
                        
                      const riskColor = stock.risk_score >= 65
                        ? "text-red-400"
                        : stock.risk_score >= 40
                        ? "text-amber-400"
                        : "text-emerald-400";

                      return (
                        <tr key={stock.symbol} className="group hover:bg-bg-dark/20 transition-all duration-200 cursor-pointer">
                          <td className="py-4 font-bold">
                            <Link to={`/stocks/${stock.symbol}`} className="text-emerald-400 hover:text-emerald-300">
                              {stock.symbol}
                            </Link>
                          </td>
                          
                          <td className="py-4 text-right">
                            <span className="font-semibold text-white block">{stock.price.toFixed(2)}</span>
                            <span className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${priceColor}`}>
                              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {stock.change_percent.toFixed(2)}%
                            </span>
                          </td>
                          
                          <td className="py-4 text-right">
                            <span className="text-xs font-bold text-white bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {stock.scan_score}%
                            </span>
                          </td>
                          
                          <td className="py-4">
                            <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${momentumColor}`}>
                              {stock.momentum}
                            </span>
                          </td>
                          
                          <td className="py-4 text-right font-bold">
                            <span className={riskColor}>{stock.risk_score}</span>
                            <span className="text-[8px] text-gray-500 block font-normal uppercase">Index</span>
                          </td>

                          <td className="py-4 text-right font-bold text-purple-400">
                            {stock.probability}%
                          </td>

                          <td className="py-4 pl-4 text-gray-400 text-[10px] leading-relaxed max-w-xs truncate group-hover:text-gray-200" title={stock.summary}>
                            {stock.summary}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 py-16">
                <Filter className="w-10 h-10 text-gray-700 mb-3 animate-bounce" />
                <p className="text-sm font-semibold text-gray-400 mb-0.5">
                  {hasScanned ? "No stocks matched criteria" : "Ready to scan markets"}
                </p>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  {hasScanned 
                    ? "Try adjusting operator thresholds or running the scan on a different stock universe." 
                    : "Add filter rules in the configurator on the left and select your universe to find swing setups."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
