import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Layers, ShieldCheck } from "lucide-react";

interface IndicatorsSummaryProps {
  analysis: any;
}

export default function IndicatorsSummary({ analysis }: IndicatorsSummaryProps) {
  if (!analysis || analysis.error) {
    return (
      <div className="bg-card-dark border border-border-dark rounded-3xl p-6 text-center text-sm text-gray-500">
        No indicators analysis available.
      </div>
    );
  }

  const { rsi, macd, trend, confidence, support_resistance, volume_analysis } = analysis;

  const rsiBadgeColor =
    rsi.status === "Overbought"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : rsi.status === "Oversold"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : "bg-border-dark text-gray-400 border-transparent";

  const isTrendBullish = trend.direction.includes("Bullish");
  const isTrendBearish = trend.direction.includes("Bearish");
  const trendColor = isTrendBullish
    ? "text-emerald-400"
    : isTrendBearish
    ? "text-red-400"
    : "text-gray-400";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Trend & Volume Analysis Card */}
      <div className="bg-card-dark border border-border-dark rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Market Structure
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Primary Trend</span>
              <span className={`text-xl font-bold ${trendColor} flex items-center gap-1.5`}>
                {isTrendBullish && <ArrowUpRight className="w-5 h-5" />}
                {isTrendBearish && <ArrowDownRight className="w-5 h-5" />}
                {trend.direction}
              </span>
            </div>

            <div className="h-[1px] bg-border-dark/50" />

            <div>
              <span className="text-xs text-gray-500 block mb-1.5">Volume Profile</span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                    volume_analysis.status === "Volume Spike"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                      : "bg-border-dark text-gray-400 border-transparent"
                  }`}
                >
                  {volume_analysis.status}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                    volume_analysis.signal.includes("Accumulation")
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : volume_analysis.signal.includes("Distribution")
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-border-dark text-gray-500 border-transparent"
                  }`}
                >
                  {volume_analysis.signal}
                </span>
              </div>
              <span className="block text-[10px] text-gray-500 mt-2 font-medium">
                Volume Ratio: {volume_analysis.volume_ratio.toFixed(2)}x vs 20d Avg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Momentum Oscillators Card */}
      <div className="bg-card-dark border border-border-dark rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Momentum Oscillators
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1">RSI (14)</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{rsi.value.toFixed(2)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${rsiBadgeColor}`}>
                  {rsi.status}
                </span>
              </div>
            </div>

            <div className="h-[1px] bg-border-dark/50" />

            <div>
              <span className="text-xs text-gray-500 block mb-1">MACD Crossover</span>
              <span className="text-sm font-bold text-white block mb-0.5">
                {macd.macd.toFixed(4)} / {macd.signal.toFixed(4)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 border rounded-full inline-block ${
                  macd.signal_type.includes("Bullish")
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : macd.signal_type.includes("Bearish")
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-border-dark text-gray-500 border-transparent"
                }`}
              >
                {macd.signal_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Support & Resistance Levels Card */}
      <div className="bg-card-dark border border-border-dark rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Support & Resistance
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-red-400 font-semibold block mb-2">Resistance Levels (Supply)</span>
              <div className="flex flex-wrap gap-2">
                {support_resistance.resistances.length > 0 ? (
                  support_resistance.resistances.map((lvl: number, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold text-red-400 bg-red-500/5 border border-red-500/20 px-2.5 py-1 rounded-xl"
                    >
                      {lvl}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-600">None detected</span>
                )}
              </div>
            </div>

            <div className="h-[1px] bg-border-dark/50" />

            <div>
              <span className="text-xs text-emerald-400 font-semibold block mb-2">Support Levels (Demand)</span>
              <div className="flex flex-wrap gap-2">
                {support_resistance.supports.length > 0 ? (
                  support_resistance.supports.map((lvl: number, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 rounded-xl"
                    >
                      {lvl}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-600">None detected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Strength & Confidence Card */}
      <div className="bg-card-dark border border-border-dark rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            AI Trend & Confidence
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Signal Confidence</span>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base font-bold text-white">{confidence?.score ? confidence.score.toFixed(0) : "50"}%</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-full ${
                    confidence?.rating === "Strong"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : confidence?.rating === "High"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : confidence?.rating === "Medium"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {confidence?.rating || "Medium"}
                </span>
              </div>
              <div className="w-full bg-bg-dark border border-border-dark h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (confidence?.score || 50) >= 80
                      ? "bg-purple-500"
                      : (confidence?.score || 50) >= 65
                      ? "bg-emerald-500"
                      : (confidence?.score || 50) >= 45
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${confidence?.score || 50}%` }}
                />
              </div>
            </div>

            <div className="h-[1px] bg-border-dark/50" />

            <div>
              <span className="text-xs text-gray-500 block mb-1">Trend Strength (ADX)</span>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base font-bold text-white">{trend.adx ? trend.adx.toFixed(1) : "N/A"}</span>
                <span className="text-[9px] text-gray-400 font-semibold">
                  {trend.strength || "N/A"}
                </span>
              </div>
              <div className="w-full bg-bg-dark border border-border-dark h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (trend.adx || 0) * 2.0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
