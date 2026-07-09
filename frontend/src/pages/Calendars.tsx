import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { Calendar, Globe, Briefcase, Loader2, AlertTriangle, Sparkles } from "lucide-react";

interface EconomicEvent {
  date: string;
  time: string;
  event: string;
  forecast: string;
  previous: string;
  impact: string;
}

interface IpoEvent {
  date: string;
  symbol: string;
  company: string;
  price_range: string;
  shares: string;
  status: string;
}

export default function Calendars() {
  const [economic, setEconomic] = useState<EconomicEvent[]>([]);
  const [ipo, setIpo] = useState<IpoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      const data = await api.enterprise.getCalendars();
      setEconomic(data.economic || []);
      setIpo(data.ipo || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile economic calendar dates.");
    } finally {
      setLoading(false);
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "HIGH":
        return <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-[9px] font-bold">HIGH</span>;
      case "MEDIUM":
        return <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[9px] font-bold">MEDIUM</span>;
      default:
        return <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">LOW</span>;
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 space-y-8 text-xs">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-card-dark to-card-dark/40 border border-border-dark p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <h1 className="text-xl font-black text-white m-0 tracking-tight flex items-center gap-2">
              Macro & Listings Calendars
              <Calendar className="w-5 h-5 text-emerald-400" />
            </h1>
            <p className="text-[10px] text-gray-500 mt-1">
              Track global economic indicator releases (inflation, jobs data) and new IPO offerings pipeline schedules.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500 flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="font-semibold">Retrieving global calendars pipeline...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Economic Calendar */}
            <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-dark pb-3">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest m-0">Economic Indicators Calendar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-border-dark/30">
                      <th className="pb-2">Date / Time</th>
                      <th className="pb-2">Macroeconomic Event</th>
                      <th className="pb-2">Forecast</th>
                      <th className="pb-2">Previous</th>
                      <th className="pb-2 text-right">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/20 text-gray-300">
                    {economic.map((e, idx) => (
                      <tr key={idx} className="hover:bg-bg-dark/10">
                        <td className="py-3">
                          <span className="block font-semibold text-white">{e.date}</span>
                          <span className="block text-[9px] text-gray-500">{e.time}</span>
                        </td>
                        <td className="py-3 font-semibold text-gray-200">{e.event}</td>
                        <td className="py-3 font-mono">{e.forecast}</td>
                        <td className="py-3 font-mono">{e.previous}</td>
                        <td className="py-3 text-right">{getImpactBadge(e.impact)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IPO Calendar */}
            <div className="bg-card-dark border border-border-dark rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-dark pb-3">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest m-0">IPO Pipeline Calendar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-border-dark/30">
                      <th className="pb-2">Offer Date</th>
                      <th className="pb-2">Ticker / Company</th>
                      <th className="pb-2">Price Range</th>
                      <th className="pb-2">Shares Volume</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/20 text-gray-300">
                    {ipo.map((i, idx) => (
                      <tr key={idx} className="hover:bg-bg-dark/10">
                        <td className="py-3 font-semibold text-white">{i.date}</td>
                        <td className="py-3">
                          <span className="block font-bold text-emerald-400">{i.symbol}</span>
                          <span className="block text-[9px] text-gray-500 truncate max-w-[150px]">{i.company}</span>
                        </td>
                        <td className="py-3 font-mono">{i.price_range}</td>
                        <td className="py-3 font-mono">{i.shares}</td>
                        <td className="py-3 text-right">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">
                            {i.status}
                          </span>
                        </td>
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
