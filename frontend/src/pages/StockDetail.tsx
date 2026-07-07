import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import StockChart from "../components/StockChart";
import IndicatorsSummary from "../components/IndicatorsSummary";
import { ArrowLeft, Loader2, Star, AlertTriangle, Cpu, TrendingUp, DollarSign, Award } from "lucide-react";

export default function StockDetail() {
  const { symbol = "" } = useParams<{ symbol: string }>();
  const [info, setInfo] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  
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
      // Parallel fetches for standard info, history, analysis, and watchlists
      const [infoData, historyData, analysisData, wlData] = await Promise.all([
        api.stocks.getInfo(symbol),
        api.stocks.getHistory(symbol, "6mo", "1d"), // Load 6 months of daily data
        api.stocks.getAnalysis(symbol, "1y", "1d"),
        api.watchlists.getWatchlists()
      ]);

      setInfo(infoData);
      setHistory(historyData);
      setAnalysis(analysisData);
      setWatchlists(wlData);
      
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

        {/* Charts & Graphs */}
        <div className="grid grid-cols-1 gap-6">
          <StockChart data={history} />
        </div>

        {/* Computed Indicators */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Technical Indicators Dashboard
          </h2>
          <IndicatorsSummary analysis={analysis} />
        </div>

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
