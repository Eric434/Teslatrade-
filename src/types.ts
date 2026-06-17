export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  category: "Stock" | "Crypto" | "Virtual";
  color: string;
}

export interface UserHolding {
  symbol: string;
  units: number;
  averagePrice: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  password?: string;
  buyingPower: number; // Cash balance in USD
  holdings: { [symbol: string]: UserHolding };
  stacksAddress: string;
  lastStxBalance: number; // Last verified testnet STX balance
}

export interface TradeActivity {
  id: string;
  userId: string;
  timestamp: string;
  symbol: string;
  type: "BUY" | "SELL" | "DEPOSIT_STX" | "DEPOSIT" | "WITHDRAW" | "SYSTEM";
  amount: number;
  price: number;
  totalUsd: number;
  status: string;
}

export interface MarketState {
  stocks: { [symbol: string]: Stock };
  volatilityMode: "calm" | "normal" | "volatile" | "meme";
  refreshRateMs: number; // interval speed
}
