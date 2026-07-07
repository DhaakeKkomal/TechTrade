import React from "react";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import WatchlistManager from "../components/WatchlistManager";
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

        {/* Watchlist Section */}
        <div>
          <WatchlistManager />
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
