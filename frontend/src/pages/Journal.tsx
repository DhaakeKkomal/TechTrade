import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { 
  Plus, Loader2, Sparkles, BookOpen, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Trash2, FileText, Image as ImageIcon, HelpCircle, Brain, Target, ShieldCheck, TrendingUp, X 
} from "lucide-react";

export default function Journal() {
  const [trades, setTrades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal Logger State
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState("LONG");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [notes, setNotes] = useState("");
  const [emotionsBefore, setEmotionsBefore] = useState("Calm");
  const [emotionsAfter, setEmotionsAfter] = useState("Calm");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Close Trade Modal/Form
  const [closingTradeId, setClosingTradeId] = useState<number | null>(null);
  const [closeExitPrice, setCloseExitPrice] = useState("");
  const [closeEmotionsAfter, setCloseEmotionsAfter] = useState("Calm");
  const [closeLoading, setCloseLoading] = useState(false);

  // AI Feedback Modal / State
  const [selectedFeedbackTradeId, setSelectedFeedbackTradeId] = useState<number | null>(null);
  const [aiCoachFeedback, setAiCoachFeedback] = useState<any>(null);
  const [aiCoachLoading, setAiCoachLoading] = useState(false);

  // Monthly Report State
  const [showReport, setShowReport] = useState(false);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tradesData, statsData] = await Promise.all([
        api.journal.getTrades(),
        api.journal.getStats()
      ]);
      setTrades(tradesData);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load trading journal data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setSymbol("");
    setDirection("LONG");
    setEntryPrice("");
    setExitPrice("");
    setStopLoss("");
    setTarget("");
    setPositionSize("");
    setNotes("");
    setEmotionsBefore("Calm");
    setEmotionsAfter("Calm");
    setSelectedFile(null);
  };

  const handleSaveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !entryPrice || !positionSize) {
      setError("Please fill in symbol, entry price, and position size.");
      return;
    }

    setSaveLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("symbol", symbol);
    formData.append("direction", direction);
    formData.append("entry_price", entryPrice);
    formData.append("position_size", positionSize);
    formData.append("notes", notes);
    formData.append("emotions_before", emotionsBefore);
    formData.append("emotions_after", emotionsAfter);
    
    if (exitPrice) formData.append("exit_price", exitPrice);
    if (stopLoss) formData.append("stop_loss", stopLoss);
    if (target) formData.append("target", target);
    if (selectedFile) formData.append("file", selectedFile);

    try {
      await api.journal.createTrade(formData);
      setSuccess("Trade entry logged successfully!");
      resetForm();
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to log trade.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCloseTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingTradeId || !closeExitPrice) return;
    setCloseLoading(true);
    try {
      await api.journal.updateTrade(closingTradeId, {
        exit_price: parseFloat(closeExitPrice),
        emotions_after: closeEmotionsAfter
      });
      setSuccess("Trade closed successfully!");
      setClosingTradeId(null);
      setCloseExitPrice("");
      setCloseEmotionsAfter("Calm");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to close trade.");
    } finally {
      setCloseLoading(false);
    }
  };

  const handleDeleteTrade = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this trade entry?")) return;
    try {
      await api.journal.deleteTrade(id);
      setSuccess("Trade deleted.");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete trade.");
    }
  };

  const handleAskCoach = async (id: number) => {
    setSelectedFeedbackTradeId(id);
    setAiCoachLoading(true);
    setAiCoachFeedback(null);
    try {
      const feedback = await api.journal.getTradeAiFeedback(id);
      setAiCoachFeedback(feedback);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch AI Coach feedback. Ensure connection is stable.");
    } finally {
      setAiCoachLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setMonthlyReport(null);
    try {
      const data = await api.journal.getMonthlyReport(reportYear, reportMonth);
      setMonthlyReport(data);
      setShowReport(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate monthly report.");
    } finally {
      setReportLoading(false);
    }
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
              <BookOpen className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">Trading Journal</h1>
              <p className="text-xs text-gray-400 mt-1">Review statistical expectancy, upload screenshots and get automated feedback from your AI Coach.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setMonthlyReport(null);
                setShowReport(true);
              }}
              className="bg-card-dark hover:bg-border-dark text-gray-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-semibold border border-border-dark transition-all duration-300 cursor-pointer"
            >
              Monthly Reports
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4.5 h-4.5" /> Record Trade
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Aggregate Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Win Rate", value: `${stats.win_rate.toFixed(1)}%`, highlight: stats.win_rate >= 50 },
              { label: "Profit Factor", value: stats.profit_factor.toFixed(2), highlight: stats.profit_factor >= 1.5 },
              { label: "Expectancy", value: `${stats.expectancy >= 0 ? "+" : ""}${stats.expectancy.toFixed(2)}`, highlight: stats.expectancy >= 0 },
              { label: "Risk Reward", value: `1:${stats.risk_reward.toFixed(1)}`, highlight: true },
              { label: "Net P&L", value: `${stats.total_pnl >= 0 ? "+" : ""}${stats.total_pnl.toFixed(2)}`, highlight: stats.total_pnl >= 0, sub: `${stats.winning_trades}W - ${stats.losing_trades}L` }
            ].map((card, idx) => (
              <div key={idx} className="bg-card-dark border border-border-dark rounded-2xl p-5 flex flex-col justify-between gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</span>
                <div>
                  <span className={`text-base font-black ${card.highlight ? "text-emerald-400" : "text-red-400"}`}>
                    {card.value}
                  </span>
                  {card.sub && <span className="block text-[9px] text-gray-500 mt-0.5">{card.sub}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trades Table Feed */}
        <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border-dark pb-4 mb-4">
            Logged Trades Journal
          </h3>

          {loading ? (
            <div className="py-16 text-center flex flex-col justify-center items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-gray-500">Loading journal records...</p>
            </div>
          ) : trades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b border-border-dark/50">
                    <th className="pb-3 font-semibold">Asset</th>
                    <th className="pb-3 font-semibold">Direction</th>
                    <th className="pb-3 font-semibold text-right">Entry</th>
                    <th className="pb-3 font-semibold text-right">Exit</th>
                    <th className="pb-3 font-semibold text-right">Stop/Target</th>
                    <th className="pb-3 font-semibold text-right">Size</th>
                    <th className="pb-3 font-semibold text-right">Net P&L</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                    <th className="pb-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark/50">
                  {trades.map((trade) => {
                    const isWinning = trade.pnl > 0;
                    const isClosed = trade.status === "CLOSED";
                    const pnlColor = isWinning ? "text-emerald-400" : (isClosed && trade.pnl < 0 ? "text-red-400" : "text-gray-400");
                    const directionColor = trade.direction === "LONG" ? "text-emerald-400" : "text-red-400";
                    
                    return (
                      <React.Fragment key={trade.id}>
                        <tr className="group hover:bg-bg-dark/10 transition-colors duration-200">
                          <td className="py-4 font-bold">{trade.symbol}</td>
                          
                          <td className={`py-4 font-bold ${directionColor}`}>{trade.direction}</td>
                          
                          <td className="py-4 text-right font-semibold text-white">{trade.entry_price.toFixed(2)}</td>
                          
                          <td className="py-4 text-right font-semibold text-white">
                            {trade.exit_price ? trade.exit_price.toFixed(2) : "-"}
                          </td>
                          
                          <td className="py-4 text-right text-gray-500">
                            <span className="block text-red-500/70">{trade.stop_loss ? `SL: ${trade.stop_loss.toFixed(2)}` : "SL: -"}</span>
                            <span className="block text-emerald-500/70">{trade.target ? `TP: ${trade.target.toFixed(2)}` : "TP: -"}</span>
                          </td>
                          
                          <td className="py-4 text-right font-medium text-white">{trade.position_size}</td>
                          
                          <td className={`py-4 text-right font-bold ${pnlColor}`}>
                            {isClosed ? `${trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}` : "Active"}
                          </td>
                          
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              isClosed ? "bg-border-dark text-gray-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {trade.status}
                            </span>
                          </td>
                          
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {!isClosed && (
                                <button
                                  onClick={() => setClosingTradeId(trade.id)}
                                  className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold border border-emerald-500/20 transition-all duration-200 cursor-pointer"
                                >
                                  Close
                                </button>
                              )}
                              <button
                                onClick={() => handleAskCoach(trade.id)}
                                className="bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white p-1 rounded-lg border border-purple-500/20 transition-all duration-200 cursor-pointer"
                                title="Analyze with AI Coach"
                              >
                                <Brain className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrade(trade.id)}
                                className="text-gray-500 hover:text-red-400 p-1 rounded-lg transition-colors duration-200 cursor-pointer"
                                title="Delete Log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expander containing details */}
                        <tr className="bg-bg-dark/10">
                          <td colSpan={9} className="px-4 py-3 border-b border-border-dark/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed text-gray-400 font-medium">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Trading Notes</span>
                                <p className="text-gray-300 italic">{trade.notes || "No notes logged for this entry."}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Trade Psychology</span>
                                <div>
                                  <span className="block text-gray-400">Emotions Before: <strong className="text-white">{trade.emotions_before || "N/A"}</strong></span>
                                  <span className="block text-gray-400">Emotions After: <strong className="text-white">{trade.emotions_after || "N/A"}</strong></span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Chart Attachment</span>
                                {trade.chart_image_url ? (
                                  <a 
                                    href={`http://localhost:8000${trade.chart_image_url}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-1.5 text-emerald-400 hover:underline hover:text-emerald-300"
                                  >
                                    <ImageIcon className="w-4 h-4" /> View logged screenshot
                                  </a>
                                ) : (
                                  <span className="text-gray-600 italic">No image logged.</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500">
              <FileText className="w-10 h-10 text-gray-700 mb-3 mx-auto" />
              <p className="text-xs font-semibold text-gray-400">Trading Journal is empty</p>
              <p className="text-[10px] text-gray-600 max-w-xs mx-auto mt-1 leading-relaxed">
                Log your first trade to calculate win rate statistics, keep track of rule discipline, and retrieve emotional analysis reports.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Record Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-card-dark border border-border-dark rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Log Trading Journal Entry</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveTrade} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Stock Ticker Symbol</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="AAPL or RELIANCE.NS"
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="LONG">LONG (BUY)</option>
                    <option value="SHORT">SHORT (SELL)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="150.00"
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Stop Loss (SL)</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="145.00"
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Target Price (TP)</label>
                  <input
                    type="number"
                    step="any"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="165.00"
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Position Size (Shares)</label>
                  <input
                    type="number"
                    required
                    value={positionSize}
                    onChange={(e) => setPositionSize(e.target.value)}
                    placeholder="50"
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Exit Price (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="Leave empty if open"
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Emotions Before Entry</label>
                  <select
                    value={emotionsBefore}
                    onChange={(e) => setEmotionsBefore(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="Calm">Calm & Objective</option>
                    <option value="Fear">Fear of Missing Out (FOMO)</option>
                    <option value="Greed">Greed / Impulse chasing</option>
                    <option value="Anxiety">Anxious / Over-leveraged</option>
                    <option value="Calm">Boredom entry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Emotions After Exit</label>
                  <select
                    value={emotionsAfter}
                    onChange={(e) => setEmotionsAfter(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="Calm">Calm Acceptance</option>
                    <option value="Relief">Relief (cut loss/profit early)</option>
                    <option value="Frustration">Frustration / Anger</option>
                    <option value="Joy">Elation / Euphoria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Logged Notes & Rationale</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why did you take this setup? Did you stick to your triggers?"
                  rows={3}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Chart Screenshot Attachment</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border-dark hover:border-emerald-500/50 bg-bg-dark/10 p-5 text-center cursor-pointer rounded-xl flex items-center justify-center gap-2 group transition-all"
                >
                  <ImageIcon className="w-5 h-5 text-gray-500 group-hover:text-emerald-400" />
                  <span className="text-[11px] font-semibold text-gray-400 group-hover:text-white">
                    {selectedFile ? selectedFile.name : "Attach Chart Image (PNG/JPG)"}
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border-dark">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {saveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Trade Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-border-dark text-gray-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Position Modal */}
      {closingTradeId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-card-dark border border-border-dark rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-dark">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Close Trade Position</span>
              <button onClick={() => setClosingTradeId(null)} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCloseTradeSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={closeExitPrice}
                  onChange={(e) => setCloseExitPrice(e.target.value)}
                  placeholder="155.00"
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Post-Trade Emotions</label>
                <select
                  value={closeEmotionsAfter}
                  onChange={(e) => setCloseEmotionsAfter(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="Calm">Calm Acceptance</option>
                  <option value="Relief">Relief / Fear mitigation</option>
                  <option value="Frustration">Frustration / Anger</option>
                  <option value="Joy">Elation / Euphoria</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border-dark">
                <button
                  type="submit"
                  disabled={closeLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {closeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Close
                </button>
                <button
                  type="button"
                  onClick={() => setClosingTradeId(null)}
                  className="bg-border-dark text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Coach Analysis Modal */}
      {selectedFeedbackTradeId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-card-dark border border-border-dark rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">AI Coach Single-Trade Diagnostics</span>
              </div>
              <button onClick={() => setSelectedFeedbackTradeId(null)} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {aiCoachLoading ? (
                <div className="py-12 flex flex-col justify-center items-center gap-3">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="text-gray-500">AI Coach is reviewing your journal data...</p>
                </div>
              ) : aiCoachFeedback ? (
                <div className="space-y-5">
                  <div className="bg-purple-500/5 border border-purple-500/15 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block">Discipline Analysis</span>
                    <p className="text-gray-300 leading-relaxed">{aiCoachFeedback.discipline}</p>
                  </div>
                  
                  <div className="bg-red-500/5 border border-red-500/15 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide block">Errors & Mistakes Detected</span>
                    <ul className="space-y-1">
                      {aiCoachFeedback.mistakes.map((m: string, mIdx: number) => (
                        <li key={mIdx} className="text-gray-300 flex items-start gap-1.5">
                          <span className="text-red-400 font-bold">•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">Psychological & Emotional Bias</span>
                    <p className="text-gray-300 leading-relaxed">{aiCoachFeedback.emotions}</p>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">Risk Management Advice</span>
                    <p className="text-gray-300 leading-relaxed">{aiCoachFeedback.risk_management}</p>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block">Personalized Feedback</span>
                    <p className="text-gray-200 leading-relaxed italic">"{aiCoachFeedback.feedback}"</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No analysis returned from AI Coach.</p>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-border-dark flex justify-end">
              <button
                onClick={() => setSelectedFeedbackTradeId(null)}
                className="bg-border-dark text-gray-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-card-dark border border-border-dark rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">AI Monthly Performance synthesis Report</span>
              </div>
              <button onClick={() => setShowReport(false)} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Report Config Form */}
              <div className="flex flex-wrap items-center gap-4 bg-bg-dark/40 border border-border-dark p-4 rounded-xl">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Year</label>
                  <select
                    value={reportYear}
                    onChange={(e) => setReportYear(parseInt(e.target.value))}
                    className="bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Month</label>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(parseInt(e.target.value))}
                    className="bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1, 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold px-5 py-2 rounded-xl text-[11px] transition-all flex items-center gap-1 cursor-pointer self-end mt-0 md:mt-2 shadow-lg shadow-emerald-500/10"
                >
                  {reportLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Generate Report
                </button>
              </div>

              {monthlyReport ? (
                <div className="space-y-6">
                  {/* Monthly stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-bg-dark/60 border border-border-dark/40 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1">Monthly PnL</span>
                      <span className={`text-base font-black ${monthlyReport.total_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {monthlyReport.total_pnl >= 0 ? "+" : ""}{monthlyReport.total_pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-bg-dark/60 border border-border-dark/40 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1">Win Rate</span>
                      <span className="text-base font-black text-white">{monthlyReport.win_rate.toFixed(1)}%</span>
                    </div>
                    <div className="bg-bg-dark/60 border border-border-dark/40 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1">Profit Factor</span>
                      <span className="text-base font-black text-white">{monthlyReport.profit_factor.toFixed(2)}</span>
                    </div>
                    <div className="bg-bg-dark/60 border border-border-dark/40 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1">Expectancy</span>
                      <span className="text-base font-black text-white">{monthlyReport.stats.expectancy.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Coach analysis */}
                  <div className="bg-purple-500/5 border border-purple-500/15 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-purple-500/10 pb-2">
                      <Brain className="w-4 h-4" /> AI Performance synthesis
                    </span>
                    <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-line text-[11px]">
                      {monthlyReport.ai_feedback}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <FileText className="w-8 h-8 text-gray-700 mb-2 mx-auto" />
                  <p className="text-xs font-semibold">Select year/month and click Generate</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border-dark flex justify-end">
              <button
                onClick={() => setShowReport(false)}
                className="bg-border-dark text-gray-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
