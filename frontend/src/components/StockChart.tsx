import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";
import type { ISeriesApi } from "lightweight-charts";
import { calculateSMA, calculateEMA, calculateBollingerBands } from "../utils/chartHelpers";
import type { Candle } from "../utils/chartHelpers";

interface StockChartProps {
  data: Candle[];
  priceActionData?: any;
  patternsData?: any[];
}

export default function StockChart({ data, priceActionData, patternsData }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Overlay Toggles
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showPriceAction, setShowPriceAction] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const container = chartContainerRef.current;
    
    // Create Chart
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: "#121420" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1e293b/30" },
        horzLines: { color: "#1e293b/30" },
      },
      rightPriceScale: {
        borderColor: "#1f2235",
      },
      timeScale: {
        borderColor: "#1f2235",
      },
    });

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });
    candleSeries.setData(data as any);

    // Add Volume Series (sub-pane at bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#3b82f6",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume-pane", // create custom volume pane
    });
    
    chart.priceScale("volume-pane").applyOptions({
      scaleMargins: {
        top: 0.8, // volume is confined to bottom 20%
        bottom: 0,
      },
    });

    const volumeData = data.map((d) => ({
      time: d.time,
      value: d.volume || 0,
      color: d.close >= d.open ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
    }));
    volumeSeries.setData(volumeData as any);

    // Overlay references to update dynamically
    const overlaySeriesList: ISeriesApi<any>[] = [];

    // Render SMA Overlay
    if (showSMA) {
      const smaData = calculateSMA(data, 20);
      const smaLine = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        title: "SMA (20)",
      });
      smaLine.setData(smaData as any);
      overlaySeriesList.push(smaLine);
    }

    // Render EMA Overlay
    if (showEMA) {
      const emaData = calculateEMA(data, 20);
      const emaLine = chart.addSeries(LineSeries, {
        color: "#a855f7",
        lineWidth: 2,
        title: "EMA (20)",
      });
      emaLine.setData(emaData as any);
      overlaySeriesList.push(emaLine);
    }

    // Render Bollinger Bands Overlays
    if (showBB) {
      const bbData = calculateBollingerBands(data, 20, 2);
      
      const upperLine = chart.addSeries(LineSeries, {
        color: "rgba(59, 130, 246, 0.6)",
        lineWidth: 1,
        title: "BB Upper",
      });
      const middleLine = chart.addSeries(LineSeries, {
        color: "rgba(59, 130, 246, 0.3)",
        lineWidth: 1,
        title: "BB Middle",
      });
      const lowerLine = chart.addSeries(LineSeries, {
        color: "rgba(59, 130, 246, 0.6)",
        lineWidth: 1,
        title: "BB Lower",
      });

      upperLine.setData(bbData.upper as any);
      middleLine.setData(bbData.middle as any);
      lowerLine.setData(bbData.lower as any);

      overlaySeriesList.push(upperLine, middleLine, lowerLine);
    }

    // Render Price Action Markers and Zones
    const activePriceLines: any[] = [];
    if (showPriceAction && priceActionData) {
      const markersList: any[] = [];
      
      // Structure breaks
      if (priceActionData.structure_events) {
        priceActionData.structure_events.forEach((evt: any) => {
          const isBullish = evt.name.includes("Bullish");
          markersList.push({
            time: evt.time,
            position: isBullish ? "belowBar" : "aboveBar",
            color: isBullish ? "#10b981" : "#ef4444",
            shape: isBullish ? "arrowUp" : "arrowDown",
            text: evt.type,
          });
        });
      }

      // Candlestick patterns
      if (priceActionData.candlesticks) {
        priceActionData.candlesticks.forEach((candle: any) => {
          const name = candle.name.toLowerCase();
          const isBullish = name.includes("bullish") || name.includes("hammer") || name.includes("bottom");
          const isBearish = name.includes("bearish") || name.includes("star") || name.includes("top");
          
          markersList.push({
            time: candle.time,
            position: isBullish ? "belowBar" : (isBearish ? "aboveBar" : "inBar"),
            color: isBullish ? "#10b981" : (isBearish ? "#ef4444" : "#f59e0b"),
            shape: isBullish ? "arrowUp" : (isBearish ? "arrowDown" : "circle"),
            text: candle.name,
          });
        });
      }

      if (markersList.length > 0) {
        markersList.sort((a, b) => {
          const tA = typeof a.time === "number" ? a.time : new Date(a.time).getTime();
          const tB = typeof b.time === "number" ? b.time : new Date(b.time).getTime();
          return tA - tB;
        });
        candleSeries.setMarkers(markersList);
      }

      // Supply Zones
      if (priceActionData.supply_zones) {
        priceActionData.supply_zones.forEach((sz: any) => {
          const line = candleSeries.createPriceLine({
            price: sz.price,
            color: "rgba(239, 68, 68, 0.4)",
            lineWidth: 1,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: "Supply",
          });
          activePriceLines.push({ series: candleSeries, line });
        });
      }

      // Demand Zones
      if (priceActionData.demand_zones) {
        priceActionData.demand_zones.forEach((dz: any) => {
          const line = candleSeries.createPriceLine({
            price: dz.price,
            color: "rgba(16, 185, 129, 0.4)",
            lineWidth: 1,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: "Demand",
          });
          activePriceLines.push({ series: candleSeries, line });
        });
      }

      // Order Blocks
      if (priceActionData.order_blocks) {
        priceActionData.order_blocks.forEach((ob: any) => {
          const isBullish = ob.type === "bullish_ob";
          const line = candleSeries.createPriceLine({
            price: ob.price,
            color: isBullish ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: isBullish ? "Bullish OB" : "Bearish OB",
          });
          activePriceLines.push({ series: candleSeries, line });
        });
      }
    }

    // Render Pattern Trendlines and Necklines
    const patternLineSeriesList: any[] = [];
    if (showPatterns && patternsData) {
      patternsData.forEach((pattern: any) => {
        if (pattern.lines) {
          pattern.lines.forEach((lineData: any) => {
            const color = pattern.direction === "Bullish" ? "#10b981" : "#ef4444";
            const lineSeries = chart.addSeries(LineSeries, {
              color: color,
              lineWidth: 2,
              lineStyle: 1, // Dotted
              title: lineData.label,
            });
            lineSeries.setData([
              { time: lineData.start_time, value: lineData.start_price },
              { time: lineData.end_time, value: lineData.end_price }
            ]);
            patternLineSeriesList.push(lineSeries);
          });
        }
      });
    }

    // Handle Resize
    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      activePriceLines.forEach(({ series, line }) => {
        try {
          series.removePriceLine(line);
        } catch {
          // ignore
        }
      });
      patternLineSeriesList.forEach((series) => {
        try {
          chart.removeSeries(series);
        } catch {
          // ignore
        }
      });
      chart.remove();
    };
  }, [data, showSMA, showEMA, showBB, showPriceAction, priceActionData, showPatterns, patternsData]);

  return (
    <div className="bg-card-dark border border-border-dark rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-400">Lightweight Chart</h3>
        <div className="flex gap-4 text-xs font-semibold">
          <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors duration-200">
            <input
              type="checkbox"
              checked={showSMA}
              onChange={() => setShowSMA(!showSMA)}
              className="accent-emerald-500 rounded border-border-dark"
            />
            SMA (20)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors duration-200">
            <input
              type="checkbox"
              checked={showEMA}
              onChange={() => setShowEMA(!showEMA)}
              className="accent-emerald-500 rounded border-border-dark"
            />
            EMA (20)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors duration-200">
            <input
              type="checkbox"
              checked={showBB}
              onChange={() => setShowBB(!showBB)}
              className="accent-emerald-500 rounded border-border-dark"
            />
            Bollinger Bands
          </label>
          {priceActionData && (
            <label className="flex items-center gap-2 cursor-pointer text-purple-400 hover:text-purple-300 transition-colors duration-200">
              <input
                type="checkbox"
                checked={showPriceAction}
                onChange={() => setShowPriceAction(!showPriceAction)}
                className="accent-purple-500 rounded border-border-dark"
              />
              Price Action Overlays
            </label>
          )}
          {patternsData && (
            <label className="flex items-center gap-2 cursor-pointer text-purple-400 hover:text-purple-300 transition-colors duration-200">
              <input
                type="checkbox"
                checked={showPatterns}
                onChange={() => setShowPatterns(!showPatterns)}
                className="accent-purple-500 rounded border-border-dark"
              />
              Pattern Overlays
            </label>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full rounded-2xl overflow-hidden" />
    </div>
  );
}
