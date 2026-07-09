import React, { useState, useRef } from "react";
import { api } from "../services/api";
import { UploadCloud, Loader2, Cpu, CheckCircle, AlertTriangle, ShieldAlert, Sparkles, BookOpen } from "lucide-react";

export default function ScreenshotAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "factors" | "education">("summary");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, JPEG).");
      return;
    }
    setFile(selectedFile);
    setError("");
    setResult(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.stocks.analyzeScreenshot(file);
      setResult(data);
      setActiveTab("summary");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze screenshot. Ensure backend container is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
  };

  return (
    <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-4 border-b border-border-dark pb-4">
        <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-2xl">
          <Cpu className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">AI Price Action screenshot Analyzer</h2>
          <p className="text-xs text-gray-500">Upload charts screenshots to detect patterns, breakouts, and market structures using AI</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload Box and Image Preview */}
        <div className="space-y-6">
          {!preview ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerSelect}
              className="border-2 border-dashed border-border-dark hover:border-purple-500/50 rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 bg-bg-dark/20 hover:bg-purple-500/5 flex flex-col items-center justify-center min-h-[300px] group"
            >
              <UploadCloud className="w-12 h-12 text-gray-500 group-hover:text-purple-400 transition-colors duration-300 mb-4 animate-pulse" />
              <span className="block text-sm font-semibold text-white mb-1">Drag & drop your chart screenshot</span>
              <span className="block text-xs text-gray-500">Supports PNG, JPG, JPEG (max 10MB)</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-border-dark rounded-3xl p-4 bg-bg-dark/40 space-y-4">
              <div className="relative rounded-2xl overflow-hidden max-h-[350px] flex items-center justify-center bg-black">
                <img src={preview} alt="Chart Preview" className="object-contain max-h-[350px] w-full" />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-800 text-white text-xs font-semibold py-3 rounded-2xl flex justify-center items-center gap-2 transition-colors duration-300 cursor-pointer shadow-lg shadow-purple-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Chart...
                    </>
                  ) : (
                    "Run AI Analysis"
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="bg-border-dark text-gray-300 hover:text-white text-xs font-semibold px-6 py-3 rounded-2xl transition-colors duration-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis Outcomes */}
        <div className="flex flex-col">
          {loading ? (
            <div className="flex-1 border border-border-dark rounded-3xl p-8 bg-bg-dark/20 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Extracting visual characteristics...</p>
                <p className="text-xs text-gray-500">Analyzing candle bodies, swing wicks, zones and breakout structure...</p>
              </div>
            </div>
          ) : result ? (
            <div className="flex-1 border border-border-dark rounded-3xl p-6 bg-bg-dark/10 flex flex-col justify-between min-h-[300px]">
              <div>
                {/* Header with Confidence score */}
                <div className="flex justify-between items-center border-b border-border-dark/50 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Analysis Result</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase">Confidence</span>
                    <span className="text-sm font-bold text-white bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                      {result.confidence_score}%
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-dark/50 gap-4 mb-5 text-xs font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`pb-2 border-b-2 cursor-pointer transition-all duration-300 ${
                      activeTab === "summary" ? "border-purple-400 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    AI Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("factors")}
                    className={`pb-2 border-b-2 cursor-pointer transition-all duration-300 ${
                      activeTab === "factors" ? "border-purple-400 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Factors
                  </button>
                  <button
                    onClick={() => setActiveTab("education")}
                    className={`pb-2 border-b-2 cursor-pointer transition-all duration-300 ${
                      activeTab === "education" ? "border-purple-400 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Education
                  </button>
                </div>

                {/* Tab Contents */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                      {result.summary}
                    </p>
                    
                    <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 flex items-start gap-3">
                      <Cpu className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-purple-400 font-bold uppercase block tracking-wider">AI Sentiment Interpretation</span>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          This screenshot showcases pattern alignments forming a {result.confidence_score >= 70 ? "strong" : "moderate"} directional signal. Check the "Factors" tab for specific triggers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "factors" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Bullish Factors
                      </span>
                      <ul className="space-y-2">
                        {result.bullish_factors.map((f: string, idx: number) => (
                          <li key={idx} className="text-[11px] text-gray-300 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Bearish Factors
                      </span>
                      <ul className="space-y-2">
                        {result.bearish_factors.map((f: string, idx: number) => (
                          <li key={idx} className="text-[11px] text-gray-300 bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl">
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "education" && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Pattern Reference Guide
                    </span>
                    <div className="prose prose-invert max-w-none text-[11px] text-gray-400 leading-relaxed whitespace-pre-line bg-bg-dark/30 border border-border-dark p-4 rounded-2xl max-h-[220px] overflow-y-auto">
                      {result.educational_explanation}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border-dark/50 pt-4 mt-6 text-[10px] text-gray-500 leading-relaxed">
                **Disclaimer**: This analysis is for educational purposes only. It is generated through automated pattern recognizers and AI models, and does not represent financial advice.
              </div>
            </div>
          ) : (
            <div className="flex-1 border border-border-dark rounded-3xl p-8 bg-bg-dark/20 flex flex-col items-center justify-center text-center text-gray-500 min-h-[300px]">
              <UploadCloud className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-xs font-semibold text-gray-400 mb-0.5">No screenshot uploaded</p>
              <p className="text-[10px] max-w-xs leading-relaxed text-gray-500">
                Drag a chart image or select a local file to populate visual structural breakouts, demand cushions, and candle wicks analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
