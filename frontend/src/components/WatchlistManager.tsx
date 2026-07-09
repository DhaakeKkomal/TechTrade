import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Plus, Trash2, Star, Folder } from "lucide-react";

export default function WatchlistManager() {
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(false);
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, any>>({});

  const fetchWatchlists = async () => {
    setLoading(true);
    try {
      const data = await api.watchlists.getWatchlists();
      setWatchlists(data);
      if (data.length > 0 && activeId === null) {
        setActiveId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load watchlists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const activeWatchlist = watchlists.find((w) => w.id === activeId);

  // Fetch prices for active watchlist items to make the list look live and premium
  useEffect(() => {
    if (!activeWatchlist || activeWatchlist.items.length === 0) {
      return;
    }

    const fetchPrices = async () => {
      const prices: Record<string, any> = {};
      for (const item of activeWatchlist.items) {
        try {
          const info = await api.stocks.getInfo(item.symbol);
          prices[item.symbol] = {
            price: info.currentPrice,
            currency: info.currency
          };
        } catch {
          // Silent catch
        }
      }
      setWatchlistPrices(prices);
    };

    fetchPrices();
  }, [activeId, watchlists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const newList = await api.watchlists.createWatchlist(newListName.trim());
      setWatchlists([...watchlists, newList]);
      setActiveId(newList.id);
      setNewListName("");
    } catch (err) {
      console.error("Failed to create watchlist:", err);
    }
  };

  const handleDeleteList = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this watchlist?")) return;

    try {
      await api.watchlists.deleteWatchlist(id);
      const remaining = watchlists.filter((w) => w.id !== id);
      setWatchlists(remaining);
      if (activeId === id) {
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error("Failed to delete watchlist:", err);
    }
  };

  const handleRemoveItem = async (watchlistId: number, symbol: string) => {
    try {
      await api.watchlists.removeItem(watchlistId, symbol);
      // Update local state
      setWatchlists(
        watchlists.map((w) => {
          if (w.id === watchlistId) {
            return {
              ...w,
              items: w.items.filter((item: any) => item.symbol !== symbol),
            };
          }
          return w;
        })
      );
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[400px]">
      {/* Sidebar - Watchlists List */}
      <div className="lg:col-span-1 bg-card-dark border border-border-dark rounded-3xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-4 h-4 text-emerald-400" />
              Watchlists
            </h3>
          </div>

          <form onSubmit={handleCreateList} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="New watchlist..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="flex-1 bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none transition-all duration-300"
            />
            <button
              type="submit"
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {loading && watchlists.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400" />
            </div>
          ) : (
            <ul className="space-y-1">
              {watchlists.map((wl) => (
                <li key={wl.id} className="group flex items-center justify-between">
                  <button
                    onClick={() => setActiveId(wl.id)}
                    className={`flex-1 text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
                      activeId === wl.id
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "text-gray-400 hover:bg-border-dark/50 hover:text-white border border-transparent"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${activeId === wl.id ? "fill-emerald-400" : ""}`} />
                    {wl.name}
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-bg-dark text-gray-500">
                      {wl.items.length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteList(wl.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1.5 ml-1.5 rounded-lg transition-all duration-300"
                    title="Delete watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Content - Active Watchlist Items */}
      <div className="lg:col-span-3 bg-card-dark border border-border-dark rounded-3xl p-6 flex flex-col justify-between">
        {activeWatchlist ? (
          <div>
            <div className="flex items-center justify-between border-b border-border-dark pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">{activeWatchlist.name}</h2>
                <p className="text-xs text-gray-500">Contains {activeWatchlist.items.length} tickers</p>
              </div>
            </div>

            {activeWatchlist.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Star className="w-8 h-8 text-gray-600 mb-3 animate-pulse" />
                <p className="text-sm text-gray-400 font-semibold mb-1">Watchlist is Empty</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  Search for stock symbols at the top and add them to this watchlist.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-border-dark/50">
                      <th className="pb-3 font-semibold">Symbol</th>
                      <th className="pb-3 font-semibold text-right">Last Price</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/50">
                    {activeWatchlist.items.map((item: any) => {
                      const itemPriceInfo = watchlistPrices[item.symbol];
                      return (
                        <tr key={item.id} className="group hover:bg-bg-dark/20 transition-all duration-200">
                          <td className="py-4">
                            <Link to={`/stocks/${item.symbol}`} className="font-bold text-emerald-400 hover:text-emerald-300">
                              {item.symbol}
                            </Link>
                          </td>
                          <td className="py-4 text-right font-medium text-white">
                            {itemPriceInfo ? (
                              <span>
                                {itemPriceInfo.price.toFixed(2)}{" "}
                                <span className="text-[10px] text-gray-500">{itemPriceInfo.currency}</span>
                              </span>
                            ) : (
                              <span className="text-gray-600">Loading...</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleRemoveItem(activeWatchlist.id, item.symbol)}
                              className="text-gray-500 hover:text-red-400 p-2 rounded-xl transition-all duration-300"
                              title="Remove from watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Folder className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400 font-semibold mb-1">No Active Watchlist</p>
            <p className="text-xs text-gray-500">Create a watchlist in the sidebar to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
