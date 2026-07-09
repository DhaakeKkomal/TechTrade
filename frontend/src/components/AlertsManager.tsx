import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { 
  Bell, BellOff, Trash2, Plus, Loader2, AlertTriangle, 
  Mail, MessageSquare, Monitor, Smartphone, Play, CheckCircle2 
} from "lucide-react";

interface AlertItem {
  id: number;
  symbol: string;
  alert_type: string;
  channel: string;
  condition: string;
  value: number;
  is_active: bool;
  triggered_at?: string;
  created_at: string;
}

export default function AlertsManager() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Alert Form State
  const [symbol, setSymbol] = useState("AAPL");
  const [alertType, setAlertType] = useState("RSI Levels");
  const [condition, setCondition] = useState("ABOVE");
  const [value, setValue] = useState("70");
  
  // Channels Selection checkboxes
  const [channels, setChannels] = useState({
    Email: true,
    Telegram: false,
    Browser: true,
    Push: false
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.alerts.list();
      setAlerts(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load alerts list.");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (key: keyof typeof channels) => {
    setChannels(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    const selectedChannels = Object.entries(channels)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)
      .join(", ");

    if (!selectedChannels) {
      setError("Please select at least one notification delivery channel.");
      setSubmitting(false);
      return;
    }

    const payload = {
      symbol: symbol.toUpperCase(),
      alert_type: alertType,
      condition,
      value: parseFloat(value),
      channel: selectedChannels
    };

    try {
      await api.alerts.create(payload);
      setSuccessMsg("Alert criteria configured successfully!");
      fetchAlerts();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create alert trigger.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setSuccessMsg("");
    try {
      await api.alerts.delete(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setSuccessMsg("Alert deleted successfully.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete alert.");
    }
  };

  const handleTriggerCheck = async () => {
    setChecking(true);
    setError("");
    setSuccessMsg("");
    
    // Extract unique active alert symbols to check
    const symbolsToCheck = Array.from(
      new Set(alerts.filter(a => a.is_active).map(a => a.symbol))
    );

    if (symbolsToCheck.length === 0) {
      setError("No active alerts configured to simulate checks.");
      setChecking(false);
      return;
    }

    try {
      let totalTriggered = 0;
      for (const sym of symbolsToCheck) {
        const res = await api.alerts.check(sym);
        totalTriggered += res.triggered_count;
      }
      
      setSuccessMsg(`Evaluation complete! Simulated pricing targets evaluated, ${totalTriggered} alerts triggered.`);
      fetchAlerts();
    } catch (err: any) {
      console.error(err);
      setError("Error executing triggers evaluation.");
    } finally {
      setChecking(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.is_active);
  const triggeredAlerts = alerts.filter(a => !a.is_active);

  const getChannelIcon = (name: string) => {
    switch (name.trim()) {
      case "Email": return <Mail className="w-3 h-3 text-emerald-400" />;
      case "Telegram": return <MessageSquare className="w-3 h-3 text-cyan-400" />;
      case "Browser": return <Monitor className="w-3 h-3 text-indigo-400" />;
      case "Push": return <Smartphone className="w-3 h-3 text-amber-400" />;
      default: return null;
    }
  };

  return (
    <div className="bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8 space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl">
            <Bell className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest m-0">Alerts Manager</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Configure live price, indicator crossovers, and volume spike alerts.</p>
          </div>
        </div>

        <button
          onClick={handleTriggerCheck}
          disabled={checking}
          className="bg-bg-dark border border-border-dark hover:bg-border-dark text-gray-300 hover:text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          Run Triggers Scan
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Form: Configure Alert */}
        <form onSubmit={handleCreateAlert} className="space-y-4 lg:col-span-1 bg-bg-dark/40 border border-border-dark p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-3">Add Trigger Target</span>
          
          <div>
            <label className="block text-gray-400 font-semibold mb-1">Stock Ticker</label>
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
              <label className="block text-gray-400 font-semibold mb-1">Alert Type</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50 cursor-pointer font-bold"
              >
                <option value="RSI Levels">RSI Levels</option>
                <option value="MACD Crossovers">MACD Cross</option>
                <option value="Volume Spikes">Volume Spike</option>
                <option value="Breakouts">Breakout</option>
                <option value="Support">Support Breached</option>
                <option value="Resistance">Resistance Broken</option>
                <option value="AI Confidence Threshold">AI Confidence</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="ABOVE">Above (&gt;)</option>
                <option value="BELOW">Below (&lt;)</option>
                <option value="CROSSES">Crosses</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Boundary Threshold Value</label>
            <input
              type="number"
              step="any"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 70, 2.0, 150.0"
              className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Channels checklist */}
          <div className="space-y-2">
            <label className="block text-gray-400 font-semibold">Delivery Channels</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(channels).map(([name, enabled]) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => handleChannelToggle(name as keyof typeof channels)}
                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl font-bold transition-all text-left cursor-pointer ${
                    enabled 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-bg-dark/40 border-border-dark text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {getChannelIcon(name)}
                  {name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1 transition-all cursor-pointer"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Save Alert Criteria
          </button>
        </form>

        {/* Right Active & Triggered Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Alerts */}
          <div className="bg-bg-dark/20 border border-border-dark p-5 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Active Custom Alerts ({activeAlerts.length})
            </span>

            {loading ? (
              <div className="py-6 text-center text-gray-500 flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading active configuration...</span>
              </div>
            ) : activeAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-border-dark/30">
                      <th className="pb-2">Asset</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Trigger Condition</th>
                      <th className="pb-2">Channels</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/20">
                    {activeAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-bg-dark/10">
                        <td className="py-2.5 font-bold text-white">{alert.symbol}</td>
                        <td className="py-2.5 text-gray-400">{alert.alert_type}</td>
                        <td className="py-2.5 font-bold text-emerald-400">
                          {alert.condition} {alert.value}
                        </td>
                        <td className="py-2.5">
                          <div className="flex gap-1.5 items-center">
                            {alert.channel.split(",").map(c => (
                              <div key={c} className="bg-bg-dark border border-border-dark p-1 rounded-lg" title={c.trim()}>
                                {getChannelIcon(c)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDelete(alert.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-600">
                <BellOff className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <span>No active alerts configured. Add one on the left.</span>
              </div>
            )}
          </div>

          {/* Triggered Alerts History */}
          <div className="bg-bg-dark/20 border border-border-dark p-5 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Recently Triggered Signals History
            </span>

            {triggeredAlerts.length > 0 ? (
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-border-dark/30">
                      <th className="pb-2">Asset</th>
                      <th className="pb-2">Triggered Details</th>
                      <th className="pb-2">Channels</th>
                      <th className="pb-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/20">
                    {triggeredAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-bg-dark/10 text-gray-400">
                        <td className="py-2.5 font-bold text-gray-300">{alert.symbol}</td>
                        <td className="py-2.5">
                          {alert.alert_type} reached {alert.value}
                        </td>
                        <td className="py-2.5">
                          <div className="flex gap-1.5 items-center">
                            {alert.channel.split(",").map(c => (
                              <div key={c} className="bg-bg-dark border border-border-dark p-1 rounded-lg" title={c.trim()}>
                                {getChannelIcon(c)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-[10px] text-gray-500">
                          {alert.triggered_at ? new Date(alert.triggered_at).toLocaleTimeString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-600 text-[10px]">
                <span>No triggered logs in history. Run Triggers Scan above to evaluate active alerts.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
