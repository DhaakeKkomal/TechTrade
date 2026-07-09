import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import StockChart from "../components/StockChart";
import TradingViewWidget from "../components/TradingViewWidget";
import IndicatorsSummary from "../components/IndicatorsSummary";
import { ArrowLeft, Loader2, Star, AlertTriangle, Cpu, TrendingUp, Layers } from "lucide-react";

export default function StockDetail() {
  const { symbol = "" } = useParams<{ symbol: string }>();
  const [info, setInfo] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [priceAction, setPriceAction] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [activeChartTab, setActiveChartTab] = useState<"custom" | "tradingview">("custom");
  
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [selectedWlId, setSelectedWlId] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Parallel fetches for standard info, history, analysis, watchlists, price action, and patterns
      const [infoData, historyData, analysisData, wlData, paData, patData] = await Promise.all([
        api.stocks.getInfo(symbol),
        api.stocks.getHistory(symbol, "6mo", "1d"), // Load 6 months of daily data
        api.stocks.getAnalysis(symbol, "1y", "1d"),
        api.watchlists.getWatchlists(),
        api.stocks.getPriceAction(symbol, "6mo", "1d").catch((err) => {
          console.warn("Price action fetch failed:", err);
          return null;
        }),
        api.stocks.getPatterns(symbol, "6mo", "1d").catch((err) => {
          console.warn("Patterns fetch failed:", err);
          return [];
        })
      ]);

      setInfo(infoData);
      setHistory(historyData);
      setAnalysis(analysisData);
      setWatchlists(wlData);
      setPriceAction(paData);
      setPatterns(patData);
      
      if (wlData.length > 0) {
        setSelectedWlId(wlData[0].id.toString());
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load stock data. Please verify the symbol.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setAiSummary(""); // Reset AI summary when symbol changes
  }, [symbol]);

  const handleAddToWatchlist = async () => {
    if (!selectedWlId) return;
    try {
      await api.watchlists.addItem(parseInt(selectedWlId), symbol);
      setSuccessMsg(`Added ${symbol.toUpperCase()} to watchlist!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to add to watchlist");
    }
  };

  const handleGenerateAiSummary = async () => {
    setAiLoading(true);
    setAiSummary("");
    try {
      const result = await api.stocks.getAiSummary(symbol);
      setAiSummary(result.summary);
    } catch (err: any) {
      console.error(err);
      setAiSummary("Failed to generate AI summary. Ensure your local Ollama server is running and mistral model is installed.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <span className="text-sm font-semibold text-gray-400">Loading stock profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center p-6 text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-white mb-2">Error Loading Stock</h2>
          <p className="text-xs text-gray-400 mb-6">{error}</p>
          <Link to="/" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-2xl text-xs transition-colors duration-200 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPriceUp = analysis?.change_percent >= 0;
  const priceColor = isPriceUp ? "text-emerald-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 space-y-8">
        {/* Back and Add to Watchlist Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-2 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {watchlists.length > 0 && (
            <div className="flex items-center gap-2 bg-card-dark border border-border-dark p-2 rounded-2xl">
              <select
                value={selectedWlId}
                onChange={(e) => setSelectedWlId(e.target.value)}
                className="bg-bg-dark border border-border-dark rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
              >
                {watchlists.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddToWatchlist}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                Add
              </button>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl text-xs">
            {successMsg}
          </div>
        )}

        {/* Stock Core Information Banner */}
        <div className="bg-gradient-to-r from-card-dark to-card-dark/40 border border-border-dark rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white m-0 tracking-tight">{info?.symbol.toUpperCase()}</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                {info?.currency}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-gray-400 m-0">{info?.name}</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Sector: <span className="text-gray-300 font-medium">{info?.sector}</span></span>
              <span>Industry: <span className="text-gray-300 font-medium">{info?.industry}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-bg-dark/40 border border-border-dark/50 p-4 rounded-2xl">
            <div className="text-right">
              <span className="text-xs text-gray-500 block mb-1">Current Price</span>
              <span className="text-xl font-bold text-white">
                {info?.currentPrice?.toFixed(2) || "0.00"}{" "}
                <span className="text-xs text-gray-500">{info?.currency}</span>
              </span>
            </div>
            <div className="w-[1px] h-8 bg-border-dark" />
            <div className="text-right">
              <span className="text-xs text-gray-500 block mb-1">Daily Change</span>
              <span className={`text-base font-bold ${priceColor}`}>
                {analysis?.change_percent ? (
                  <>
                    {analysis.change_percent >= 0 ? "+" : ""}
                    {analysis.change_percent.toFixed(2)}%
                  </>
                ) : (
                  "0.00%"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Charts & Graphs with Tab Selection */}
        <div className="space-y-4">
          <div className="flex border-b border-border-dark gap-6">
            <button
              onClick={() => setActiveChartTab("custom")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
                activeChartTab === "custom"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Advanced Technical Chart (SMA/EMA/BB)
            </button>
            <button
              onClick={() => setActiveChartTab("tradingview")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
                activeChartTab === "tradingview"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              TradingView Interactive Chart
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {activeChartTab === "custom" ? (
              <StockChart data={history} priceActionData={priceAction} patternsData={patterns} />
            ) : (
              <TradingViewWidget symbol={symbol} />
            )}
          </div>
        </div>

        {/* Computed Indicators */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Technical Indicators Dashboard
          </h2>
          <IndicatorsSummary analysis={analysis} />
        </div>

        {/* Price Action Logs Section */}
        {priceAction && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Log */}
            <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4 flex flex-col">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-border-dark pb-3 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Price Action & Structural Event Log
              </h3>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border-dark/50 pr-2 flex-1">
                {(() => {
                  const events: any[] = [];
                  if (priceAction.structure_events) {
                    priceAction.structure_events.forEach((x: any) => events.push({ ...x, category: "structure" }));
                  }
                  if (priceAction.candlesticks) {
                    priceAction.candlesticks.forEach((x: any) => events.push({ ...x, category: "candlestick" }));
                  }
                  if (priceAction.liquidity_sweeps) {
                    priceAction.liquidity_sweeps.forEach((x: any) => events.push({ ...x, category: "sweep" }));
                  }
                  if (priceAction.fakeouts) {
                    priceAction.fakeouts.forEach((x: any) => events.push({ ...x, category: "fakeout" }));
                  }
                  if (priceAction.breakouts) {
                    priceAction.breakouts.forEach((x: any) => events.push({ ...x, category: "breakout" }));
                  }
                  
                  // Sort latest first
                  events.sort((a, b) => {
                    const tA = typeof a.time === "number" ? a.time : new Date(a.time).getTime() || 0;
                    const tB = typeof b.time === "number" ? b.time : new Date(b.time).getTime() || 0;
                    return tB - tA;
                  });

                  if (events.length === 0) {
                    return <p className="text-xs text-gray-500 py-6 text-center">No structural breaks or wicks sweeps detected.</p>;
                  }

                  return events.map((evt, idx) => {
                    const isBullish = evt.name.toLowerCase().includes("bullish") || evt.name.includes("Hammer") || evt.name.includes("Tweezer Bottom");
                    const isBearish = evt.name.toLowerCase().includes("bearish") || evt.name.includes("Star") || evt.name.includes("Tweezer Top");
                    const badgeColor = isBullish 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : isBearish 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-border-dark text-gray-400 border-transparent";

                    return (
                      <div key={idx} className="py-3.5 flex justify-between items-start gap-4 hover:bg-bg-dark/10 px-2 rounded-xl transition-all duration-200">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${badgeColor}`}>
                              {evt.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold">{evt.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">{evt.details || "Candlestick pattern confirmed."}</p>
                        </div>
                        {evt.price && (
                          <span className="text-xs font-bold text-white flex-shrink-0">
                            {evt.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Zones & Imbalances Log */}
            <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4 flex flex-col">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-border-dark pb-3 mb-1">
                <Layers className="w-4 h-4 text-purple-400" />
                Institutional Zones & Gaps (FVG)
              </h3>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border-dark/50 pr-2 flex-1">
                {(() => {
                  const zones: any[] = [];
                  if (priceAction.fvgs) {
                    priceAction.fvgs.forEach((x: any) => zones.push({ ...x, category: "fvg" }));
                  }
                  if (priceAction.order_blocks) {
                    priceAction.order_blocks.forEach((x: any) => zones.push({ ...x, category: "ob" }));
                  }
                  if (priceAction.supply_zones) {
                    priceAction.supply_zones.forEach((x: any) => zones.push({ ...x, category: "supply" }));
                  }
                  if (priceAction.demand_zones) {
                    priceAction.demand_zones.forEach((x: any) => zones.push({ ...x, category: "demand" }));
                  }

                  // Sort latest first
                  zones.sort((a, b) => {
                    const tA = typeof a.time === "number" ? a.time : new Date(a.time).getTime() || 0;
                    const tB = typeof b.time === "number" ? b.time : new Date(b.time).getTime() || 0;
                    return tB - tA;
                  });

                  if (zones.length === 0) {
                    return <p className="text-xs text-gray-500 py-6 text-center">No order blocks or FVG gaps detected.</p>;
                  }

                  return zones.map((z, idx) => {
                    const isDemand = z.category === "demand" || z.type === "bullish_ob" || z.type === "bullish_fvg";
                    const badgeColor = isDemand
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20";

                    return (
                      <div key={idx} className="py-3.5 flex justify-between items-start gap-4 hover:bg-bg-dark/10 px-2 rounded-xl transition-all duration-200">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${badgeColor}`}>
                              {z.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold">{z.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">{z.details || "Order zone active."}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-bold text-white block">
                            {z.top ? `${z.top.toFixed(2)}` : z.price.toFixed(2)}
                          </span>
                          {z.bottom && (
                            <span className="text-[10px] text-gray-500 block font-medium mt-0.5">
                              to {z.bottom.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Detected Chart Patterns Feed */}
        {patterns && patterns.length > 0 && (
          <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-border-dark pb-3">
              <Cpu className="w-4 h-4 text-purple-400" />
              Detected Geometric Chart Patterns
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {patterns.map((p, idx) => {
                const isBullish = p.direction === "Bullish";
                const badgeColor = isBullish 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20";
                
                return (
                  <div key={idx} className="border border-border-dark/60 bg-bg-dark/20 p-5 rounded-2xl space-y-4 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="block text-sm font-bold text-white">{p.name}</span>
                        <div className="flex gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${badgeColor}`}>
                            {p.direction}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 border border-border-dark text-gray-400 rounded-full">
                            Confidence: {p.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold block">Win Prob.</span>
                        <span className="text-sm font-black text-purple-400">{p.probability}%</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                      {p.explanation}
                    </p>

                    {p.points && p.points.length > 0 && (
                      <div className="bg-bg-dark/40 border border-border-dark/40 rounded-xl p-3 space-y-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide block">Structural Coordinates</span>
                        <div className="grid grid-cols-2 gap-2">
                          {p.points.map((pt: any, ptIdx: number) => (
                            <div key={ptIdx} className="text-[10px] flex justify-between bg-card-dark border border-border-dark/30 p-2 rounded-lg">
                              <span className="text-gray-400 truncate">{pt.label}:</span>
                              <span className="font-semibold text-white ml-2">{pt.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI summary Generation Section */}
        <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border-dark pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-2xl">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Technical Outlook</h3>
                <p className="text-xs text-gray-500">Analyze current trend, S&R, and indicators via local LLM</p>
              </div>
            </div>
            <button
              onClick={handleGenerateAiSummary}
              disabled={aiLoading}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-800 text-white text-xs font-semibold px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-colors duration-200 cursor-pointer shadow-lg shadow-purple-500/10"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Outlook...
                </>
              ) : (
                "Generate AI Summary"
              )}
            </button>
          </div>

          {aiSummary ? (
            <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-bg-dark/30 border border-border-dark p-6 rounded-2xl">
              {aiSummary}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-gray-500">
              {aiLoading ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                  <p className="text-xs">Ollama is digesting metrics and drafting technical summary...</p>
                </div>
              ) : (
                <p className="text-xs">Click the button to request local AI Technical summary of indicators.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
