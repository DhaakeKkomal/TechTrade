import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { ISeriesApi } from "lightweight-charts";
import { calculateSMA, calculateEMA, calculateBollingerBands } from "../utils/chartHelpers";
import type { Candle } from "../utils/chartHelpers";

interface StockChartProps {
  data: Candle[];
}

export default function StockChart({ data }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Overlay Toggles
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBB, setShowBB] = useState(false);

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
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });
    candleSeries.setData(data);

    // Add Volume Series (sub-pane at bottom)
    const volumeSeries = chart.addHistogramSeries({
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
    volumeSeries.setData(volumeData);

    // Overlay references to update dynamically
    const overlaySeriesList: ISeriesApi<any>[] = [];

    // Render SMA Overlay
    if (showSMA) {
      const smaData = calculateSMA(data, 20);
      const smaLine = chart.addLineSeries({
        color: "#f59e0b",
        lineWidth: 1.5,
        title: "SMA (20)",
      });
      smaLine.setData(smaData);
      overlaySeriesList.push(smaLine);
    }

    // Render EMA Overlay
    if (showEMA) {
      const emaData = calculateEMA(data, 20);
      const emaLine = chart.addLineSeries({
        color: "#a855f7",
        lineWidth: 1.5,
        title: "EMA (20)",
      });
      emaLine.setData(emaData);
      overlaySeriesList.push(emaLine);
    }

    // Render Bollinger Bands Overlays
    if (showBB) {
      const bbData = calculateBollingerBands(data, 20, 2);
      
      const upperLine = chart.addLineSeries({
        color: "rgba(59, 130, 246, 0.6)",
        lineWidth: 1,
        title: "BB Upper",
      });
      const middleLine = chart.addLineSeries({
        color: "rgba(59, 130, 246, 0.3)",
        lineWidth: 1,
        title: "BB Middle",
      });
      const lowerLine = chart.addLineSeries({
        color: "rgba(59, 130, 246, 0.6)",
        lineWidth: 1,
        title: "BB Lower",
      });

      upperLine.setData(bbData.upper);
      middleLine.setData(bbData.middle);
      lowerLine.setData(bbData.lower);

      overlaySeriesList.push(upperLine, middleLine, lowerLine);
    }

    // Handle Resize
    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, showSMA, showEMA, showBB]);

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
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full rounded-2xl overflow-hidden" />
    </div>
  );
}
