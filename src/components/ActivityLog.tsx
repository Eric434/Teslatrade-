import { TradeActivity } from "../types";
import { Clock, CheckCircle, ArrowDownCircle, ArrowUpRight } from "lucide-react";

interface ActivityLogProps {
  activities: TradeActivity[];
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  const sortedActivities = [...activities].reverse();

  return (
    <div className="bg-[#141414] border border-white/5 p-5 rounded-xl shadow-2xl space-y-4" id="trading-activity-panel">
      <div className="flex items-center gap-3 border-b border-white/5 p-1 pb-3">
        <div className="p-2 bg-[#e82127]/10 rounded-lg text-[#e82127]">
          <Clock className="w-5 h-5 flex-shrink-0" />
        </div>
        <div>
          <h2 className="text-sm font-sans font-semibold text-zinc-200">Terminal Trade History</h2>
          <p className="text-xxs font-mono text-gray-500">REAL-TIME TRANSACTION LEDGER RECORD</p>
        </div>
      </div>

      <div className="select-scrollbar max-h-56 overflow-y-auto pr-1">
        {sortedActivities.length > 0 ? (
          <div className="divide-y divide-white/5">
            {sortedActivities.map((act) => {
              const isBuy = act.type === "BUY";
              const isBridge = act.type === "DEPOSIT_STX";
              const isFaucet = act.type === "SYSTEM" && act.status === "FAUCET_CLAIM";
              const isDeposit = act.type === "DEPOSIT";
              const isWithdraw = act.type === "WITHDRAW";
              
              let textTypeColor = "text-[#e82127]";
              let labelBg = "bg-[#e82127]/10 text-[#e82127]";
              let labelText = "SELL STATE";
              let amountText = `${act.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })} ${act.symbol === "STX" ? "STXCOIN" : "SHARES"}`;
              let costText = `@ $${act.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`;
              let totalText = `${isBuy || isWithdraw ? "-" : "+"}$${act.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

              if (isBuy) {
                textTypeColor = "text-emerald-400";
                labelBg = "bg-emerald-500/10 text-emerald-400";
                labelText = "BUY ORDER";
              } else if (isBridge) {
                textTypeColor = "text-red-400";
                labelBg = "bg-[#e82127]/15 text-red-400";
                labelText = "STX BRIDGE";
              } else if (isFaucet) {
                textTypeColor = "text-amber-400";
                labelBg = "bg-amber-500/10 text-amber-400";
                labelText = "FAUCET CLAIM";
                amountText = `+${act.amount.toLocaleString()} STX`;
                costText = "Testnet Network Faucet";
                totalText = `+$${act.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Sim)`;
              } else if (isDeposit) {
                textTypeColor = "text-emerald-400";
                labelBg = "bg-emerald-500/10 text-emerald-400";
                labelText = "CASH CREDITED";
                amountText = `+$${act.amount.toLocaleString()}`;
                costText = "Admin Deposit Override";
                totalText = `+$${act.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
              } else if (isWithdraw) {
                textTypeColor = "text-red-400";
                labelBg = "bg-[#e82127]/10 text-red-400";
                labelText = "CASH DEBITED";
                amountText = `-$${act.amount.toLocaleString()}`;
                costText = "Admin Debit Override";
                totalText = `-$${act.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
              } else if (act.type === "SELL") {
                textTypeColor = "text-[#e82127]";
                labelBg = "bg-[#e82127]/10 text-[#e82127]";
                labelText = "SELL STATE";
              }

              return (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 shrink-0">
                      {act.timestamp}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${labelBg}`}>
                      {labelText}
                    </span>
                    <span className="font-bold text-zinc-200">
                      {act.symbol}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-zinc-300 font-bold">
                        {amountText}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {costText}
                      </div>
                    </div>
                    
                    <div className="min-w-24">
                      <div className={`font-bold ${textTypeColor}`}>
                        {totalText}
                      </div>
                      <div className="text-[8px] text-zinc-500 tracking-wider flex items-center justify-end gap-0.5 uppercase">
                        <CheckCircle className="w-2.5 h-2.5 text-[#e82127]" /> Confirmed
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 font-sans text-xs">
            No dynamic transaction entries on this cryptographic profile.
          </div>
        )}
      </div>
    </div>
  );
}
