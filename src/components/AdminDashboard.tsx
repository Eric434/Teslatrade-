import React, { useState } from "react";
import { UserProfile, Stock } from "../types";
import { 
  ShieldAlert, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Minus, 
  RefreshCw, 
  Coins, 
  Briefcase, 
  UserMinus, 
  Check, 
  Lock, 
  TrendingUp, 
  ShieldCheck,
  Eye,
  Settings,
  AlertCircle
} from "lucide-react";

interface AdminDashboardProps {
  allProfiles: UserProfile[];
  stocks: { [symbol: string]: Stock };
  onUpdatePowerForUser: (profileId: string, nextUSD: number, nextStx: number) => void;
  onUpdateHoldingsForUser: (profileId: string, symbol: string, units: number, averagePrice: number) => void;
  onDeleteUser: (profileId: string) => void;
  onAddActivity: (userId: string, action: { symbol: string; type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW" | "SYSTEM"; amount: number; price: number; totalUsd: number; status: string }) => void;
  onClose: () => void;
}

export default function AdminDashboard({
  allProfiles,
  stocks,
  onUpdatePowerForUser,
  onUpdateHoldingsForUser,
  onDeleteUser,
  onAddActivity,
  onClose,
}: AdminDashboardProps) {
  // Active selected user inside the administrator console
  const [selectedUser, setSelectedUser] = useState<UserProfile>(allProfiles[0] || null);

  // Form State for Balance Adjustment (Credit / Debit)
  const [adjustType, setAdjustType] = useState<"TOP_UP" | "DEDUCT">("TOP_UP");
  const [adjustAsset, setAdjustAsset] = useState<"USD" | "STX">("USD");
  const [adjustAmount, setAdjustAmount] = useState<string>("");

  // Form State for holdings override
  const [stockSymbol, setStockSymbol] = useState<string>("TSLA");
  const [stockUnits, setStockUnits] = useState<string>("");
  const [stockAvgPrice, setStockAvgPrice] = useState<string>("");

  // Success / Error alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refresh active user object when general prop changes
  const activeUser = allProfiles.find(u => u.id === selectedUser?.id) || allProfiles[0] || null;

  const triggerAlert = (message: string, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(message);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) {
      triggerAlert("No active investor selected to administer.", true);
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerAlert("Please enter a valid amount greater than 0.", true);
      return;
    }

    let nextUSD = activeUser.buyingPower;
    let nextSTX = activeUser.lastStxBalance;

    if (adjustAsset === "USD") {
      if (adjustType === "TOP_UP") {
        nextUSD += amount;
        onAddActivity(activeUser.id, {
          symbol: "USD",
          type: "DEPOSIT",
          amount: amount,
          price: 1,
          totalUsd: amount,
          status: "FILLED"
        });
        triggerAlert(`Successfully credited $${amount.toLocaleString()} USD to ${activeUser.username}!`);
      } else {
        if (nextUSD < amount) {
          triggerAlert(`Deduction failed: User only has $${nextUSD.toLocaleString()} USD buying power.`, true);
          return;
        }
        nextUSD -= amount;
        onAddActivity(activeUser.id, {
          symbol: "USD",
          type: "WITHDRAW",
          amount: amount,
          price: 1,
          totalUsd: amount,
          status: "FILLED"
        });
        triggerAlert(`Successfully deducted $${amount.toLocaleString()} USD from ${activeUser.username}!`);
      }
    } else {
      // STX balance
      if (adjustType === "TOP_UP") {
        nextSTX += amount;
        onAddActivity(activeUser.id, {
          symbol: "STX",
          type: "SYSTEM",
          amount: amount,
          price: 2.50,
          totalUsd: amount * 2.50,
          status: "FILLED"
        });
        triggerAlert(`Successfully credited ${amount.toLocaleString()} STX to ${activeUser.username}!`);
      } else {
        if (nextSTX < amount) {
          triggerAlert(`Deduction failed: User only has ${nextSTX.toLocaleString()} STX connected.`, true);
          return;
        }
        nextSTX -= amount;
        onAddActivity(activeUser.id, {
          symbol: "STX",
          type: "SYSTEM",
          amount: amount,
          price: 2.50,
          totalUsd: amount * 2.50,
          status: "FILLED"
        });
        triggerAlert(`Successfully debited ${amount.toLocaleString()} STX from ${activeUser.username}!`);
      }
    }

    onUpdatePowerForUser(activeUser.id, nextUSD, nextSTX);
    setAdjustAmount("");
  };

  const handleApplyHoldingsOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) {
      triggerAlert("No active investor selected to administer.", true);
      return;
    }

    const units = parseFloat(stockUnits);
    const avgPrice = parseFloat(stockAvgPrice || "0");

    if (isNaN(units) || units < 0) {
      triggerAlert("Please enter a valid quantity of units (0 to wipe position).", true);
      return;
    }

    if (units > 0 && (isNaN(avgPrice) || avgPrice <= 0)) {
      triggerAlert("Please enter a valid average purchase price for positive holdings.", true);
      return;
    }

    onUpdateHoldingsForUser(activeUser.id, stockSymbol, units, units > 0 ? avgPrice : 0);
    
