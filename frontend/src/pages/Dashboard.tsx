import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import WatchlistManager from "../components/WatchlistManager";
import ScreenshotAnalyzer from "../components/ScreenshotAnalyzer";
import { useAuthStore } from "../store/authStore";
import { Sparkles, Calendar, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-card-dark to-card-dark/40 border border-border-dark p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2">
              {getGreeting()}, {user?.full_name}!
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Explore live charts, compute technical indicators, and generate local AI summaries.
            </p>
          </div>
          <div className="bg-bg-dark border border-border-dark px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{getFormattedDate()}</span>
          </div>
        </div>

        {/* Search Section */}
        <div className="text-center py-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Search Market Tickers</h2>
          <SearchBar />
        </div>

        {/* Trending Stocks Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trending Market Tickers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
              { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ" },
              { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ" },
              { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE" },
              { symbol: "INFY.NS", name: "Infosys Limited", exchange: "NSE" },
              { symbol: "TCS.NS", name: "TCS Limited", exchange: "NSE" },
            ].map((stock) => (
              <Link
                key={stock.symbol}
                to={`/stocks/${stock.symbol}`}
                className="bg-card-dark border border-border-dark hover:border-emerald-500/30 p-4 rounded-2xl flex flex-col justify-between gap-3 hover:scale-102 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 group cursor-pointer"
              >
                <div>
                  <span className="block font-bold text-xs text-white group-hover:text-emerald-400 transition-colors duration-200">{stock.symbol}</span>
                  <span className="block text-[9px] text-gray-500 truncate mt-0.5">{stock.name}</span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-bold mt-2">
                  <span className="bg-bg-dark text-gray-400 border border-border-dark px-1.5 py-0.5 rounded">
                    {stock.exchange}
                  </span>
                  <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform duration-200">
                    Analyze &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Watchlist Section */}
        <div>
          <WatchlistManager />
        </div>

        {/* AI Screenshot Analyzer Section */}
        <div>
          <ScreenshotAnalyzer />
        </div>

        {/* Educational Disclaimer Footer */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex items-start gap-4">
          <BookOpen className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Educational Platform</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every AI-generated insight, price calculation, indicator summary, or trend signal on this platform is constructed for educational purposes only. This information should not be considered financial advice. Please perform your own diligence before executing actual trades.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
