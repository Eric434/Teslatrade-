import { UserProfile, Stock } from "../types";
import { Wallet, TrendingUp, DollarSign, Activity, Award } from "lucide-react";

interface ProfitLossStatsProps {
  userProfile: UserProfile;
  stocks: { [symbol: string]: Stock };
}

export default function ProfitLossStats({ userProfile, stocks }: ProfitLossStatsProps) {
  // Compute positions USD value
  const positionsValue = Object.values(userProfile.holdings).reduce((sum, h) => {
    const livePrice = stocks[h.symbol]?.price || 0;
    return sum + h.units * livePrice;
  }, 0);

  const totalBalance = userProfile.buyingPower + positionsValue;

  // Let's create an elegant cost basis to calculate Profit & Loss (P&L) index
  const totalCostBasis = Object.values(userProfile.holdings).reduce((sum, h) => {
    return sum + h.units * h.averagePrice;
  }, 0);

  const profitLossUsd = positionsValue - totalCostBasis;
  const profitLossPercent = totalCostBasis > 0 ? (profitLossUsd / totalCostBasis) * 100 : 0;
  const isProfit = profitLossUsd >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="portfolio-telemetry-metrics">
      {/* Total Dynamic Balance */}
      <div className="bg-[#141414] border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-[#e82127]/20 transition duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono text-gray-400 tracking-widest block uppercase">
              Total Valuation
            </span>
            <h3 className="text-xl font-mono font-bold text-zinc-100 mt-1 select-all" id="total-balance-display">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2 bg-[#e82127]/10 rounded text-[#e82127]">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center justify-between">
          <span>PORTFOLIO CAPITAL</span>
          <span className="text-zinc-400">ACTIVE LEVERAGE</span>
        </div>
      </div>

      {/* Net Portfolio P&L */}
      <div className="bg-[#141414] border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-[#e82127]/20 transition duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono text-gray-400 tracking-widest block uppercase">
              Liquidation Profit & Loss
            </span>
            <h3 className={`text-xl font-mono font-bold mt-1 ${isProfit ? "text-emerald-400" : "text-rose-500"}`}>
              {isProfit ? "+" : ""}${profitLossUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className={`p-2 rounded ${isProfit ? "bg-emerald-500/10 text-emerald-400" : "bg-[#e82127]/10 text-[#e82127]"}`}>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] font-mono mt-2 flex items-center justify-between">
          <span className="text-zinc-500">NET APPRECIATION</span>
          <span className={`font-semibold ${isProfit ? "text-emerald-400" : "text-rose-500"}`}>
            {isProfit ? "▲" : "▼"} {isProfit ? "+" : ""}{profitLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Direct Positions Valuation */}
      <div className="bg-[#141414] border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-[#e82127]/20 transition duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono text-gray-400 tracking-widest block uppercase">
              Secured Asset Value
            </span>
            <h3 className="text-xl font-mono font-bold text-zinc-100 mt-1">
              ${positionsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2 bg-[#e82127]/10 rounded text-[#e82127]">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center justify-between">
          <span>STOCKS & TOKENS</span>
          <span className="text-zinc-400">
            {Object.values(userProfile.holdings).filter((h) => h.units > 0).length} INSTRUMENTS
          </span>
        </div>
      </div>

      {/* Available Buying Power */}
      <div className="bg-[#141414] border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-[#e82127]/20 transition duration-300">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono text-gray-400 tracking-widest block uppercase">
              Trading Cash Reserve
            </span>
            <h3 className="text-xl font-mono font-bold text-[#e82127] mt-1">
              ${userProfile.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2 bg-[#e82127]/10 rounded text-[#e82127] font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center justify-between">
          <span>USD CASH BALANCE</span>
          <span className="text-[#e82127]/80 font-bold">GUARANTEED</span>
        </div>
      </div>
    </div>
  );
}
