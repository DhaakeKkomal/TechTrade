import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { 
  Play, Download, Plus, Trash2, Loader2, AlertCircle, Info, 
  BarChart3, Calendar, DollarSign, ListFilter, Sparkles, TrendingUp 
} from "lucide-react";

interface Rule {
  indicator: string;
  condition: string;
  value: string;
}

export default function Backtest() {
  const [symbol, setSymbol] = useState("AAPL");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2025-01-01");
  const [capital, setCapital] = useState("100000");
  
  // Rules sets
  const [buyRules, setBuyRules] = useState<Rule[]>([
    { indicator: "RSI", condition: "LESS_THAN", value: "30" }
  ]);
  const [sellRules, setSellRules] = useState<Rule[]>([
    { indicator: "RSI", condition: "GREATER_THAN", value: "70" }
  ]);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const availableIndicators = [
    { label: "RSI (14)", value: "RSI" },
    { label: "Close Price", value: "Close" },
    { label: "SMA (20)", value: "SMA20" },
    { label: "SMA (50)", value: "SMA50" },
    { label: "SMA (200)", value: "SMA200" },
    { label: "EMA (20)", value: "EMA20" },
    { label: "MACD", value: "MACD" },
    { label: "Bollinger Upper", value: "BB_Upper" },
    { label: "Bollinger Lower", value: "BB_Lower" },
    { label: "Volume", value: "Volume" },
    { label: "Doji Candlestick", value: "Doji" },
    { label: "Hammer Candlestick", value: "Hammer" },
    { label: "Engulfing Candlestick", value: "Engulfing" }
  ];

  const availableConditions = [
    { label: "Less Than (<)", value: "LESS_THAN" },
    { label: "Greater Than (&gt;)", value: "GREATER_THAN" },
    { label: "Equal (=)", value: "EQUAL" },
    { label: "Crosses Above", value: "CROSSES_ABOVE" },
    { label: "Crosses Below", value: "CROSSES_BELOW" }
  ];

  const handleAddBuyRule = () => {
    setBuyRules([...buyRules, { indicator: "Close", condition: "LESS_THAN", value: "SMA50" }]);
  };

  const handleRemoveBuyRule = (idx: number) => {
    setBuyRules(buyRules.filter((_, i) => i !== idx));
  };

  const handleAddSellRule = () => {
    setSellRules([...sellRules, { indicator: "Close", condition: "GREATER_THAN", value: "SMA50" }]);
  };

  const handleRemoveSellRule = (idx: number) => {
    setSellRules(sellRules.filter((_, i) => i !== idx));
  };

  const handleUpdateBuyRule = (idx: number, key: keyof Rule, val: string) => {
    const updated = [...buyRules];
    updated[idx][key] = val;
    setBuyRules(updated);
  };

  const handleUpdateSellRule = (idx: number, key: keyof Rule, val: string) => {
    const updated = [...sellRules];
    updated[idx][key] = val;
    setSellRules(updated);
  };

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload = {
      symbol: symbol.toUpperCase(),
      start_date: startDate,
      end_date: endDate,
      initial_capital: parseFloat(capital),
      buy_rules: buyRules,
      sell_rules: sellRules
    };

    try {
      const data = await api.backtest.run(payload);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Backtest calculation failed. Check date ranges or indicators.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    const payload = {
      symbol: symbol.toUpperCase(),
      start_date: startDate,
      end_date: endDate,
      initial_capital: parseFloat(capital),
      buy_rules: buyRules,
      sell_rules: sellRules
    };
    try {
      await api.backtest.exportCsv(payload);
    } catch (err: any) {
      console.error(err);
      setError("Failed to download CSV export.");
    } finally {
      setExportLoading(false);
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
              <BarChart3 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">Strategy Backtester</h1>
              <p className="text-xs text-gray-400 mt-1">Build indicator, price action, and volume strategy triggers and simulate backtests over historical series.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Panel: Strategy Rule Configurator */}
          <form onSubmit={handleRunBacktest} className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-6 text-xs lg:col-span-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border-dark pb-4 flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-emerald-400" /> Strategy Configuration
            </h3>

            {/* General parameters */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Initial Capital ($)</label>
                <input
                  type="number"
                  required
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Buy Rules Builder */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Buy Rules (All must match)</span>
                <button
                  type="button"
                  onClick={handleAddBuyRule}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {buyRules.map((rule, idx) => (
                  <div key={idx} className="bg-bg-dark/40 border border-border-dark p-3 rounded-xl space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveBuyRule(idx)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Indicator</label>
                      <select
                        value={rule.indicator}
                        onChange={(e) => handleUpdateBuyRule(idx, "indicator", e.target.value)}
                        className="w-full bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white cursor-pointer"
                      >
                        {availableIndicators.map((ind) => (
                          <option key={ind.value} value={ind.value}>{ind.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Condition</label>
                        <select
                          value={rule.condition}
                          onChange={(e) => handleUpdateBuyRule(idx, "condition", e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white cursor-pointer"
                        >
                          {availableConditions.map((cond) => (
                            <option key={cond.value} value={cond.value}>{cond.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Value (float or col)</label>
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => handleUpdateBuyRule(idx, "value", e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sell Rules Builder */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sell Rules (Exit conditions)</span>
                <button
                  type="button"
                  onClick={handleAddSellRule}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {sellRules.map((rule, idx) => (
                  <div key={idx} className="bg-bg-dark/40 border border-border-dark p-3 rounded-xl space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveSellRule(idx)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Indicator</label>
                      <select
                        value={rule.indicator}
                        onChange={(e) => handleUpdateSellRule(idx, "indicator", e.target.value)}
                        className="w-full bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white cursor-pointer"
                      >
                        {availableIndicators.map((ind) => (
                          <option key={ind.value} value={ind.value}>{ind.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Condition</label>
                        <select
                          value={rule.condition}
                          onChange={(e) => handleUpdateSellRule(idx, "condition", e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white cursor-pointer"
                        >
                          {availableConditions.map((cond) => (
                            <option key={cond.value} value={cond.value}>{cond.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Value (float or col)</label>
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => handleUpdateSellRule(idx, "value", e.target.value)}
                          className="w-full bg-card-dark border border-border-dark rounded-lg px-2.5 py-1 text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold py-3 rounded-2xl text-xs flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Historical Backtest
            </button>
          </form>

          {/* Right Panel: Backtest Metrics Dashboard & Equity Curve */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="bg-card-dark border border-border-dark rounded-3xl py-24 text-center flex flex-col justify-center items-center gap-3">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-xs text-gray-500">Executing daily chronological strategy loop...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Win Rate", value: `${result.win_rate.toFixed(1)}%`, highlight: result.win_rate >= 50 },
                    { label: "Max Drawdown", value: `-${result.max_drawdown.toFixed(1)}%`, highlight: result.max_drawdown <= 15 },
                    { label: "CAGR", value: `${result.cagr >= 0 ? "+" : ""}${result.cagr.toFixed(1)}%`, highlight: result.cagr >= 0 },
                    { label: "Sharpe Ratio", value: result.sharpe_ratio.toFixed(2), highlight: result.sharpe_ratio >= 1.0 },
                    { label: "Sortino Ratio", value: result.sortino_ratio.toFixed(2), highlight: result.sortino_ratio >= 1.0 },
                    { label: "Profit Factor", value: result.profit_factor.toFixed(2), highlight: result.profit_factor >= 1.5 },
                    { label: "Total Trades", value: result.trades_history.length.toString(), highlight: true }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col justify-between gap-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</span>
                      <span className={`text-base font-black ${card.highlight ? "text-emerald-400" : "text-red-400"}`}>
                        {card.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Equity Curve line Chart */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Equity Curve Progression
                    </span>
                    <button
                      onClick={handleExportCsv}
                      disabled={exportLoading}
                      className="bg-bg-dark hover:bg-border-dark text-gray-300 hover:text-white px-4 py-2 rounded-xl text-[10px] font-semibold border border-border-dark flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Export CSV Report
                    </button>
                  </div>

                  {result.equity_curve?.length > 0 && (
                    <div className="w-full h-60 flex flex-col justify-end relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                      </div>

                      <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path
                          d={`M 0 100 ${result.equity_curve.map((e: any, i: number) => {
                            const minVal = Math.min(...result.equity_curve.map((v: any) => v.value));
                            const maxVal = Math.max(...result.equity_curve.map((v: any) => v.value));
                            const range = maxVal - minVal || 1.0;
                            const y = 90 - ((e.value - minVal) / range) * 80;
                            const x = (i / (result.equity_curve.length - 1)) * 400;
                            return `L ${x} ${y}`;
                          }).join(" ")} L 400 100 Z`}
                          fill="url(#eqGradient)"
                        />
                        {/* Line */}
                        <path
                          d={result.equity_curve.map((e: any, i: number) => {
                            const minVal = Math.min(...result.equity_curve.map((v: any) => v.value));
                            const maxVal = Math.max(...result.equity_curve.map((v: any) => v.value));
                            const range = maxVal - minVal || 1.0;
                            const y = 90 - ((e.value - minVal) / range) * 80;
                            const x = (i / (result.equity_curve.length - 1)) * 400;
                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="flex justify-between text-[8px] text-gray-500 uppercase tracking-widest mt-4">
                        <span>{result.equity_curve[0].time}</span>
                        <span>Mid-Backtest Range</span>
                        <span>{result.equity_curve[result.equity_curve.length - 1].time}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Backtest summary note */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-gray-300">
                  <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <span>{result.summary}</span>
                </div>

                {/* Trade Logs List */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-4">
                    Strategy Backtest Trades History
                  </span>

                  {result.trades_history?.length > 0 ? (
                    <div className="overflow-x-auto text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-gray-500 border-b border-border-dark/50">
                            <th className="pb-3 font-semibold">Asset</th>
                            <th className="pb-3 font-semibold">Entry Date</th>
                            <th className="pb-3 font-semibold">Exit Date</th>
                            <th className="pb-3 font-semibold text-right">Entry Price</th>
                            <th className="pb-3 font-semibold text-right">Exit Price</th>
                            <th className="pb-3 font-semibold text-right">Net PnL</th>
                            <th className="pb-3 font-semibold text-right">Return (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark/30">
                          {result.trades_history.map((t: any, idx: number) => {
                            const isWin = t.pnl > 0;
                            return (
                              <tr key={idx} className="hover:bg-bg-dark/10">
                                <td className="py-3.5 font-bold text-white">{t.symbol}</td>
                                <td className="py-3.5 text-gray-400">{t.entry_date}</td>
                                <td className="py-3.5 text-gray-400">{t.exit_date}</td>
                                <td className="py-3.5 text-right font-medium text-white">{t.entry_price.toFixed(2)}</td>
                                <td className="py-3.5 text-right font-medium text-white">{t.exit_price.toFixed(2)}</td>
                                <td className={`py-3.5 text-right font-bold ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                                  {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                                </td>
                                <td className={`py-3.5 text-right font-bold ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                                  {t.pnl_percent >= 0 ? "+" : ""}{t.pnl_percent.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      <p className="text-xs font-semibold text-gray-400">No trades taken</p>
                      <p className="text-[10px] text-gray-600 mt-1">Adjust buy/sell triggers to initiate mock historical transactions.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-card-dark border border-border-dark rounded-3xl py-32 text-center text-gray-500 flex flex-col justify-center items-center">
                <BarChart3 className="w-12 h-12 text-gray-700 mb-3" />
                <p className="text-xs font-semibold text-gray-400">Strategy Backtester Dashboard</p>
                <p className="text-[10px] text-gray-600 max-w-xs mx-auto mt-1">
                  Configure strategy entries/exits on the left panel and click run to analyze performance returns, Sharp ratios, and trade logs.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
