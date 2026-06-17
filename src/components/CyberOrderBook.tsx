import { useState, useEffect, useMemo } from "react";
import { Stock, TradeActivity } from "../types";
import { RefreshCw, Activity, Layers, Coins } from "lucide-react";

interface CyberOrderBookProps {
  stock: Stock;
  recentTrades: TradeActivity[];
}

export default function CyberOrderBook({ stock, recentTrades }: CyberOrderBookProps) {
  const [flashKey, setFlashKey] = useState(0);

  // Trigger a full order book layout recalculation (or simple graphic visual flash) when stock price shifts
  useEffect(() => {
    setFlashKey((prev) => prev + 1);
  }, [stock.price]);

  // Generate simulated dynamic Bid & Ask books around the selected Stock's Current Price
  const { bids, asks } = useMemo(() => {
    const basePrice = stock.price;
    const isCrypto = stock.category === "Crypto";
    const spread = basePrice * (isCrypto ? 0.002 : 0.001); // tight spread

    const asksList = [];
    const bidsList = [];

    // Let's generate 4 Asks (Sells, slightly higher than current price, sorted descending)
    for (let i = 4; i >= 1; i--) {
      const p = basePrice + spread * (i + Math.random() * 0.3);
      const qty = Math.random() * (isCrypto ? 1.5 : 25) + 0.5;
      const size = Math.random() * (isCrypto ? 150 : 2500) + 100;
      asksList.push({
        price: p,
        size: size,
        qty: qty,
        value: p * qty,
      });
    }

    // Let's generate 4 Bids (Buys, slightly lower than current price, sorted descending)
    for (let i = 1; i <= 4; i++) {
      const p = basePrice - spread * (i + Math.random() * 0.3);
      const qty = Math.random() * (isCrypto ? 2.1 : 30) + 0.5;
      const size = Math.random() * (isCrypto ? 200 : 3000) + 120;
      bidsList.push({
        price: p,
        size: size,
        qty: qty,
        value: p * qty,
      });
    }

    return { asks: asksList, bids: bidsList };
  }, [stock.price, stock.symbol]);

  const priceIsUp = stock.change >= 0;

  return (
    <div className="bg-[#0d0f19] border border-[#1e2338] rounded-xl shadow-2xl flex flex-col font-sans select-scrollbar overflow-hidden" id="coder-bock-panel">
      {/* Title Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#e82127]/15 rounded text-[#e82127]">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              ORDER BOOK <span className="text-zinc-500 text-[10px]">/ CODER BOCK</span>
            </h3>
            <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              MICROSECOND BROKER RECORD MATCH
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">LIVE FEED</span>
        </div>
      </div>

      {/* Tilted columns header with actual funny OCR words from image: "Reb", "Sinay", "Qasoly", "Veluh" */}
      <div className="px-4 py-2 bg-black/40 border-b border-white/5 grid grid-cols-4 text-left text-xxs font-mono text-zinc-400 tracking-wider">
        <div title="Bid Price (Reb)">REB <span className="text-zinc-600 text-[8px] block">(BID/PRICE)</span></div>
        <div title="Size/Liquidity (Sinay)" className="text-right">SINAY <span className="text-zinc-600 text-[8px] block">(SIZE)</span></div>
        <div title="Quantity (Qasoly)" className="text-right">QASOLY <span className="text-zinc-600 text-[8px] block">(QTY)</span></div>
        <div title="Total Value (Veluh)" className="text-right">VELUH <span className="text-zinc-600 text-[8px] block">(VALUE)</span></div>
      </div>

      {/* Asks (Sell Orders) - Red text / slightly higher than price */}
      <div className="px-1 py-1.5 space-y-0.5 max-h-36 overflow-hidden">
        {asks.map((ask, idx) => (
          <div
            key={`ask-${idx}-${flashKey}`}
            className="px-3 py-1 hover:bg-white/5 grid grid-cols-4 items-center text-xxs font-mono transition duration-150 relative group"
          >
            {/* Soft background weight visualization */}
            <div className="absolute right-0 top-0 bottom-0 bg-red-500/5 pointer-events-none transition-all duration-300" style={{ width: `${Math.min(100, (ask.qty / 40) * 100)}%` }}></div>
            
            <div className="text-red-400 font-bold tracking-tight z-10">
              ${ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-right text-zinc-400 z-10">
              {ask.size.toFixed(0)}
            </div>
            <div className="text-right text-zinc-300 z-10 font-medium">
              {ask.qty.toFixed(isFinite(ask.qty) && ask.qty < 5 ? 3 : 1)}
            </div>
            <div className="text-right text-zinc-400 font-bold z-10">
              ${ask.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      {/* Live Market-Date Spread Centerpiece Banner */}
      <div className="px-4 py-2.5 bg-zinc-950 border-y border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono font-black ${priceIsUp ? "text-emerald-400" : "text-red-400"} tracking-tight`}>
            ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-[10px] font-mono px-1 rounded font-bold ${priceIsUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {priceIsUp ? "▲" : "▼"} {priceIsUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
          </span>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-mono text-zinc-500 block uppercase">SPREAD GAP</span>
          <span className="text-[10px] font-mono text-zinc-300 font-bold">
            ${(stock.price * 0.0025).toFixed(2)} (0.25%)
          </span>
        </div>
      </div>

      {/* Bids (Buy Orders) - Green text / slightly lower than price */}
      <div className="px-1 py-1.5 space-y-0.5 max-h-36 overflow-hidden">
        {bids.map((bid, idx) => (
          <div
            key={`bid-${idx}-${flashKey}`}
            className="px-3 py-1 hover:bg-white/5 grid grid-cols-4 items-center text-xxs font-mono transition duration-150 relative group"
          >
            {/* Soft background weight visualization */}
            <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/5 pointer-events-none transition-all duration-300" style={{ width: `${Math.min(100, (bid.qty / 40) * 100)}%` }}></div>
            
            <div className="text-emerald-400 font-bold tracking-tight z-10">
              ${bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-right text-zinc-400 z-10">
              {bid.size.toFixed(0)}
            </div>
            <div className="text-right text-zinc-300 z-10 font-medium">
              {bid.qty.toFixed(isFinite(bid.qty) && bid.qty < 5 ? 3 : 1)}
            </div>
            <div className="text-right text-zinc-400 font-bold z-10">
              ${bid.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      {/* Market-Date Block (Direct replica of the "Market-Date" micro grid layout from reference image) */}
      <div className="p-4 bg-zinc-950/75 border-t border-white/5 space-y-3" id="market-data-blocks">
        <span className="text-[9px] font-mono font-bold tracking-widest text-[#e82127] uppercase block">
          MARKET METRICS // SYSTEM INDICES
        </span>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-black/60 border border-white/5 p-2 rounded-lg text-center">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">Volume 24h</span>
            <span className="text-xs font-mono font-bold text-zinc-200">
              {(stock.price * 3824.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[8px] font-mono text-emerald-400 block mt-0.5 font-bold">+4.8% ▲</span>
          </div>

          <div className="bg-black/60 border border-white/5 p-2 rounded-lg text-center">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">Open Size</span>
            <span className="text-xs font-mono font-bold text-zinc-200">
              {(stock.price * 1150).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">BALANCED</span>
          </div>

          <div className="bg-black/60 border border-white/5 p-2 rounded-lg text-center">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">Volatility</span>
            <span className="text-xs font-mono font-bold text-[#e82127] uppercase">
              {stock.symbol === "TSLA" || stock.symbol === "SPACEX" ? "SYSTEM HIGH" : "NOMINAL"}
            </span>
            <span className="text-[8px] font-mono text-red-400 block mt-0.5 font-bold">12.8%</span>
          </div>
        </div>
      </div>

      {/* Trade History Ledger View */}
      <div className="p-4 border-t border-white/5 bg-black/40 flex-1">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
            TRADE HISTORY FEED
          </span>
          <span className="text-[8px] font-mono text-zinc-500">REALTIME TIMESTAMP</span>
        </div>

        <div className="space-y-1.5 max-h-44 overflow-y-auto select-scrollbar text-[10px] font-mono">
          {recentTrades.slice(0, 6).map((trade, idx) => {
            const isBuy = trade.type === "BUY";
            return (
              <div key={trade.id || idx} className="flex items-center justify-between py-1 border-b border-white/5 hover:bg-white/5 px-1.5 rounded transition">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-1 h-1 rounded-full ${isBuy ? "bg-emerald-500 animate-ping" : "bg-red-500 animate-ping"}`}></span>
                  <span className={isBuy ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {trade.type}
                  </span>
                  <span className="text-zinc-100 font-semibold">{trade.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 font-medium">{trade.amount.toFixed(1)} units</span>
                  <span className="text-zinc-400 font-bold text-right min-w-[55px]">
                    ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}

          {recentTrades.length === 0 && (
            <div className="py-4 text-center text-zinc-500 text-[10px] font-sans">
              No recent terminal activity detected. Submit buy/sell orders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
