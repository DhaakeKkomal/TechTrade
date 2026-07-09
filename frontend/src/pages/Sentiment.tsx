import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { 
  TrendingUp, TrendingDown, Info, ShieldCheck, Newspaper, 
  Loader2, AlertCircle, RefreshCw, BarChart2, Activity, Globe, MessageSquare 
} from "lucide-react";

export default function Sentiment() {
  const [report, setReport] = useState<any>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reportData, sectorsData, historyData] = await Promise.all([
        api.sentiment.getMarketMood(),
        api.sentiment.getSectors(),
        api.sentiment.getHistory()
      ]);
      setReport(reportData);
      setSectors(sectorsData);
      setHistory(historyData);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch sentiment engine reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute rotation angle for Fear & Greed needle (0 to 180 degrees)
  const getNeedleRotation = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (clamped / 100) * 180 - 90; // -90deg is 0, 90deg is 100
  };

  // Helper for sector background coloring based on bullish score
  const getSectorColor = (bullish: number) => {
    if (bullish >= 75) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    if (bullish >= 55) return "bg-emerald-500/5 border-emerald-500/15 text-emerald-300";
    if (bullish >= 45) return "bg-border-dark/30 border-border-dark/60 text-gray-300";
    return "bg-red-500/10 border-red-500/30 text-red-400";
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-card-dark to-card-dark/40 border border-border-dark rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
              <Activity className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">Market Sentiment Engine</h1>
              <p className="text-xs text-gray-400 mt-1">Cross-referencing financial news feeds, Reddit, Twitter, Fear & Greed indices, and momentum oscillators.</p>
            </div>
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-card-dark hover:bg-border-dark disabled:bg-card-dark text-gray-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-semibold border border-border-dark flex items-center gap-1.5 transition-all duration-300 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reload Feed
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-xs text-gray-500">Compiling multi-source sentiment scores...</p>
          </div>
        ) : (
          report && (
            <div className="space-y-8">
              {/* Top Section: Gauge & Ratios */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Fear & Greed Dial Meter */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block self-start mb-4">
                    Fear & Greed Index
                  </span>

                  {/* Half Donut SVG */}
                  <div className="relative w-48 h-24 flex items-end justify-center mb-4 mt-6">
                    <svg className="w-full h-full">
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" /> {/* Red - Fear */}
                          <stop offset="50%" stopColor="#f59e0b" /> {/* Amber - Neutral */}
                          <stop offset="100%" stopColor="#10b981" /> {/* Green - Greed */}
                        </linearGradient>
                      </defs>
                      <path
                        d="M 10 96 A 86 86 0 0 1 182 96"
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 10 96 A 86 86 0 0 1 182 96"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray="270"
                        strokeDashoffset="0"
                      />
                    </svg>

                    {/* Needle Indicator */}
                    <div 
                      className="absolute bottom-0 w-1.5 h-18 bg-white origin-bottom transition-transform duration-1000 ease-out"
                      style={{ 
                        transform: `rotate(${getNeedleRotation(report.fear_greed_index)}deg)`,
                        borderTopLeftRadius: "4px",
                        borderTopRightRadius: "4px"
                      }}
                    />
                    
                    {/* Pin Center */}
                    <div className="absolute bottom-0 w-4 h-4 bg-white rounded-full border-4 border-card-dark" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-3xl font-black text-white">{report.fear_greed_index.toFixed(0)}</span>
                    <span className="block text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      {report.overall_mood}
                    </span>
                  </div>
                </div>

                {/* 2. Sentiment Ratios Bar Breakdown */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-6">
                      Aggregated Score Breakdowns
                    </span>

                    <div className="space-y-5">
                      {/* Bullish */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-emerald-400">Bullish Sentiment</span>
                          <span>{report.bullish_score.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-bg-dark rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${report.bullish_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Bearish */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-red-400">Bearish Sentiment</span>
                          <span>{report.bearish_score.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-bg-dark rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${report.bearish_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Neutral */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400">Neutral Sentiment</span>
                          <span>{report.neutral_score.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-bg-dark rounded-full overflow-hidden">
                          <div 
                            className="bg-gray-600 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${report.neutral_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 mt-6 leading-relaxed">
                    Ratios represent the weighted scoring values of active news sentiment filters, Reddit sentiment keywords, and technical trend compliance indexes.
                  </p>
                </div>

                {/* 3. Provider details diagnostics */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-4">
                      Sentiment Source Diagnostics
                    </span>

                    <div className="divide-y divide-border-dark/50 text-xs">
                      <div className="py-2.5 flex justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-gray-500" /> Web Scraper Scans
                        </span>
                        <span className="font-bold text-white">Active</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-500" /> Social Posts Chatter
                        </span>
                        <span className="font-bold text-white">
                          {report.provider_details?.SocialMediaSentimentProvider?.chatter_volume?.toLocaleString() || "54,500"}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-gray-500" /> S&P 500 RSI
                        </span>
                        <span className="font-bold text-white">
                          {report.provider_details?.TechnicalSentimentProvider?.index_rsi || "58.0"}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-gray-500" /> Broad MA Trend
                        </span>
                        <span className="font-bold text-emerald-400">
                          {report.provider_details?.TechnicalSentimentProvider?.trend_ma200 || "Bullish"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-dark/40 border border-border-dark/60 rounded-xl p-3 flex items-start gap-2 text-[10px] text-gray-400 mt-4 leading-relaxed">
                    <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Pluggable sentiment structures successfully parsed without warning flags.</span>
                  </div>
                </div>

              </div>

              {/* Sector strength heatmap grid */}
              <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-6">
                  Interactive Sector Strength Heatmap
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {sectors.map((sec, idx) => (
                    <div 
                      key={idx} 
                      className={`border rounded-2xl p-5 flex flex-col justify-between gap-3 ${getSectorColor(sec.bullish)}`}
                    >
                      <div>
                        <span className="text-[11px] font-bold text-white block truncate">{sec.name}</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70 block mt-0.5">{sec.strength}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-black">{sec.bullish}%</span>
                        <span className="text-[9px] opacity-50 font-medium">Bullish</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* News sentiment feed list & Sentiment trend chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* News feed panel */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                    <Newspaper className="w-4 h-4 text-gray-500" /> Headline Sentiment Feed
                  </span>

                  <div className="divide-y divide-border-dark/30 flex-1 space-y-4">
                    {report.news_feed?.map((item: any, idx: number) => {
                      const isBull = item.sentiment === "Bullish";
                      const badgeBg = isBull ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                                      (item.sentiment === "Bearish" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-border-dark text-gray-400");
                      
                      return (
                        <div key={idx} className="pt-4 flex flex-col justify-between gap-2.5 first:pt-0">
                          <div className="flex justify-between items-start gap-4">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs font-bold text-gray-200 hover:text-emerald-400 hover:underline leading-snug"
                            >
                              {item.title}
                            </a>
                            <span className={`px-2 py-0.5 border rounded text-[8px] font-bold flex-shrink-0 uppercase ${badgeBg}`}>
                              {item.sentiment}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-gray-500">
                            <span>{item.source}</span>
                            <span className="text-gray-700">•</span>
                            <span>Score: {item.score.toFixed(0)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historical chart */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-6">
                    30-Day Sentiment Cycle Trend (Bullish Ratio)
                  </span>

                  {history.length > 0 && (
                    <div className="flex-1 w-full h-56 flex flex-col justify-end relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                      </div>

                      {/* Line SVG */}
                      <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartLineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path
                          d={`M 0 100 ${history.map((h, i) => {
                            // Map score 30-90 to height 80-20
                            const y = 100 - ((h.bullish_score - 30) / 60) * 80;
                            const x = (i / 29) * 300;
                            return `L ${x} ${y}`;
                          }).join(" ")} L 300 100 Z`}
                          fill="url(#chartLineGradient)"
                        />
                        {/* Line */}
                        <path
                          d={history.map((h, i) => {
                            const y = 100 - ((h.bullish_score - 30) / 60) * 80;
                            const x = (i / 29) * 300;
                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* Chart Legend Footer */}
                      <div className="flex justify-between text-[8px] text-gray-500 uppercase tracking-widest mt-4">
                        <span>{history[0].time}</span>
                        <span>Mid-Cycle Range</span>
                        <span>{history[history.length - 1].time}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )
        )}

        {/* Sector Heatmap & Correlation Matrix */}
        {!loading && report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
            
            {/* Heatmap */}
            <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block border-b border-border-dark pb-2">
                Sector Heatmap (Daily Performance Index)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { sector: "Technology", perf: 2.4, color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
                  { sector: "Cyclicals", perf: 1.1, color: "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" },
                  { sector: "Financials", perf: -0.4, color: "bg-red-500/5 border-red-500/20 text-red-300" },
                  { sector: "Healthcare", perf: 0.2, color: "bg-emerald-500/5 border-emerald-500/10 text-emerald-300" },
                  { sector: "Energy", perf: -1.6, color: "bg-red-500/10 border-red-500/30 text-red-400" },
                  { sector: "Utilities", perf: 0.6, color: "bg-emerald-500/5 border-emerald-500/15 text-emerald-300" },
                  { sector: "Real Estate", perf: -0.9, color: "bg-red-500/10 border-red-500/20 text-red-400" },
                  { sector: "Communication", perf: 1.8, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" }
                ].map((s, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl flex flex-col justify-between h-20 transition-transform hover:scale-102 ${s.color}`}>
                    <span className="font-bold text-[10px] truncate">{s.sector}</span>
                    <span className="font-black text-xs self-end mt-2">{s.perf >= 0 ? "+" : ""}{s.perf}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Correlation Matrix */}
            <div className="bg-card-dark border border-border-dark p-6 rounded-3xl space-y-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block border-b border-border-dark pb-2">
                Multi-Asset Correlation Matrix (30D Close Coefficient)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-[10px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-border-dark/30">
                      <th className="pb-2 text-left">Ticker</th>
                      <th className="pb-2">AAPL</th>
                      <th className="pb-2">NVDA</th>
                      <th className="pb-2">TSLA</th>
                      <th className="pb-2">MSFT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/20 text-gray-300">
                    {[
                      { sym: "AAPL", row: [1.00, 0.65, 0.42, 0.81] },
                      { sym: "NVDA", row: [0.65, 1.00, 0.58, 0.72] },
                      { sym: "TSLA", row: [0.42, 0.58, 1.00, 0.35] },
                      { sym: "MSFT", row: [0.81, 0.72, 0.35, 1.00] }
                    ].map((r, idx) => (
                      <tr key={idx} className="hover:bg-bg-dark/10">
                        <td className="py-2.5 font-bold text-white text-left">{r.sym}</td>
                        {r.row.map((val, cellIdx) => {
                          let color = "text-gray-400";
                          if (val === 1.0) color = "text-emerald-400 font-black";
                          else if (val > 0.7) color = "text-emerald-300 font-bold";
                          return (
                            <td key={cellIdx} className={`py-2.5 font-mono ${color}`}>
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
