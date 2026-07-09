import { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string;
}

export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous widget
    containerRef.current.innerHTML = "";

    // Create the container element for TradingView
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "tradingview_chart_container";
    widgetContainer.className = "w-full h-full rounded-2xl overflow-hidden";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Map Yahoo Finance symbol format to TradingView exchange:ticker format.
    // e.g. RELIANCE.NS -> NSE:RELIANCE
    // e.g. TCS.BO -> BSE:TCS
    // e.g. AAPL -> NASDAQ:AAPL
    let tvSymbol = symbol.toUpperCase();
    if (tvSymbol.endsWith(".NS")) {
      tvSymbol = `NSE:${tvSymbol.slice(0, -3)}`;
    } else if (tvSymbol.endsWith(".BO")) {
      tvSymbol = `BSE:${tvSymbol.slice(0, -3)}`;
    } else {
      tvSymbol = symbol.toUpperCase();
    }

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: "tradingview_chart_container",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="bg-card-dark border border-border-dark rounded-3xl p-5 h-[550px] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-400">TradingView Advanced Chart</h3>
        <span className="text-[10px] text-gray-500 font-medium">Interactive annotations & drawing tools enabled</span>
      </div>
      <div ref={containerRef} className="flex-1 w-full rounded-2xl overflow-hidden" />
    </div>
  );
}
