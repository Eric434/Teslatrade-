import React, { useState } from "react";
import { UserProfile, Stock, TradeActivity } from "../types";
import { ListCollapse, ShoppingBag, TrendingUp, Sparkles, Check } from "lucide-react";
import AssetLogo from "./AssetLogo";

interface OrderTicketProps {
  userProfile: UserProfile;
  stocks: { [symbol: string]: Stock };
  onSelectedStockChange: (symbol: string) => void;
  selectedSymbol: string;
  onExecuteTrade: (
    type: "BUY" | "SELL",
    symbol: string,
    quantity: number,
    price: number,
    totalUsd: number
  ) => void;
}

export default function OrderTicket({
  userProfile,
  stocks,
  onSelectedStockChange,
  selectedSymbol,
  onExecuteTrade,
}: OrderTicketProps) {
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [quantityStr, setQuantityStr] = useState("5");
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  const activeStock = stocks[selectedSymbol] || Object.values(stocks)[0];

  const quantity = parseFloat(quantityStr) || 0;
  const currentPrice = activeStock ? activeStock.price : 0;
  const totalCost = quantity * currentPrice;

  const currentHolding = userProfile.holdings[selectedSymbol] || { units: 0, averagePrice: 0 };

  const handleReviewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeError(null);
    setTradeSuccess(null);

    if (quantity <= 0) {
      setTradeError("Validation failed: Quantity must be greater than zero.");
      return;
    }

    if (tradeType === "BUY") {
      if (totalCost > userProfile.buyingPower) {
        setTradeError("Balance Exceeded: Insufficient buying power cash to preview.");
        return;
      }
    } else {
      if (quantity > currentHolding.units) {
        setTradeError(`Holdings mismatch: You own only ${currentHolding.units.toFixed(4)} units of ${selectedSymbol}.`);
        return;
      }
    }

    setIsPreviewMode(true);
  };

  const handleConfirmTrade = () => {
    setTradeError(null);
    setTradeSuccess(null);

    if (quantity <= 0) {
      setTradeError("Transaction aborted: Quantity must be greater than zero.");
      setIsPreviewMode(false);
      return;
    }

    if (tradeType === "BUY") {
      if (totalCost > userProfile.buyingPower) {
        setTradeError("Credit limit exceeded: Insufficient buying power cash.");
        setIsPreviewMode(false);
        return;
      }
      onExecuteTrade("BUY", selectedSymbol, quantity, currentPrice, totalCost);
      setTradeSuccess(`✔ PURCHASE FILLED: Acquired ${quantity} shares of ${selectedSymbol} at $${currentPrice.toFixed(2)}.`);
    } else {
      if (quantity > currentHolding.units) {
        setTradeError(`Holdings mismatch: You own only ${currentHolding.units.toFixed(2)} units of ${selectedSymbol}.`);
        setIsPreviewMode(false);
        return;
      }
      onExecuteTrade("SELL", selectedSymbol, quantity, currentPrice, totalCost);
      setTradeSuccess(`✔ LIQUIDATION FILLED: Sold ${quantity} shares of ${selectedSymbol} at $${currentPrice.toFixed(2)}.`);
    }

    setQuantityStr("");
    setIsPreviewMode(false);
    setTimeout(() => setTradeSuccess(null), 8000);
  };

  // Automatically reset preview state when symbol or trade type changes
  const handleSelectSymbol = (sym: string) => {
    onSelectedStockChange(sym);
    setTradeError(null);
    setTradeSuccess(null);
    setIsPreviewMode(false);
  };

  const handleToggleTradeType = (type: "BUY" | "SELL") => {
    setTradeType(type);
    setTradeError(null);
    setTradeSuccess(null);
    setIsPreviewMode(false);
  };

  if (isPreviewMode) {
    const postTradeCash = tradeType === "BUY"
      ? (userProfile.buyingPower - totalCost)
      : (userProfile.buyingPower + totalCost);

    const postTradeHoldings = tradeType === "BUY"
      ? (currentHolding.units + quantity)
      : (currentHolding.units - quantity);

    const cashAllocPercent = userProfile.buyingPower > 0
      ? (totalCost / userProfile.buyingPower) * 100
      : 0;

    return (
      <div className="bg-[#141414] border border-[#e82127]/20 p-5 rounded-xl shadow-2xl flex flex-col justify-between h-full" id="order-ticket-panel">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-sans font-semibold text-zinc-200">Investment Order Preview</h2>
                <p className="text-[9px] font-mono text-gray-500 tracking-wider">PRE-EXECUTION CLEARING REPORT</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Summary Banner */}
            <div className={`p-4 rounded-lg border text-center ${
              tradeType === "BUY" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              <span className="text-[10px] font-mono uppercase tracking-widest block mb-1 font-bold">Proposed Action</span>
              <span className="text-lg font-mono font-black tracking-wide block uppercase">
                {tradeType} {quantity.toFixed(4)} {selectedSymbol}
              </span>
              <span className="text-xxs font-mono block text-gray-400 mt-1">
                Estimated Settlement Cost: ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            {/* Financial Ledger breakdown */}
            <div className="space-y-2.5 p-3.5 bg-black rounded-lg border border-white/5 text-xxs font-mono text-gray-400">
              <div className="flex justify-between">
                <span>Principal Quantity</span>
                <span className="text-zinc-200">{quantity.toFixed(4)} Shares</span>
              </div>
              <div className="flex justify-between">
                <span>Oracle Market Price</span>
                <span className="text-zinc-200">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Brokerage Fee</span>
                <span className="text-emerald-400 font-bold uppercase">FREE ($0.00)</span>
              </div>
              <div className="flex justify-between">
                <span>SEC / Finra Regulatory Fee</span>
                <span className="text-emerald-400 font-bold uppercase">FREE ($0.00)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-zinc-300 font-semibold">Net Account Settle Value</span>
                <span className={`font-black ${tradeType === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                  ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Micro warning check */}
            {tradeType === "BUY" && cashAllocPercent > 90 && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xxs rounded font-mono leading-relaxed">
                ⚠️ PORTFOLIO HEAVY ALLOCATION: This single transaction consumes {cashAllocPercent.toFixed(1)}% of your secure liquid capital!
              </div>
            )}

            {/* Holdings & Liquidity Delta previews */}
            <div className="space-y-2 p-3 bg-black/40 border border-white/5 rounded-lg text-xxs font-mono text-zinc-400">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-1 mb-1.5 font-bold">
                Cash Flow & Inventory Delta
              </div>
              
              <div className="flex justify-between">
                <span>Cash Liquidity (Current)</span>
                <span className="text-zinc-300">${userProfile.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Liquidity (Expected)</span>
                <span className="text-zinc-100 font-bold">${postTradeCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between mt-2 pt-1.5 border-t border-white/5">
                <span>{selectedSymbol} Position (Current)</span>
                <span className="text-zinc-300">{(currentHolding.units || 0).toFixed(4)} Units</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{selectedSymbol} Position (Expected)</span>
                <span className="text-zinc-100 font-bold">{postTradeHoldings.toFixed(4)} Units</span>
              </div>
            </div>

            {/* System disclosure */}
            <p className="text-[9.5px] font-mono text-gray-650 leading-relaxed text-center">
              Settlements are resolved via mock-oracle nodes immediately upon cryptographic signature execution. Final values may vary slightly under extreme volatility.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={() => setIsPreviewMode(false)}
              className="py-2.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 font-mono text-xs uppercase rounded transition cursor-pointer font-bold text-center"
              id="back-to-edit-order-btn"
            >
              Edit Details
            </button>
            <button
              onClick={handleConfirmTrade}
              className={`py-2.5 font-mono text-xs uppercase rounded transition duration-155 font-bold shadow-lg cursor-pointer ${
                tradeType === "BUY"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-[#e82127] hover:bg-red-500 text-white"
              }`}
              id="confirm-place-order-btn"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-white/5 p-5 rounded-xl shadow-2xl flex flex-col justify-between h-full" id="order-ticket-panel">
      <div>
        {/* Panel Header */}
        <div className="flex items-center gap-3 border-b border-white/5 p-1 pb-3 mb-4">
          <div className="p-2 bg-[#e82127]/10 rounded-lg text-[#e82127]">
            <ShoppingBag className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-semibold text-zinc-200">Terminal Order Ticket</h2>
            <p className="text-xxs font-mono text-gray-500">REAL-TIME LIQUIDITY INTEGRATOR</p>
          </div>
        </div>

        {/* Asset Switcher Grid */}
        <div className="space-y-2 mb-4">
          <label className="text-xxs font-mono text-gray-500 tracking-wider block uppercase">
            Select Live Ledger Symbol:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.values(stocks).map((stock) => {
              const profileHolding = userProfile.holdings[stock.symbol]?.units || 0;
              return (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelectSymbol(stock.symbol)}
                  className={`p-2 rounded-lg flex flex-col text-left transition border ${
                    stock.symbol === selectedSymbol
                      ? "bg-[#e82127]/10 border-[#e82127]/40"
                      : "bg-black/40 border-white/5 hover:bg-zinc-900/60"
                  }`}
                  id={`select-asset-${stock.symbol}`}
                >
                  <div className="flex items-center gap-1.5">
                    <AssetLogo symbol={stock.symbol} className="w-4 h-4 shrink-0" />
                    <span className={`text-[10px] font-mono font-bold ${stock.symbol === selectedSymbol ? "text-[#e82127]" : "text-zinc-400"}`}>
                      {stock.symbol}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-200 mt-1">
                    ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  {profileHolding > 0 && (
                    <span className="text-[8px] font-mono text-zinc-500 mt-0.5 truncate uppercase">
                      Own: {profileHolding.toFixed(1)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Type Toggle (BUY / SELL) */}
        <div className="flex bg-black p-1 rounded-lg border border-white/5 gap-1.5 mb-4">
          <button
            onClick={() => handleToggleTradeType("BUY")}
            className={`flex-1 py-1.5 text-center font-mono text-xs uppercase rounded transition font-semibold tracking-wider ${
              tradeType === "BUY"
                ? "bg-emerald-555/20 border border-emerald-500/20 text-emerald-400 shadow-md"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
            id="buy-action-tab"
          >
            Buy Position
          </button>
          <button
            onClick={() => handleToggleTradeType("SELL")}
            className={`flex-1 py-1.5 text-center font-mono text-xs uppercase rounded transition font-semibold tracking-wider ${
              tradeType === "SELL"
                ? "bg-[#e82127]/20 border border-[#e82127]/30 text-red-400"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
            id="sell-action-tab"
          >
            Sell Position
          </button>
        </div>

        {/* Input Details */}
        <form onSubmit={handleReviewOrder} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xxs font-mono text-gray-400">
              <span className="uppercase">Shares/Units To Transact</span>
              {currentHolding.units > 0 && (
                <span className="text-zinc-500">
                  Holdings: {currentHolding.units.toFixed(4)} Units (${(currentHolding.units * currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.0001"
                required
                value={quantityStr}
                onChange={(e) => {
                  setQuantityStr(e.target.value);
                  setIsPreviewMode(false);
                }}
                placeholder="0.00"
                className="w-full bg-black border border-white/10 focus:border-[#e82127] px-3.5 py-2.5 rounded text-xs font-mono text-zinc-100 outline-none"
                id="trade-quantity-input"
              />
              <span className="absolute right-3.5 top-3 text-[10px] font-mono text-zinc-500 font-bold uppercase">
                {activeStock?.symbol}
              </span>
            </div>
          </div>

          {/* Quick fractional triggers */}
          <div className="grid grid-cols-4 gap-1">
            {["1", "5", "10", "25"].map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => {
                  setQuantityStr(unit);
                  setIsPreviewMode(false);
                }}
                className="py-1 bg-black/40 hover:bg-zinc-900 border border-white/5 hover:border-zinc-750 text-xxs font-mono text-zinc-400 rounded transition"
              >
                {unit} {activeStock?.symbol}
              </button>
            ))}
          </div>

          {/* Price Metrics overlay */}
          <div className="space-y-2 p-3 bg-black/50 border border-white/5 rounded-lg text-xxs font-mono text-gray-400">
            <div className="flex justify-between">
              <span>Unit Index Price</span>
              <span className="text-zinc-200">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Required USD Leverage</span>
              <span className={`font-semibold ${tradeType === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5">
              <span>Available Liquidity</span>
              <span className="text-zinc-200">${userProfile.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 border font-mono text-xs uppercase rounded transition duration-155 uppercase tracking-widest font-bold shadow-lg cursor-pointer ${
              tradeType === "BUY"
                ? "bg-emerald-600/10 hover:bg-emerald-650 hover:text-white border-emerald-500/30 text-emerald-400"
                : "bg-[#e82127]/10 hover:bg-[#e82127] hover:text-white border-[#e82127]/30 text-red-400 shadow-red-900/10"
            }`}
            id="execute-trade-submit"
          >
            Review & Preview Order
          </button>
        </form>
      </div>

      <div className="mt-3">
        {tradeSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xxs rounded font-mono text-center flex items-center justify-center gap-1.5 animate-pulse">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{tradeSuccess}</span>
          </div>
        )}

        {tradeError && (
          <div className="p-3 bg-[#e82127]/10 border border-[#e82127]/20 text-red-400 text-xxs rounded font-mono text-center leading-relaxed">
            ⚠ {tradeError}
          </div>
        )}
      </div>
    </div>
  );
}
