import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, PieChart, ShieldAlert,
  Calendar, RotateCw, RefreshCw, Cpu, CheckCircle2, AlertTriangle, Loader2 
} from "lucide-react";

interface HoldingItem {
  id: number;
  symbol: string;
  name: string;
  shares: number;
  avg_price: number;
  current_price: number;
  total_cost: number;
  total_value: number;
  pnl: number;
  pnl_percent: number;
  dividend_received: number;
  projected_annual_dividend: number;
  sector: string;
  allocation_percent: number;
}

interface SectorAllocationItem {
  sector: string;
  value: number;
  percentage: number;
}

interface RiskAnalysis {
  beta_category: string;
  rating: string;
}

interface SummaryData {
  total_cost: number;
  total_value: number;
  total_pnl: number;
  pnl_percent: number;
  portfolio_beta: number;
  projected_annual_dividends: number;
  holdings: HoldingItem[];
  sector_allocation: SectorAllocationItem[];
  risk_analysis: RiskAnalysis;
}

export default function Portfolio() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingJournal, setSyncingJournal] = useState(false);
  const [syncingWatchlist, setSyncingWatchlist] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [aiReview, setAiReview] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await api.portfolio.getSummary();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch portfolio summary data.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportJournal = async () => {
    setSyncingJournal(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.portfolio.importJournal();
      setSuccessMsg(`Synced! Imported trades logs: updated ${res.synced_count} assets holdings.`);
      fetchSummary();
    } catch (err: any) {
      console.error(err);
      setError("Failed to import trades from Trading Journal.");
    } finally {
      setSyncingJournal(false);
    }
  };

  const handleSyncWatchlist = async () => {
    setSyncingWatchlist(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.portfolio.syncWatchlist();
      setSuccessMsg(`Synced! watchlists checked: initialized ${res.synced_count} placeholder holdings.`);
      fetchSummary();
    } catch (err: any) {
      console.error(err);
      setError("Failed to sync watchlist symbols.");
    } finally {
      setSyncingWatchlist(false);
    }
  };

  const handleGetAiReview = async () => {
    setLoadingReview(true);
    setError("");
    try {
      const res = await api.portfolio.getAiReview();
      setAiReview(res.review);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate AI portfolio review.");
    } finally {
      setLoadingReview(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 space-y-8 text-xs">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-card-dark to-card-dark/40 border border-border-dark p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <h1 className="text-xl font-black text-white m-0 tracking-tight flex items-center gap-2">
              Portfolio Console Workspace
              <PieChart className="w-5 h-5 text-emerald-400" />
            </h1>
            <p className="text-[10px] text-gray-500 mt-1">
              Verify allocations percentages, benchmark risks weighted beta metrics, dividend yields, and watchlists sync triggers.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncWatchlist}
              disabled={syncingWatchlist}
              className="bg-bg-dark border border-border-dark hover:bg-border-dark/80 px-3.5 py-2 rounded-xl text-gray-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {syncingWatchlist ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5 text-emerald-400" />}
              Sync Watchlist
            </button>
            <button
              onClick={handleImportJournal}
              disabled={syncingJournal}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {syncingJournal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Import Journal Trades
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500 flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="font-semibold">Compiling asset metrics...</span>
          </div>
        ) : summary ? (
          <>
            {/* Valuation Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card-dark border border-border-dark p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Portfolio Net Value</span>
                  <span className="text-lg font-black text-white mt-1 block">{formatCurrency(summary.total_value)}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="bg-card-dark border border-border-dark p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Acquisition Cost</span>
                  <span className="text-lg font-black text-white mt-1 block">{formatCurrency(summary.total_cost)}</span>
                </div>
                <div className="bg-bg-dark border border-border-dark p-3 rounded-xl">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                </div>
              </div>

              <div className="bg-card-dark border border-border-dark p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Net Profit/Loss</span>
                  <span className={`text-lg font-black mt-1 block flex items-center gap-1 ${summary.total_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {summary.total_pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {formatCurrency(summary.total_pnl)} ({summary.pnl_percent.toFixed(2)}%)
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${summary.total_pnl >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  <Percent className={`w-5 h-5 ${summary.total_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`} />
                </div>
              </div>

              <div className="bg-card-dark border border-border-dark p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">S&P 500 Volatility Beta</span>
                  <span className="text-lg font-black text-white mt-1 block">{summary.portfolio_beta.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark border border-border-dark p-3 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Holdings workspace table */}
            <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Holdings Configurations</span>
              
              {summary.holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="text-gray-500 border-b border-border-dark/30">
                        <th className="pb-2">Asset Ticker</th>
                        <th className="pb-2">Shares count</th>
                        <th className="pb-2">Avg Cost</th>
                        <th className="pb-2">Current Price</th>
                        <th className="pb-2">Total Value</th>
                        <th className="pb-2">Allocation Weight</th>
                        <th className="pb-2">Sector category</th>
                        <th className="pb-2 text-right">Net Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark/20">
                      {summary.holdings.map((h) => (
                        <tr key={h.id} className="hover:bg-bg-dark/10">
                          <td className="py-2.5">
                            <span className="block font-bold text-white">{h.symbol}</span>
                            <span className="block text-[9px] text-gray-500 truncate">{h.name}</span>
                          </td>
                          <td className="py-2.5 text-gray-300">{h.shares.toFixed(2)}</td>
                          <td className="py-2.5 text-gray-300">{formatCurrency(h.avg_price)}</td>
                          <td className="py-2.5 text-gray-300">{formatCurrency(h.current_price)}</td>
                          <td className="py-2.5 font-semibold text-white">{formatCurrency(h.total_value)}</td>
                          <td className="py-2.5 font-bold text-gray-400">{h.allocation_percent.toFixed(1)}%</td>
                          <td className="py-2.5 text-gray-500">{h.sector}</td>
                          <td className={`py-2.5 text-right font-bold ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {h.pnl >= 0 ? "+" : ""}{formatCurrency(h.pnl)} ({h.pnl_percent.toFixed(2)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-600">
                  <span>No holdings configurations compiled yet. Re-synchronize using the top buttons.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Sector allocations list */}
              <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4 lg:col-span-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Sectors Distribution</span>
                {summary.sector_allocation.length > 0 ? (
                  <div className="space-y-3">
                    {summary.sector_allocation.map((s) => (
                      <div key={s.sector} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-300 font-semibold">{s.sector}</span>
                          <span className="text-gray-500 font-bold">{s.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-bg-dark h-2 rounded-full overflow-hidden border border-border-dark/30">
                          <div 
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${s.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-600">No sector divisions.</div>
                )}
              </div>

              {/* Dividends & Risk review summary */}
              <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4 lg:col-span-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Compound Yield Trackers</span>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-bg-dark/40 border border-border-dark p-3.5 rounded-2xl">
                    <Calendar className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Projected Annual Dividend</span>
                      <span className="text-base font-black text-white mt-0.5 block">{formatCurrency(summary.projected_annual_dividends)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-[10px] text-gray-400 leading-relaxed bg-bg-dark/20 border border-border-dark p-4 rounded-2xl">
                    <div className="flex justify-between border-b border-border-dark/30 pb-1">
                      <span>Portfolio Risk Matrix</span>
                      <span className="font-bold text-white">{summary.risk_analysis.beta_category}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Index Beta Sensitivity</span>
                      <span className="font-bold text-emerald-400">{summary.risk_analysis.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI reviews workspace */}
              <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4 lg:col-span-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Portfolio Reviews</span>
                  <button
                    onClick={handleGetAiReview}
                    disabled={loadingReview}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer text-[10px]"
                  >
                    {loadingReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
                    Request AI Review
                  </button>
                </div>

                {loadingReview ? (
                  <div className="py-12 text-center text-gray-600 flex justify-center items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Analyzing allocation weights...</span>
                  </div>
                ) : aiReview ? (
                  <div className="bg-bg-dark/60 border border-border-dark p-4 rounded-2xl text-[10px] text-gray-300 whitespace-pre-line leading-relaxed font-mono">
                    {aiReview}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-600 text-[10px]">
                    <span>Click the request button to compile personalized allocations risk feedbacks from the AI Copilot.</span>
                  </div>
                )}
              </div>

            </div>
          </>
        ) : null}

      </main>
    </div>
  );
}
