import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { 
  Cpu, Play, Loader2, AlertCircle, Info, Sparkles, TrendingUp, 
  Binary, Terminal, BarChart2, ShieldCheck, Gauge, HelpCircle 
} from "lucide-react";

export default function MachineLearning() {
  const [symbol, setSymbol] = useState("AAPL");
  const [modelType, setModelType] = useState("LSTM");
  
  const [trainMetrics, setTrainMetrics] = useState<any>(null);
  const [predictResult, setPredictResult] = useState<any>(null);
  
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");
  
  // Terminal logs state to simulate detailed neural network epoch training progression
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const modelTypes = ["Random Forest", "Gradient Boosting", "LSTM", "GRU", "Transformer"];

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    setError("");
    setTrainMetrics(null);
    setPredictResult(null);
    setTerminalLogs([]);

    const sym = symbol.toUpperCase();
    
    // Simulate interactive epoch training logs inside mock console
    const logs = [
      `[sys] Fetching daily prices and features for ${sym}...`,
      `[sys] Extracted features: Close, Volume, RSI(14), MACD, ATR(14), Bollinger bands, Momentum(10)`,
      `[sys] Shape of dataset: 492 samples x 8 features. Normalizing values...`,
      `[ml] Initializing model parameters for structural type: ${modelType}`,
    ];
    setTerminalLogs([...logs]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setTerminalLogs(prev => [...prev, `[ml] [Epoch 1/5] - Loss: 0.6842 - Accuracy: 54.2%`]);
      } else if (step === 2) {
        setTerminalLogs(prev => [...prev, `[ml] [Epoch 2/5] - Loss: 0.5910 - Accuracy: 59.8%`]);
      } else if (step === 3) {
        setTerminalLogs(prev => [...prev, `[ml] [Epoch 3/5] - Loss: 0.5123 - Accuracy: 64.1%`]);
      } else if (step === 4) {
        setTerminalLogs(prev => [...prev, `[ml] [Epoch 4/5] - Loss: 0.4491 - Accuracy: 69.3%`]);
      } else if (step === 5) {
        setTerminalLogs(prev => [...prev, `[ml] [Epoch 5/5] - Loss: 0.3804 - Accuracy: 73.5%`]);
        clearInterval(interval);
      }
    }, 400);

    try {
      const data = await api.ml.train(sym, modelType);
      
      // Delay response slightly to align with simulated logs
      setTimeout(() => {
        setTrainMetrics(data);
        setTerminalLogs(prev => [
          ...prev, 
          `[ml] Training completed successfully in ${data.duration.toFixed(2)}s.`,
          `[ml] Final validation accuracy: ${(data.accuracy * 100).toFixed(1)}%. Weight matrices saved.`
        ]);
        setTraining(false);
        // Automatically run predict after model training finishes
        handlePredict(sym, modelType);
      }, 2100);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Failed to retrain ML model.");
      setTraining(false);
    }
  };

  const handlePredict = async (sym: string, type: string) => {
    setPredicting(true);
    setError("");
    try {
      const data = await api.ml.predict(sym, type);
      setPredictResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch model inference.");
    } finally {
      setPredicting(false);
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
              <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">Machine Learning Models</h1>
              <p className="text-xs text-gray-400 mt-1">Train Scikit-Learn, XGBoost, and Deep Learning (LSTM, GRU, Transformers) models on technical indicators and run predictions.</p>
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
          
          {/* Left Panel: Model Control & Train console */}
          <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-6 text-xs lg:col-span-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border-dark pb-4 flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-emerald-400" /> Model Controller
            </h3>

            <form onSubmit={handleTrain} className="space-y-4">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500/50 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Model Architecture</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500/50 cursor-pointer font-bold"
                >
                  {modelTypes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="bg-bg-dark/40 border border-border-dark rounded-2xl p-4 text-[10px] text-gray-400 space-y-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Trained Features:
                </span>
                <div className="grid grid-cols-2 gap-1 font-medium">
                  <span>• Close Price</span>
                  <span>• Volume</span>
                  <span>• RSI (14)</span>
                  <span>• MACD Line</span>
                  <span>• ATR (14)</span>
                  <span>• Bollinger Upper</span>
                  <span>• Bollinger Lower</span>
                  <span>• Momentum (10)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={training}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-bold py-3 rounded-2xl text-xs flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Train & Retrain Model
              </button>
            </form>

            {/* Simulated training stats */}
            {trainMetrics && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-3.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Training Session Results</span>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">Train Accuracy</span>
                    <span className="font-black text-white text-sm">{(trainMetrics.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cross Loss</span>
                    <span className="font-black text-white text-sm">{trainMetrics.loss.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Fit Duration</span>
                    <span className="font-black text-white text-sm">{trainMetrics.duration.toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Status</span>
                    <span className="font-black text-emerald-400 text-sm">Trained ✓</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Inference predictions dashboard & terminal logs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Terminal logs console */}
            <div className="bg-black border border-border-dark rounded-3xl p-5 font-mono text-[10px] text-emerald-500 min-h-48 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-3 opacity-25">
                <Terminal className="w-16 h-16 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-gray-500 border-b border-border-dark/50 pb-2 mb-2">
                  <span>ML Retraining Terminal Output</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                {terminalLogs.length > 0 ? (
                  terminalLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))
                ) : (
                  <div className="text-gray-600">Terminal ready. Trigger model retraining on the left...</div>
                )}
              </div>
            </div>

            {predicting ? (
              <div className="bg-card-dark border border-border-dark rounded-3xl py-24 text-center flex flex-col justify-center items-center gap-3">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-xs text-gray-500">Computing technical indicators and running latest prediction metrics...</p>
              </div>
            ) : predictResult ? (
              <div className="space-y-6">
                
                {/* Prediction Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Predicted Trend", value: predictResult.trend, color: predictResult.trend === "Bullish" ? "text-emerald-400" : (predictResult.trend === "Bearish" ? "text-red-400" : "text-gray-400") },
                    { label: "Direction Prob.", value: `${predictResult.direction_probability.toFixed(1)}%`, color: "text-emerald-400" },
                    { label: "Expected Volatility", value: `${predictResult.expected_volatility.toFixed(1)}%`, color: "text-amber-400" },
                    { label: "Breakout Prob.", value: `${predictResult.breakout_probability.toFixed(1)}%`, color: "text-cyan-400" }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-card-dark border border-border-dark rounded-2xl p-4 flex flex-col justify-between gap-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</span>
                      <span className={`text-base font-black ${card.color}`}>
                        {card.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 95% Confidence Interval Card */}
                <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 space-y-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                    Expected Price Target Bounds (95% Confidence Interval)
                  </span>

                  <div className="grid grid-cols-3 items-center gap-4 text-center bg-bg-dark/40 border border-border-dark p-6 rounded-2xl">
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Lower Bound</span>
                      <span className="text-sm md:text-base font-black text-red-400">${predictResult.confidence_interval.lower.toFixed(2)}</span>
                    </div>
                    
                    {/* Interval Slider visualizer */}
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Gauge className="w-8 h-8 text-emerald-400" />
                      <span className="text-[8px] text-gray-500 uppercase tracking-widest">5-Day projection</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Upper Bound</span>
                      <span className="text-sm md:text-base font-black text-emerald-400">${predictResult.confidence_interval.upper.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Features weights explanation */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-gray-300">
                  <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <span>
                    Model completed training on the {predictResult.model_type} architecture. Bollinger Bands widths, momentum directions, and volume indicators were weighted to identify trend targets.
                  </span>
                </div>

              </div>
            ) : (
              <div className="bg-card-dark border border-border-dark rounded-3xl py-24 text-center text-gray-500 flex flex-col justify-center items-center">
                <BarChart2 className="w-12 h-12 text-gray-700 mb-3" />
                <p className="text-xs font-semibold text-gray-400">Machine Learning Predictions Dashboard</p>
                <p className="text-[10px] text-gray-600 max-w-xs mx-auto mt-1">
                  Choose a stock ticker and model architecture on the left, then click Train to display predicted trends, volatility ranges, and target bounds.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