    // Log adjustment in user's general ledger
    onAddActivity(activeUser.id, {
      symbol: stockSymbol,
      type: "SYSTEM",
      amount: units,
      price: avgPrice,
      totalUsd: units * avgPrice,
      status: `OVERWRITTEN TO ${units} UNITS`
    });

    triggerAlert(`Successfully overwritten ${activeUser.username}'s ${stockSymbol} holdings.`);
    setStockUnits("");
    setStockAvgPrice("");
  };

  const handleResetUser = () => {
    if (!activeUser) return;
    if (confirm(`Are you absolutely sure you want to reset all capital or positions for ${activeUser.username}?`)) {
      onUpdatePowerForUser(activeUser.id, 100000, 0);
      
      // Wipe stock symbols
      Object.keys(stocks).forEach(sym => {
        onUpdateHoldingsForUser(activeUser.id, sym, 0, 0);
      });

      onAddActivity(activeUser.id, {
        symbol: "SYS",
        type: "SYSTEM",
        amount: 0,
        price: 0,
        totalUsd: 0,
        status: "PROFILE RESET BY ADMIN"
      });

      triggerAlert(`Investor profile for ${activeUser.username} has been reset to defaults.`);
    }
  };

  return (
    <div className="bg-[#121212] border border-red-500/30 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6" id="admin-dashboard-container">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg text-[#e82127]">
            <ShieldAlert className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-sans font-black tracking-widest text-zinc-100 uppercase">
                ADMINISTRATION SECURITY MODULE
              </h2>
              <span className="bg-[#e82127] text-white text-[8px] font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                CORE OVERRIDE ACTIVE
              </span>
            </div>
            <p className="text-xxs font-mono text-gray-400 mt-0.5">TOP UP, DEBIT PORTFOLIOS, AND ADJUST QUANTITY SETTLEMENTS</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-mono rounded border border-white/10 hover:border-white/20 transition cursor-pointer uppercase tracking-wider"
          id="close-admin-btn"
        >
          Exit Override Module
        </button>
      </div>

      {/* Grid: 3 Cols: Users List (1), Adjust Balance (1), Adjust Holdings (1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1: REGISTERED SYSTEM ACCOUNTS */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4.5 space-y-4">
          <h3 className="text-xxs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#e82127]" /> Select Accounts ({allProfiles.length})
          </h3>
          
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto select-scrollbar pr-1">
            {allProfiles.map((user) => {
              const isSelected = activeUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSuccessMsg(null);
                    setErrorMsg(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition border ${
                    isSelected
                      ? "bg-[#e82127]/10 border-red-500/40 text-white"
                      : "bg-black/40 border-white/5 hover:bg-zinc-900/60 text-gray-450"
                  }`}
                  id={`admin-select-user-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.avatar} 
                      className="w-8 h-8 rounded-full border border-white/10 object-cover" 
                      alt={user.username}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-xs font-mono font-bold">{user.username}</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono font-bold text-zinc-100">
                      ${user.buyingPower.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[9px] font-mono text-gray-500">
                      {user.lastStxBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })} STX
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {activeUser && (
            <div className="border-t border-white/5 pt-3 mt-1.5 space-y-2">
              <div className="flex justify-between items-center text-xxs font-mono">
                <span className="text-gray-500">UID:</span>
                <span className="text-zinc-400 font-bold">{activeUser.id}</span>
              </div>
              <button
                onClick={handleResetUser}
                className="w-full py-1.5 border border-[#e82127]/25 hover:border-red-500 bg-red-950/10 hover:bg-red-950/30 text-red-400 rounded text-xxs font-mono uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                id="reset-profile-admin-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Force Reset Investor
              </button>
            </div>
          )}
        </div>

        {/* COL 2: TOP-UP & DEDUCTION OVERRIDES */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4.5 space-y-4">
          <h3 className="text-xxs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[#e82127]" /> Balance Adjustment
          </h3>

          {activeUser ? (
            <form onSubmit={handleApplyAdjustment} className="space-y-4" id="admin-balance-form">
              {/* Target User display */}
              <div className="bg-black/40 p-2.5 rounded border border-white/5 text-xxs font-mono text-gray-400 space-y-1">
                <div>TARGET: <strong className="text-zinc-200">{activeUser.username}</strong></div>
                <div className="flex justify-between">
                  <span>Current Cash: <strong className="text-zinc-100">${activeUser.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                  <span>STX: <strong className="text-zinc-100">{activeUser.lastStxBalance.toLocaleString()} STX</strong></span>
                </div>
              </div>

              {/* Action: TOP_UP or DEDUCT */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Adjustment Operation:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("TOP_UP")}
                    className={`py-1.5 rounded text-xxs font-mono uppercase tracking-wide border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustType === "TOP_UP"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold"
                        : "bg-black border-white/5 text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Top Up (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEDUCT")}
                    className={`py-1.5 rounded text-xxs font-mono uppercase tracking-wide border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustType === "DEDUCT"
                        ? "bg-red-500/10 border-red-500/40 text-red-400 font-bold"
                        : "bg-black border-white/5 text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" /> Deduct (Debit)
                  </button>
                </div>
              </div>

              {/* Asset Class: USD or STX */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Asset Selection:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAsset("USD")}
                    className={`py-1.5 rounded text-xxs font-mono uppercase tracking-wide border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustAsset === "USD"
                        ? "bg-white/5 border-white/20 text-white font-bold"
                        : "bg-black border-white/5 text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" /> USD Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAsset("STX")}
                    className={`py-1.5 rounded text-xxs font-mono uppercase tracking-wide border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustAsset === "STX"
                        ? "bg-[#e82127]/10 border-red-500/20 text-[#e82127] font-bold"
                        : "bg-black border-white/5 text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" /> Stacks (STX)
                  </button>
                </div>
              </div>

              {/* Amount form input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Adjust Quantity / Value:</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-600 font-mono text-xs">{adjustAsset === "USD" ? "$" : "STX"}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder={adjustAsset === "USD" ? "5000" : "250"}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-black border border-white/10 focus:border-red-500 pl-9 pr-3 py-2 rounded text-xs font-mono text-zinc-100 outline-none"
                    id="admin-adjust-amount-field"
                  />
                </div>
              </div>

              {/* Status Alert logs rendering */}
              {successMsg && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xxs text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xxs text-red-400 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2 bg-red-650 hover:bg-red-500 text-white font-mono text-xs rounded transition uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustType === "TOP_UP" ? "hover:shadow-emerald-500/5" : "hover:shadow-red-500/5"
                }`}
                id="admin-apply-balance-btn"
              >
                {adjustType === "TOP_UP" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                Execute Balance Operation
              </button>
            </form>
          ) : (
            <div className="py-8 text-center text-gray-600 font-mono text-xs">
              Select an account from the left panel to execute adjustments.
            </div>
          )}
        </div>

        {/* COL 3: ASSET HOLDINGS OVERRIDE & INVENTORY */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4.5 space-y-4">
          <h3 className="text-xxs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-[#e82127]" /> Equity Positions Override
          </h3>

          {activeUser ? (
            <form onSubmit={handleApplyHoldingsOverride} className="space-y-4" id="admin-holdings-form">
              {/* Dropdown for Stock symbols */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Target Instrument:</span>
                <select
                  value={stockSymbol}
                  onChange={(e) => setStockSymbol(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-red-500 px-3 py-2 rounded text-xs font-mono text-zinc-100 outline-none"
                  id="admin-override-symbol-select"
                >
                  {Object.keys(stocks).map((sym) => (
                    <option key={sym} value={sym}>
                      {sym} - {stocks[sym].name} (${stocks[sym].price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Displays what the user currently holds for this symbol */}
              <div className="bg-black/45 p-2 rounded border border-white/5 text-[10px] font-mono text-zinc-400">
                <span>Active Holdings: </span>
                <span className="text-zinc-200 font-bold">
                  {activeUser.holdings[stockSymbol]?.units || 0} units
                </span>
                {activeUser.holdings[stockSymbol] && (
                  <span> @ avg ${activeUser.holdings[stockSymbol]?.averagePrice.toFixed(2)}</span>
                )}
              </div>

              {/* Units Input */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">New Units:</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="25"
                    value={stockUnits}
                    onChange={(e) => setStockUnits(e.target.value)}
                    className="w-full bg-black border border-white/10 focus:border-red-500 px-3 py-2 rounded text-xs font-mono text-zinc-100 outline-none"
                    id="admin-override-units-field"
                  />
                  <span className="text-[8px] text-gray-500 font-mono block">Using 0 clears position.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Avg Price ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="195.50"
                    disabled={stockUnits === "0" || stockUnits === ""}
                    value={stockUnits === "0" ? "" : stockAvgPrice}
                    onChange={(e) => setStockAvgPrice(e.target.value)}
                    className="w-full bg-black border border-white/10 disabled:opacity-50 focus:border-red-500 px-3 py-2 rounded text-xs font-mono text-zinc-100 outline-none"
                    id="admin-override-avg-price-field"
                  />
                  <span className="text-[8px] text-gray-500 font-mono block">Cost basis buy rate.</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#e82127]/10 hover:bg-[#e82127]/20 border border-[#e82127]/20 text-white font-mono text-xs rounded uppercase tracking-widest transition font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                id="admin-override-holdings-btn"
              >
                <TrendingUp className="w-4 h-4" />
                Commit Inventory Shift
              </button>
            </form>
          ) : (
            <div className="py-8 text-center text-gray-600 font-mono text-xs">
              Select an account from the left panel to execute adjustments.
            </div>
          )}
        </div>

      </div>

      {/* Safety audit statement */}
      <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-[#e82127] shrink-0 mt-0.5" />
        <div className="text-[10px] font-mono text-gray-400 leading-relaxed">
          <strong className="text-white uppercase">AUTHENTICATED ROOT CONSOLE OVERRIDE:</strong> All actions completed are saved in the browser cache storage database. To create new accounts, use the &quot;Register Profile&quot; modal on the standard investor portal.
        </div>
      </div>
    </div>
  );
}
