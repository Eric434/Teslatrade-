import { useState, useEffect } from "react";
import { Stock } from "../types";
import { TrendingUp, Activity, Layers } from "lucide-react";
import AssetLogo from "./AssetLogo";

interface StockChartProps {
  stock: Stock;
}

export default function StockChart({ stock }: StockChartProps) {
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  // Create rich simulated candlestick data from historical raw closing prices
  const history = stock.history || [240, 242, 239, 241, 245, 243, 247, 248.42];
  
  // Calculate a reliable range
  const minPrice = Math.min(...history) * 0.985;
  const maxPrice = Math.max(...history) * 1.015;
  const priceRange = maxPrice - minPrice || 1;

  const width = 600;
  const height = 240;
  const paddingLeft = 15;
  const paddingRight = 65; // Extra room for vertical coordinate axis labels
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Generate complete OHLC Candlestick structure for each tick
  const candles = history.map((close, idx) => {
    // Determine open based on previous tick's close, or close offset for index 0
    const open = idx === 0 ? close * 0.995 : history[idx - 1];
    const isUp = close >= open;
    
    // Create random but proportional high/low boundaries
    const offsetHigh = priceRange * 0.15;
    const offsetLow = priceRange * 0.12;
    const high = Math.max(open, close) + (idx % 2 === 0 ? offsetHigh : offsetHigh * 0.6);
    const low = Math.min(open, close) - (idx % 3 === 0 ? offsetLow : offsetLow * 0.4);

    // X coordinates
    const x = paddingLeft + (idx * chartWidth) / (history.length - 1);
    
    // Y coordinates
    const yClose = height - paddingBottom - ((close - minPrice) * chartHeight) / priceRange;
    const yOpen = height - paddingBottom - ((open - minPrice) * chartHeight) / priceRange;
    const yHigh = height - paddingBottom - ((high - minPrice) * chartHeight) / priceRange;
    const yLow = height - paddingBottom - ((low - minPrice) * chartHeight) / priceRange;

    return {
      x,
      open,
      close,
      high,
      low,
      yOpen,
      yClose,
      yHigh,
      yLow,
      isUp,
    };
  });

  const latestPrice = stock.price;
  const latestY = height - paddingBottom - ((latestPrice - minPrice) * chartHeight) / priceRange;
  const stockIsUp = stock.change >= 0;

  // Render variables for classic Line path
  const linePoints = candles.map((c) => ({ x: c.x, y: c.yClose }));
  const pathD = linePoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = linePoints.length > 0 
    ? `${pathD} L ${linePoints[linePoints.length - 1].x} ${height - paddingBottom} L ${linePoints[0].x} ${height - paddingBottom} Z` 
    : "";

  return (
    <div className="relative bg-[#0d0f19] border border-[#1e2338] p-5 rounded-xl shadow-2xl transition-all duration-300 hover:border-[#e82127]/20" id="stock-chart-panel">
      {/* Top Controls Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-[#e82127] tracking-wider uppercase bg-[#e82127]/10 px-2 py-0.5 rounded border border-[#e82127]/20 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-[#e82127] rounded-full animate-pulse"></span>
              Live Feed Feed
            </span>
            <span className="text-zinc-500 font-mono text-[9px]">ORACLE T-SERIES</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <AssetLogo symbol={stock.symbol} className="w-8 h-8 rounded-lg shrink-0 border border-white/5 bg-black/40" />
            <h3 className="text-sm font-sans font-medium text-zinc-100 flex flex-col justify-center leading-tight">
              <span className="font-bold tracking-tight text-white uppercase">{stock.name}</span>
              <span className="text-[10px] font-mono text-[#e82127]">{stock.symbol} / USDGLO</span>
            </h3>
          </div>
        </div>

        {/* Display controls */}
        <div className="flex items-center gap-3">
          <div className="bg-black/60 border border-white/10 p-1 rounded-lg flex items-center gap-1 text-[9px] font-mono">
            <button
              onClick={() => setChartType("candlestick")}
              className={`px-2 py-1 rounded transition duration-150 flex items-center gap-1 cursor-pointer ${
                chartType === "candlestick" ? "bg-[#e82127]/25 text-red-400 border border-[#e82127]/30" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Activity className="w-3 h-3" />
              Candlesticks
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-2 py-1 rounded transition duration-150 flex items-center gap-1 cursor-pointer ${
                chartType === "line" ? "bg-[#e82127]/25 text-red-400 border border-[#e82127]/30" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="w-3 h-3" />
              Line Flow
            </button>
          </div>

          <div className="text-right">
            <div className={`text-base font-mono font-black ${stockIsUp ? "text-emerald-400 font-bold" : "text-red-400 font-bold"} tracking-tight`}>
              ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-[10px] font-mono ${stockIsUp ? "text-emerald-400" : "text-red-400"} flex items-center justify-end gap-1`}>
              {stockIsUp ? "▲" : "▼"} {stockIsUp ? "+" : ""}{stock.change.toFixed(2)} ({stockIsUp ? "+" : ""}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas block */}
      <div className="relative">
        {/* Horizontal & Vertical grid indicators */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 bg-[radial-gradient(#1e2439_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
        
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible" id="chart-svg-view">
          <defs>
            <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(232, 33, 39)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(232, 33, 39)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Clean Horizontal grids */}
          <line x1={0} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="rgba(255, 255, 255, 0.04)" />
          <line x1={0} y1={paddingTop + chartHeight / 3} x2={width - paddingRight} y2={paddingTop + chartHeight / 3} stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="2,2" />
          <line x1={0} y1={paddingTop + (2 * chartHeight) / 3} x2={width - paddingRight} y2={paddingTop + (2 * chartHeight) / 3} stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="2,2" />
          <line x1={0} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="rgba(255, 255, 255, 0.08)" />

          {/* Right Y-Axis line and coordinate texts */}
          <line x1={width - paddingRight} y1={paddingTop} x2={width - paddingRight} y2={height - paddingBottom} stroke="rgba(255, 255, 255, 0.08)" />
          
          {/* Axis Labels */}
          <text x={width - paddingRight + 8} y={paddingTop + 4} className="fill-zinc-500 font-mono text-[9px] font-bold">
            ${maxPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </text>
          <text x={width - paddingRight + 8} y={paddingTop + chartHeight / 3 + 3} className="fill-zinc-600 font-mono text-[9px]">
            ${(maxPrice - priceRange / 3).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </text>
          <text x={width - paddingRight + 8} y={paddingTop + (2 * chartHeight) / 3 + 3} className="fill-zinc-600 font-mono text-[9px]">
            ${(maxPrice - (2 * priceRange) / 3).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </text>
          <text x={width - paddingRight + 8} y={height - paddingBottom + 3} className="fill-zinc-500 font-mono text-[9px] font-bold">
            ${minPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </text>

          {/* Sliding Live-Price Horizontal Marker & Text Tag (like the red/green tag in reference) */}
          {latestY >= paddingTop && latestY <= height - paddingBottom && (
            <g>
              <line 
                x1={0} 
                y1={latestY} 
                x2={width - paddingRight} 
                y2={latestY} 
                stroke={stockIsUp ? "rgba(16, 185, 129, 0.4)" : "rgba(232, 33, 39, 0.4)"} 
                strokeDasharray="2,2" 
              />
              <path 
                d={`M ${width - paddingRight} ${latestY} L ${width - paddingRight + 6} ${latestY - 6} L ${width - 5} ${latestY - 6} L ${width - 5} ${latestY + 6} L ${width - paddingRight + 6} ${latestY + 6} Z`} 
                className={stockIsUp ? "fill-emerald-500" : "fill-red-500"} 
              />
              <text 
                x={width - paddingRight + 9} 
                y={latestY + 3} 
                className="fill-black font-mono text-[8px] font-bold"
              >
                {latestPrice.toFixed(2)}
              </text>
            </g>
          )}

          {/* Render Mode: Line layout */}
          {chartType === "line" && (
            <>
              {areaD && (
                <path d={areaD} fill={stockIsUp ? "url(#colorUp)" : "url(#colorDown)"} />
              )}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  className={stockIsUp ? "stroke-emerald-400" : "stroke-red-400"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* Render Mode: Candlestick layout with wicks and bodies (reference chart) */}
          {chartType === "candlestick" && (
            <g id="candlestick-group">
              {candles.map((candle, idx) => {
                const wickX = candle.x;
                const candleWidth = Math.max(6, Math.min(18, chartWidth / history.length - 8));
                const rectX = candle.x - candleWidth / 2;
                const rectY = Math.min(candle.yOpen, candle.yClose);
                const rectHeight = Math.max(2, Math.abs(candle.yOpen - candle.yClose));
                
                return (
                  <g key={idx} className="cursor-pointer">
                    {/* Shadow wick */}
                    <line
                      x1={wickX}
                      y1={candle.yHigh}
                      x2={wickX}
                      y2={candle.yLow}
                      className={candle.isUp ? "stroke-emerald-400" : "stroke-red-400"}
                      strokeWidth="1.5"
                    />
                    {/* Body container */}
                    <rect
                      x={rectX}
                      y={rectY}
                      width={candleWidth}
                      height={rectHeight}
                      className={`${
                        candle.isUp 
                          ? "fill-[#10b981] stroke-[#10b981] " 
                          : "fill-[#e82127] stroke-[#e82127]"
                      } transition-all duration-150 hover:opacity-80`}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Hover tracker dots and wicks */}
          {candles.map((c, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer"
            >
              {/* Invisible interaction hit target */}
              <rect
                x={c.x - chartWidth / (history.length * 2)}
                y={paddingTop}
                width={chartWidth / history.length}
                height={chartHeight}
                fill="transparent"
              />
              
              {hoverIndex === idx && (
                <>
                  <line 
                    x1={c.x} 
                    y1={paddingTop} 
                    x2={c.x} 
                    y2={height - paddingBottom} 
                    stroke="rgba(255, 255, 255, 0.15)" 
                    strokeWidth="1" 
                    strokeDasharray="2,2" 
                  />
                  <circle cx={c.x} cy={c.yClose} r="5" className="fill-[#e82127] stroke-white stroke" />
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Hover Index Info Overlay */}
        {hoverIndex !== null && candles[hoverIndex] && (
          <div
            className="absolute top-1 bg-zinc-950/90 border border-white/10 text-zinc-300 px-2.5 py-1.5 rounded-lg text-xxs font-mono flex flex-wrap gap-x-3 gap-y-0.5 items-center shadow-xl transition-all duration-150 z-10"
            style={{
              left: `${Math.min(
                Math.max(2, (hoverIndex * 100) / (candles.length - 1) - 15),
                70
              )}%`,
            }}
          >
            <div>
              <span className="text-zinc-500 font-bold mr-1">TICK:</span> 
              <span className="text-white font-semibold">{hoverIndex + 1}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold mr-1">OPEN:</span> 
              <span className="text-zinc-100">${candles[hoverIndex].open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold mr-1">HIGH:</span> 
              <span className="text-emerald-400 font-semibold">${candles[hoverIndex].high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold mr-1">CLOSE:</span> 
              <span className={candles[hoverIndex].isUp ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                ${candles[hoverIndex].close.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Axis timeline indices */}
      <div className="flex justify-between items-center mt-3 text-[9px] font-mono text-zinc-500 tracking-wider">
        <span>T-40s CHRONO</span>
        <span className="bg-[#121625] border border-white/5 px-2 py-0.5 rounded text-zinc-400">
          CANDLESTICK INTERVAL 5s // ACTIVE NODE FEED
        </span>
        <span>LATEST VALUE</span>
      </div>
    </div>
  );
}
