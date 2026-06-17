import { useState, useEffect, useRef, useMemo } from "react";
import { Stock, UserProfile, TradeActivity, MarketState } from "./types";
import ProfitLossStats from "./components/ProfitLossStats";
import StockChart from "./components/StockChart";
import WalletSync from "./components/WalletSync";
import OrderTicket from "./components/OrderTicket";
import GeminiAdvisor from "./components/GeminiAdvisor";
import UserSwitcher from "./components/UserSwitcher";
import ActivityLog from "./components/ActivityLog";
import AuthScreen from "./components/AuthScreen";
import AdminDashboard from "./components/AdminDashboard";
import { TeslaIcon, TeslaWordmark } from "./components/TeslaLogo";
import CyberOrderBook from "./components/CyberOrderBook";
import AssetLogo from "./components/AssetLogo";
import { Shield, Sparkles, AlertTriangle, Cpu, TrendingUp, RefreshCw, BarChart2, Globe, Briefcase, Coins, LogOut, ShieldAlert, LayoutDashboard, Wallet, History } from "lucide-react";

// Firebase Imports
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

// Preloaded Demo Stocks
const INITIAL_STOCKS: { [symbol: string]: Stock } = {
  TSLA: {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 248.42,
    change: 7.64,
    changePercent: 3.18,
    history: [238, 239.5, 241, 239.2, 243.8, 242.1, 245.9, 248.42],
    category: "Stock",
    color: "#e82127",
  },
  TSLC: {
    symbol: "TSLC",
    name: "Tesla Coin Token",
    price: 6.08,
    change: 0.18,
    changePercent: 3.05,
    history: [5.80, 5.85, 5.92, 5.90, 6.01, 5.95, 6.04, 6.08],
    category: "Crypto",
    color: "#ff3b42",
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin (Linked)",
    price: 67920.00,
    change: 1140.00,
    changePercent: 1.71,
    history: [66500, 67100, 66800, 67250, 67400, 67150, 67600, 67920],
    category: "Crypto",
    color: "#e82127",
  },
  NVDA: {
    symbol: "NVDA",
    name: "Nvidia Corporation",
    price: 226.30,
    change: -2.14,
    changePercent: -0.94,
    history: [229.4, 230.1, 227.5, 228.0, 225.8, 226.9, 228.1, 226.30],
    category: "Stock",
    color: "#10b981",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana Protocol",
    price: 178.94,
    change: 5.12,
    changePercent: 2.95,
    history: [171.2, 173.4, 175.0, 174.2, 176.8, 175.5, 177.0, 178.94],
    category: "Crypto",
    color: "#a855f7",
  },
  SPACEX: {
    symbol: "SPACEX",
    name: "SpaceX Virtual Tracker",
    price: 412.50,
    change: 16.50,
    changePercent: 4.17,
    history: [390, 395.4, 401.1, 398.0, 405.8, 408.2, 404.9, 412.50],
    category: "Virtual",
    color: "#e82127",
  },
};

// Preloaded Profiles
const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: "uid-001",
    username: "ChiefCyberBroker",
    email: "ericwalison2406@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80",
    password: "password123",
    buyingPower: 0.00,
    holdings: {},
    stacksAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    lastStxBalance: 0, // 0 STX
  },
  {
    id: "uid-002",
    username: "StarshipCommander",
    email: "starship@spacex.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80",
    password: "password123",
    buyingPower: 0.00,
    holdings: {},
    stacksAddress: "ST39R27M9NWH1GZNDHNVHVDM1H60R2MGS0YFA21XG",
    lastStxBalance: 0, // 0 STX
  }
];

export default function App() {
  const [stocks, setStocks] = useState<{ [symbol: string]: Stock }>(INITIAL_STOCKS);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("TSLA");
  const [volatility, setVolatility] = useState<"calm" | "normal" | "volatile" | "meme">("normal");
  const [activities, setActivities] = useState<TradeActivity[]>([]);
  const [lastTickDirection, setLastTickDirection] = useState<"UP" | "DOWN" | "STABLE">("STABLE");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<"dashboard" | "trade" | "bridge" | "advisory" | "ledger" | "admin">("dashboard");
  const [dashQuantityStr, setDashQuantityStr] = useState<string>("5");
  const [dashFeedbackOk, setDashFeedbackOk] = useState<string | null>(null);
  const [dashFeedbackErr, setDashFeedbackErr] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"symbol" | "value" | "pl" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Keep a reference to profiles and index reference to avoid closures
  const profilesRef = useRef<UserProfile[]>([]);

  // 1. Initial mounting and loading database and local backups
  useEffect(() => {
    const initData = async () => {
      let isDbLoaded = false;
      let loadedProfiles: UserProfile[] = [];
      let loadedActivities: TradeActivity[] = [];

      // A. Securely Authenticate anonymously with Firebase Auth
      try {
        await signInAnonymously(auth);
        console.log("Firebase Auth signed in anonymously successfully.");
      } catch (authErr) {
        console.warn("Firebase Auth anonymous login failed:", authErr);
      }

      // B. Load Profiles & Activities from postgres dynamic database
      try {
        console.log("Fetching persistent profiles and activities from database...");
        const res = await fetch("/api/db-data");
        if (res.ok) {
          const data = await res.json();
          if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
            loadedProfiles = data.profiles;
            loadedActivities = data.activities || [];
            isDbLoaded = true;
            console.log("Database data loaded successfully:", loadedProfiles.length, "profiles,", loadedActivities.length, "activities.");
          }
        }
      } catch (e) {
        console.warn("Neon DB query offline, resorting to client backup registry:", e);
      }

      // C. Fallback: Pull from Firebase Firestore database
      if (!isDbLoaded && auth.currentUser) {
        try {
          console.log("Attempting to load backup data from Firebase Firestore...");
          const profSnapshot = await getDocs(collection(db, "user_profiles"));
          const fbProfiles: UserProfile[] = [];
          profSnapshot.forEach((docSnap) => {
            fbProfiles.push(docSnap.data() as UserProfile);
          });

          if (fbProfiles.length > 0) {
            loadedProfiles = fbProfiles;
            
            const actSnapshot = await getDocs(collection(db, "trade_activities"));
            const fbActs: TradeActivity[] = [];
            actSnapshot.forEach((docSnap) => {
              fbActs.push(docSnap.data() as TradeActivity);
            });
            loadedActivities = fbActs;
            
            isDbLoaded = true;
            console.log("Firebase Firestore data loaded successfully:", fbProfiles.length, "profiles.");
          }
        } catch (fsErr) {
          console.error("Firebase Firestore fetch error or permissions blocked:", fsErr);
        }
      }

      if (!isDbLoaded) {
        // Load profiles
        const savedProfiles = localStorage.getItem("tesla_invest_profiles");
        if (savedProfiles) {
          try {
            const parsed = JSON.parse(savedProfiles);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedProfiles = parsed;
            } else {
              loadedProfiles = DEFAULT_PROFILES;
            }
          } catch (e) {
            loadedProfiles = DEFAULT_PROFILES;
          }
        } else {
          loadedProfiles = DEFAULT_PROFILES;
        }

        // Load custom log activities
        const savedActivities = localStorage.getItem("tesla_invest_activities");
        if (savedActivities) {
          try {
            loadedActivities = JSON.parse(savedActivities);
          } catch (e) {
            loadedActivities = [];
          }
        }
      }

      setProfiles(loadedProfiles);
      profilesRef.current = loadedProfiles;
      setActivities(loadedActivities);

      // Set active profile ID & authentication status
      const authenticatedUid = localStorage.getItem("tesla_invest_authenticated_uid");
      if (authenticatedUid) {
        setIsAuthenticated(true);
        setActiveProfileId(authenticatedUid);
        if (authenticatedUid === "admin-uid") {
          setIsAdmin(true);
          setCurrentPage("admin");
        } else {
          setIsAdmin(false);
        }
      } else {
        const activeId = localStorage.getItem("tesla_invest_active_id") || (loadedProfiles[0] ? loadedProfiles[0].id : DEFAULT_PROFILES[0].id);
        setActiveProfileId(activeId);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    initData();
  }, []);

  // Synchronize profiles changes to Neon database and Firebase Firestore
  useEffect(() => {
    if (profiles.length === 0) return;
    const syncDbProfiles = async () => {
      // 1. Sync to Postgres API
      try {
        await fetch("/api/sync-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profiles }),
        });
        localStorage.setItem("tesla_invest_profiles", JSON.stringify(profiles));
      } catch (err) {
        console.error("Failed to sync profiles to Postgres DB:", err);
      }

      // 2. Sync to Firebase Firestore
      if (auth.currentUser) {
        for (const p of profiles) {
          if (p.id === "admin-uid") continue;
          try {
            await setDoc(doc(db, "user_profiles", p.id), {
              id: p.id,
              username: p.username,
              email: p.email || `${p.username.toLowerCase()}@client.net`,
              avatar: p.avatar || "",
              password: p.password || "password123",
              buyingPower: Number(p.buyingPower || 0),
              holdings: p.holdings || {},
              stacksAddress: p.stacksAddress || "",
              lastStxBalance: Number(p.lastStxBalance || 0),
            });
          } catch (fsErr) {
            handleFirestoreError(fsErr, OperationType.WRITE, `user_profiles/${p.id}`);
          }
        }
      }
    };
    syncDbProfiles();
  }, [profiles]);

  // Synchronize activities changes to Neon database and Firebase Firestore
  useEffect(() => {
    if (activities.length === 0) return;
    const syncDbActivities = async () => {
      // 1. Sync to Postgres API
      try {
        await fetch("/api/sync-activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activities }),
        });
        localStorage.setItem("tesla_invest_activities", JSON.stringify(activities));
      } catch (err) {
        console.error("Failed to sync activities to Postgres DB:", err);
      }

      // 2. Sync to Firebase Firestore
      if (auth.currentUser) {
        for (const act of activities) {
          try {
            await setDoc(doc(db, "trade_activities", act.id), {
              id: act.id,
              userId: act.userId,
              symbol: act.symbol,
              type: act.type,
              amount: Number(act.amount || 0),
              price: Number(act.price || 0),
              totalUsd: Number(act.totalUsd || 0),
              timestamp: act.timestamp,
              status: act.status,
            });
          } catch (fsErr) {
            handleFirestoreError(fsErr, OperationType.WRITE, `trade_activities/${act.id}`);
          }
        }
      }
    };
    syncDbActivities();
  }, [activities]);

  // 2. Continuous Real-time stock fluctuations simulator loop
  useEffect(() => {
    const handleFluctuations = () => {
      setStocks((prev) => {
        const next = { ...prev };
        let directionAssessor = 0;

        Object.keys(next).forEach((sym) => {
          const s = { ...next[sym] };
          const basePrice = s.price;
          
          let drift = 0;
          let randomFactor = (Math.random() - 0.5);

          // Configure market volatility drift ranges
          if (volatility === "calm") {
            drift = (Math.random() - 0.49) * 0.05; // tiny micro drifts
          } else if (volatility === "normal") {
            drift = (Math.random() - 0.485) * 0.18; // healthy trending
          } else if (volatility === "volatile") {
            drift = (Math.random() - 0.5) * 1.80; // wide leaps
          } else if (volatility === "meme") {
            // High octane multipliers
            drift = (Math.random() - 0.47) * 8.50; 
          }

          const newPrice = Math.max(0.5, basePrice + drift);
          s.price = newPrice;
          s.change = newPrice - s.history[0]; // relative to start of history
          s.changePercent = (s.change / s.history[0]) * 100;
          
          // Rotate history buffer
          const updatedHistory = [...s.history];
          updatedHistory.push(newPrice);
          if (updatedHistory.length > 15) {
            updatedHistory.shift();
          }
          s.history = updatedHistory;
          next[sym] = s;

          directionAssessor += drift;
        });

        if (directionAssessor > 1) {
          setLastTickDirection("UP");
        } else if (directionAssessor < -1) {
          setLastTickDirection("DOWN");
        } else {
          setLastTickDirection("STABLE");
        }

        return next;
      });
    };

    const interval = setInterval(handleFluctuations, 2800);
    return () => clearInterval(interval);
  }, [volatility]);

  // Current active profile getter
  const currentProfile = useMemo(() => {
    if (activeProfileId === "admin-uid" || isAdmin) {
      return {
        id: "admin-uid",
        username: "System Root Master",
        email: "master@admin.com",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&fit=crop&q=80",
        password: "Mama4you@",
        buyingPower: 10000000,
        holdings: {},
        stacksAddress: "ST-ADMIN-RESERVE-NODE-PORTAL",
        lastStxBalance: 100000,
      } as UserProfile;
    }
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, activeProfileId, isAdmin]);

  // Profile switches
  const handleSelectProfile = (profile: UserProfile) => {
    setActiveProfileId(profile.id);
    setIsAdmin(false);
    localStorage.setItem("tesla_invest_active_id", profile.id);
    localStorage.setItem("tesla_invest_authenticated_uid", profile.id);
  };

  // Registering new account (with optional password security)
  const handleCreateProfile = (username: string, initialFund: number, password?: string) => {
    const avatars = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80",
    ];
    const avatar = avatars[profiles.length % avatars.length];

    const newProfile: UserProfile = {
      id: "uid-" + Math.random().toString(36).substring(2, 11),
      username,
      email: `${username.toLowerCase()}@client.net`,
      avatar,
      password: password || "password123",
      buyingPower: initialFund,
      holdings: {},
      stacksAddress: "",
      lastStxBalance: 0
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    profilesRef.current = updated;
    localStorage.setItem("tesla_invest_profiles", JSON.stringify(updated));
    setActiveProfileId(newProfile.id);
    localStorage.setItem("tesla_invest_active_id", newProfile.id);
    
    // Automatically authenticate registered user
    setIsAdmin(false);
    setIsAuthenticated(true);
    localStorage.setItem("tesla_invest_authenticated_uid", newProfile.id);
  };

  const handleLogin = (profileId: string) => {
    setActiveProfileId(profileId);
    if (profileId === "admin-uid") {
      setIsAdmin(true);
      setCurrentPage("admin");
    } else {
      setIsAdmin(false);
      localStorage.setItem("tesla_invest_active_id", profileId);
    }
    setIsAuthenticated(true);
    localStorage.setItem("tesla_invest_authenticated_uid", profileId);
  };

  const handleLogOut = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentPage("dashboard");
    localStorage.removeItem("tesla_invest_authenticated_uid");
  };

  // Safe updates to cash or Stacks balances in active profile
  const handleUpdatePower = (nextUSD: number, nextStx: number) => {
    const updated = profiles.map((p) => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          buyingPower: nextUSD,
          lastStxBalance: nextStx,
        };
      }
      return p;
    });
    setProfiles(updated);
    profilesRef.current = updated;
    localStorage.setItem("tesla_invest_profiles", JSON.stringify(updated));
  };

  // Admin Module: Modify balance of any specified user
  const handleAdminUpdatePower = (profileId: string, nextUSD: number, nextStx: number) => {
    const updated = profiles.map((p) => {
      if (p.id === profileId) {
        return {
          ...p,
          buyingPower: nextUSD,
          lastStxBalance: nextStx,
        };
      }
      return p;
    });
    setProfiles(updated);
    profilesRef.current = updated;
    localStorage.setItem("tesla_invest_profiles", JSON.stringify(updated));
  };

  // Admin Module: Modify stock/crypto holdings of any specified user
  const handleAdminUpdateHoldings = (profileId: string, symbol: string, units: number, averagePrice: number) => {
    const updated = profiles.map((p) => {
      if (p.id === profileId) {
        const holdings = { ...p.holdings };
        if (units <= 0) {
          delete holdings[symbol];
        } else {
          holdings[symbol] = {
            symbol,
            units,
            averagePrice,
          };
        }
        return {
          ...p,
          holdings,
        };
      }
      return p;
    });
    setProfiles(updated);
    profilesRef.current = updated;
    localStorage.setItem("tesla_invest_profiles", JSON.stringify(updated));
  };

  // Admin Module: Terminate and delete user credential registration
  const handleAdminDeleteUser = (profileId: string) => {
    if (profiles.length <= 1) {
      alert("Verification Error: Admin cannot delete the singular remaining profile.");
      return;
    }
    const updated = profiles.filter((p) => p.id !== profileId);
    setProfiles(updated);
    profilesRef.current = updated;
    localStorage.setItem("tesla_invest_profiles", JSON.stringify(updated));
    if (activeProfileId === profileId) {
      const nextActive = updated[0];
      setActiveProfileId(nextActive.id);
      localStorage.setItem("tesla_invest_active_id", nextActive.id);
    }
  };

  // Add custom execution logging to ledger
  const handleAddActivity = (action: Omit<TradeActivity, "id" | "userId" | "timestamp">) => {
    const newAct: TradeActivity = {
      ...action,
      id: "tx-" + Math.random().toString(36).substring(2, 11),
      userId: activeProfileId,
      timestamp: new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    };

    const updated = [...activities, newAct];
    setActivities(updated);
    localStorage.setItem("tesla_invest_activities", JSON.stringify(updated));
  };

  // Admin Module: Append ledger activity for specified target account
  const handleAdminAddActivity = (userId: string, action: { symbol: string; type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW" | "SYSTEM"; amount: number; price: number; totalUsd: number; status: string }) => {
    const newAct: TradeActivity = {
      ...action,
      id: "tx-" + Math.random().toString(36).substring(2, 11),
      userId,
      timestamp: new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    };

    const updated = [...activities, newAct];
    setActivities(updated);
    localStorage.setItem("tesla_invest_activities", JSON.stringify(updated));
  };

  // Trade submission handler (BUY / SELL positions)
  const handleExecuteTrade = (
    type: "BUY" | "SELL",
    symbol: string,
    quantity: number,
    price: number,
    totalUsd: number
  ) => {
    const updatedProfiles = profiles.map((p) => {
      if (p.id !== activeProfileId) return p;

      const profile = { ...p };
      const holdings = { ...profile.holdings };
      const currentHolding = holdings[symbol] || { symbol, units: 0, averagePrice: 0 };

      if (type === "BUY") {
        // Calculate dynamic weighted average price
        const totalUnits = currentHolding.units + quantity;
        const totalWeightCost = currentHolding.units * currentHolding.averagePrice + quantity * price;
        const nextAverage = totalUnits > 0 ? totalWeightCost / totalUnits : price;

        holdings[symbol] = {
          symbol,
          units: totalUnits,
          averagePrice: nextAverage,
        };
        profile.buyingPower -= totalUsd;
      } else {
        const nextUnits = Math.max(0, currentHolding.units - quantity);
        if (nextUnits === 0) {
          delete holdings[symbol];
        } else {
          holdings[symbol] = {
            ...currentHolding,
            units: nextUnits,
          };
        }
        profile.buyingPower += totalUsd;
      }

      profile.holdings = holdings;
      return profile;
    });

    setProfiles(updatedProfiles);
    profilesRef.current = updatedProfiles;
    localStorage.setItem("tesla_invest_profiles", JSON.stringify(updatedProfiles));

    // Append to transactions ledger
    handleAddActivity({
      symbol,
      type,
      amount: quantity,
      price,
      totalUsd,
      status: "FILLED",
    });
  };

  // Precompute type-safe holdings helper variables
  const activeHoldings = Object.keys(currentProfile?.holdings || {})
    .map((key) => currentProfile.holdings[key])
    .filter((h): h is NonNullable<typeof h> => !!h && h.units > 0);

  const sortedHoldings = useMemo(() => {
    const list = [...activeHoldings];
    if (!sortField) return list;

    return list.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      if (sortField === "symbol") {
        valA = a.symbol;
        valB = b.symbol;
      } else if (sortField === "value") {
        const stockA = stocks[a.symbol];
        const stockB = stocks[b.symbol];
        valA = a.units * (stockA?.price || 0);
        valB = b.units * (stockB?.price || 0);
      } else if (sortField === "pl") {
        const stockA = stocks[a.symbol];
        const stockB = stocks[b.symbol];
        const priceA = stockA?.price || 0;
        const priceB = stockB?.price || 0;
        valA = (a.units * priceA) - (a.units * a.averagePrice);
        valB = (b.units * priceB) - (b.units * b.averagePrice);
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });
  }, [activeHoldings, sortField, sortDirection, stocks]);

  const totalEquitiesValue = activeHoldings.reduce((sum, h) => {
    const livePrice = stocks[h.symbol]?.price || 0;
    return sum + h.units * livePrice;
  }, 0);

  if (!isAuthenticated) {
    return (
      <AuthScreen
        allProfiles={profiles.length > 0 ? profiles : DEFAULT_PROFILES}
        onLogin={handleLogin}
        onCreateProfileWithPassword={handleCreateProfile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans select-scrollbar" id="tesla-app-root">
      {/* Top Cybernetic Nav Header */}
      <header className="border-b border-white/10 bg-[#111111] p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-900/60 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shrink-0 p-1.5">
              <TeslaIcon className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TeslaWordmark className="h-4.5" />
                <span className="text-white font-mono bg-[#e82127] text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase shadow-sm">
                  TRADE
                </span>
                <span className="text-zinc-500 font-mono text-[8px] border border-white/10 px-1.5 py-0.5 rounded uppercase">
                  v2.8
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[9px] font-mono text-zinc-400 tracking-wider">
                  STX SECURE NODE // STABLE ORACLE ONLINE
                </span>
              </div>
            </div>
          </div>

          {/* Quick Realtime System Counters */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xxs font-mono">
            {/* Volatility Setting */}
            <div className="bg-black border border-white/5 p-1.5 px-3 rounded flex items-center gap-2">
              <span className="text-gray-500 uppercase">Fluctuation:</span>
              <div className="flex gap-1">
                {(["calm", "normal", "volatile", "meme"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setVolatility(mode)}
                    className={`px-1 rounded text-[9px] uppercase font-bold transition cursor-pointer ${
                      volatility === mode
                        ? "bg-[#e82127]/20 border border-[#e82127]/40 text-red-400"
                        : "text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Oracle health */}
            <div className={`hidden md:flex p-1.5 px-3 rounded select-none items-center gap-1.5 border ${
              lastTickDirection === "UP" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : lastTickDirection === "DOWN"
                  ? "bg-[#e82127]/10 border-[#e82127]/20 text-red-400"
                  : "bg-black border-white/5 text-gray-500"
            }`}>
              <BarChart2 className="w-3.5 h-3.5 shrink-0" />
              <span className="uppercase font-semibold text-[9px]">
                {lastTickDirection === "UP" ? "Market Surging" : lastTickDirection === "DOWN" ? "Market Dipping" : "Market Sidelining"}
              </span>
            </div>
            
            {/* Net connection */}
            <div className="bg-black border border-white/5 p-1.5 px-3 rounded flex items-center gap-1.5 text-zinc-400">
              <Globe className="w-3.5 h-3.5 text-[#e82127] shrink-0" />
              <span className="uppercase font-semibold text-[9px] tracking-wider text-gray-300">STX NODE LINKED</span>
            </div>

            {/* Firestore Cloud Sync connection */}
            <div className="bg-orange-500/5 border border-orange-500/20 p-1.5 px-3 rounded flex items-center gap-1.5 text-orange-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <span className="uppercase font-semibold text-[9px] tracking-wider font-mono">FIRESTORE CLOUD ACTIVE</span>
            </div>

            {/* Lock Terminal Logout controls */}
            <button
              onClick={handleLogOut}
              className="bg-[#e82127]/10 hover:bg-[#e82127] border border-[#e82127]/20 hover:border-[#e82127] p-1.5 px-3 rounded flex items-center gap-1.5 text-red-400 hover:text-white transition duration-150 cursor-pointer font-bold font-mono tracking-wider text-[9px] uppercase"
              id="terminal-logout-btn"
              title="Lock and sign out of terminal"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Lock Terminal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Subheader for separate pages (Desktop & Mobile Scrollable layout) */}
      <div className="border-b border-white/5 bg-[#0f0f0f] sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-4 py-2 whitespace-nowrap overflow-x-auto select-scrollbar scrollbar-none">
            <nav className="flex gap-1.5 md:gap-2">
              {[
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { id: "trade", label: "Terminal Trade", icon: TrendingUp },
                { id: "bridge", label: "Liquidity Bridge", icon: Wallet },
                { id: "advisory", label: "Advisory Node", icon: Sparkles },
                { id: "ledger", label: "System Ledger", icon: History },
                ...(isAdmin ? [{ id: "admin", label: "Admin Portal", icon: ShieldAlert, highlight: true }] : [])
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = currentPage === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentPage(tab.id as any)}
                    className={`h-10 px-3 md:px-4 rounded-lg flex items-center gap-2 text-[10px] md:text-xxs font-bold tracking-wider uppercase transition duration-150 cursor-pointer border ${
                      isActive
                        ? tab.highlight
                          ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                          : "bg-[#e82127]/15 border-[#e82127]/40 text-white"
                        : tab.highlight
                          ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 hover:border-amber-500/30 text-amber-500/80 hover:text-amber-400"
                          : "bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                    id={`nav-tab-${tab.id}`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${tab.highlight && !isActive ? "animate-pulse" : ""}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Micro display for current profile */}
            {currentProfile && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 shrink-0">
                <img
                  src={currentProfile.avatar}
                  className="w-4 h-4 rounded-full border border-white/20 object-cover"
                  alt=""
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] font-mono text-zinc-400">
                  Active Broker: <span className="text-[#e82127] font-bold">{currentProfile.username}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Render separate pages/tabs based on current state */}
        {currentPage === "dashboard" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Profit & Loss Stats Banner */}
            {currentProfile && (
              <ProfitLossStats userProfile={currentProfile} stocks={stocks} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Interactive Candlestick StockChart, Orders execution Desk, and Asset holdings */}
              <div className="lg:col-span-2 space-y-6">
                <StockChart stock={stocks[selectedSymbol] || stocks.TSLA} />

                {/* Stunning Dashboard Order Execution Desk (Reb, Akay, Sefl mockup) */}
                <div className="bg-[#0d0f19] border border-[#1e2338] p-5 rounded-xl shadow-2xl space-y-4" id="dashboard-trade-desk">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase">
                        EXECUTIVE DESK // TERMINAL LIQUIDITY
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                      SECURED BROKER AUTO-CLEARING
                    </span>
                  </div>

                  {dashFeedbackOk && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xxs font-mono rounded-lg animate-fadeIn">
                      {dashFeedbackOk}
                    </div>
                  )}

                  {dashFeedbackErr && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xxs font-mono rounded-lg animate-fadeIn">
                      {dashFeedbackErr}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    {/* Price Input Field */}
                    <div>
                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                        Symbol Rate (REB)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-500 text-xs font-mono font-bold">$</span>
                        <input
                          type="text"
                          value={(stocks[selectedSymbol]?.price || 0).toFixed(2)}
                          disabled
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 pl-7 text-xs font-mono text-zinc-400 font-bold"
                          title="Rate adjusts via decentralized Oracle"
                        />
                      </div>
                    </div>

                    {/* Amount Input Field */}
                    <div>
                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                        Size / Amount (QASOLY)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          placeholder="0"
                          value={dashQuantityStr}
                          onChange={(e) => setDashQuantityStr(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 focus:border-[#e82127]/50 rounded-lg p-2.5 text-xs font-mono text-white font-bold outline-none"
                        />
                      </div>
                    </div>

                    {/* Total Value */}
                    <div>
                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                        Est. Credit Value (VELUH)
                      </label>
                      <div className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-zinc-300 font-bold flex justify-between items-center">
                        <span>
                          ${((parseFloat(dashQuantityStr) || 0) * (stocks[selectedSymbol]?.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] text-[#e82127] font-semibold bg-[#e82127]/10 px-1.5 py-0.5 rounded uppercase">
                          USD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buy / Sell Buttons designed 100% like the Buy / Sell button layers *Akay* & *Sefl* in the reference image */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    {/* Akay / Buy button */}
                    <button
                      onClick={() => {
                        const qty = parseFloat(dashQuantityStr) || 0;
                        const price = stocks[selectedSymbol]?.price || 0;
                        const total = qty * price;
                        if (qty <= 0) {
                          setDashFeedbackErr("Validation Error: Amount must be greater than 0");
                          setTimeout(() => setDashFeedbackErr(null), 4000);
                          return;
                        }
                        if (total > (currentProfile?.buyingPower || 0)) {
                          setDashFeedbackErr("Limits exceeded: Insufficient buying power cash");
                          setTimeout(() => setDashFeedbackErr(null), 4000);
                          return;
                        }
                        handleExecuteTrade("BUY", selectedSymbol, qty, price, total);
                        setDashFeedbackOk(`✔ SUCCESSFUL PURCHASE FILLED: Acquired ${qty} units of ${selectedSymbol} at $${price.toFixed(2)}.`);
                        setTimeout(() => setDashFeedbackOk(null), 6000);
                      }}
                      className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/20 rounded-lg font-mono font-bold text-xs uppercase tracking-widest transition duration-150 cursor-pointer text-center relative overflow-hidden shadow-lg active:scale-95"
                    >
                      BUY NOW (AKAY)
                    </button>

                    {/* Sefl / Sell button */}
                    <button
                      onClick={() => {
                        const qty = parseFloat(dashQuantityStr) || 0;
                        const price = stocks[selectedSymbol]?.price || 0;
                        const total = qty * price;
                        const currentUnits = currentProfile?.holdings[selectedSymbol]?.units || 0;
                        if (qty <= 0) {
                          setDashFeedbackErr("Validation Error: Amount must be greater than 0");
                          setTimeout(() => setDashFeedbackErr(null), 4000);
                          return;
                        }
                        if (qty > currentUnits) {
                          setDashFeedbackErr(`Limits exceeded: You only own ${currentUnits.toFixed(2)} units of ${selectedSymbol}`);
                          setTimeout(() => setDashFeedbackErr(null), 4000);
                          return;
                        }
                        handleExecuteTrade("SELL", selectedSymbol, qty, price, total);
                        setDashFeedbackOk(`✔ SUCCESSFUL LIQUIDATION FILLED: Disposed of ${qty} units of ${selectedSymbol} at $${price.toFixed(2)}.`);
                        setTimeout(() => setDashFeedbackOk(null), 6000);
                      }}
                      className="py-3 bg-[#e82127] hover:bg-red-500 text-white border border-[#e82127]/20 rounded-lg font-mono font-bold text-xs uppercase tracking-widest transition duration-150 cursor-pointer text-center relative overflow-hidden shadow-lg active:scale-95"
                    >
                      SELL NOW (SEFL)
                    </button>
                  </div>
                </div>

                {/* Holdings table */}
                <div className="bg-[#0d0f19] border border-[#1e2338] p-5 rounded-xl shadow-2xl space-y-4" id="portfolio-holdings-panel">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#e82127]/10 rounded-lg text-[#e82127]">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-sm font-sans font-bold text-zinc-100 tracking-tight uppercase">Secured Positions</h2>
                          <span 
                            className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-mono font-bold tracking-widest rounded uppercase cursor-help"
                            title="Row Level Security (RLS) active. Vault databases are isolated locally to your unique user terminal key (UID)."
                          >
                            RLS SECURED
                          </span>
                        </div>
                        <p className="text-xxs font-mono text-gray-500 uppercase tracking-widest">REALTIME ACCOUNT LEDGER DATA</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-zinc-500 block">TOTAL EQUITIES VALUE</span>
                      <span className="text-sm font-mono font-bold text-zinc-200" id="equities-balance-count">
                        ${totalEquitiesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
 
                  <div className="overflow-x-auto select-scrollbar">
                    <table className="w-full text-left border-collapse" id="holdings-table font-sans">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] font-mono text-gray-500 tracking-wider uppercase">
                          <th 
                            className="pb-2 py-1 cursor-pointer select-none hover:text-white transition duration-150"
                            onClick={() => {
                              if (sortField === "symbol") {
                                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                              } else {
                                setSortField("symbol");
                                setSortDirection("asc");
                              }
                            }}
                          >
                            <span className="flex items-center gap-1">
                              Symbol {sortField === "symbol" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                            </span>
                          </th>
                          <th className="pb-2 text-right">Units owned</th>
                          <th className="pb-2 text-right">Entry average</th>
                          <th className="pb-2 text-right">Current Price</th>
                          <th 
                            className="pb-2 text-right cursor-pointer select-none hover:text-white transition duration-150"
                            onClick={() => {
                              if (sortField === "value") {
                                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                              } else {
                                setSortField("value");
                                setSortDirection("desc");
                              }
                            }}
                          >
                            <span className="flex items-center justify-end gap-1">
                              Portfolio Value {sortField === "value" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                            </span>
                          </th>
                          <th 
                            className="pb-2 text-right cursor-pointer select-none hover:text-white transition duration-150"
                            onClick={() => {
                              if (sortField === "pl") {
                                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                              } else {
                                setSortField("pl");
                                setSortDirection("desc");
                              }
                            }}
                          >
                            <span className="flex items-center justify-end gap-1">
                              P&L (Total Yield) {sortField === "pl" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs font-mono">
                        {sortedHoldings.length > 0 ? (
                          sortedHoldings.map((hold) => {
                            const stock = stocks[hold.symbol];
                            if (!stock) return null;
                            const currentVal = hold.units * stock.price;
                            const costBasis = hold.units * hold.averagePrice;
                            const plUsd = currentVal - costBasis;
                            const plPercent = costBasis > 0 ? (plUsd / costBasis) * 100 : 0;
                            const isUp = plUsd >= 0;
 
                            return (
                              <tr
                                key={hold.symbol}
                                onClick={() => {
                                  setSelectedSymbol(hold.symbol);
                                }}
                                className={`hover:bg-white/5 cursor-pointer transition ${
                                  selectedSymbol === hold.symbol ? "bg-[#e82127]/5 border-l-2 border-[#e82127]" : ""
                                }`}
                              >
                                <td className="py-3 flex items-center gap-2.5">
                                  <AssetLogo symbol={hold.symbol} className="w-5 h-5 rounded shrink-0 border border-white/5 bg-black/40" />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-zinc-100">{hold.symbol}</span>
                                    <span className="text-[9px] text-gray-500 tracking-normal hidden md:inline truncate max-w-28 mt-0.5">
                                      {stock.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 text-right text-zinc-200">
                                  {hold.units.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </td>
                                <td className="py-3 text-right text-zinc-400">
                                  ${hold.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 text-right text-zinc-200 font-semibold">
                                  ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 text-right text-zinc-200 font-bold">
                                  ${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className={`py-3 text-right font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                                  {isUp ? "+" : ""}${plUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  <span className="block text-[10px] font-normal">
                                    ({isUp ? "+" : ""}{plPercent.toFixed(2)}%)
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500 font-sans text-xs">
                              Your secured portfolio is empty. Receive a free STX deposit or use the Bridge page to load buying power!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
 
              {/* Right Column: Cyber Order Book ("Coder Bock"), Switching Profiles/Broker Hub & quick advisor */}
              <div className="space-y-6">
                {/* Active Order Book panel matching the reference screenshot */}
                {currentProfile && (
                  <CyberOrderBook
                    stock={stocks[selectedSymbol] || stocks.TSLA}
                    recentTrades={activities.filter((act) => (act.type === "BUY" || act.type === "SELL") && act.userId === activeProfileId)}
                  />
                )}

                <UserSwitcher
                  currentProfile={currentProfile}
                  allProfiles={profiles}
                  onSelectProfile={handleSelectProfile}
                  onCreateProfile={handleCreateProfile}
                />

                {/* Mini quick tip advisory promo */}
                <div className="bg-[#0d0f19] border border-[#1e2338] p-5 rounded-xl space-y-3 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#e82127]/15 rounded-lg text-[#e82127]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-widest">Advisory Node Online</h3>
                  </div>
                  <p className="text-xxs text-gray-400 font-sans leading-relaxed">
                    Need neural network allocation advice? Our secure Gemini models analyze your assets and recommend high-conviction adjustment strategies instantly.
                  </p>
                  <button
                    onClick={() => setCurrentPage("advisory")}
                    className="w-full py-2 bg-[#e82127]/10 hover:bg-[#e82127] hover:text-white border border-[#e82127]/25 hover:border-transparent rounded text-xxs font-mono uppercase tracking-wider transition font-bold cursor-pointer text-center block"
                  >
                    Launch AI Advisor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === "trade" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Left and Middle Columns: Stocks List & Price ticker, plus trade execution log history */}
            <div className="lg:col-span-2 space-y-6">
              {/* Live stock asset listing panel */}
              <div className="bg-[#141414] border border-white/5 p-5 rounded-xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-sans font-semibold text-zinc-200">Terminal Asset Ledger</h2>
                      <p className="text-xxs font-mono text-gray-500">LIVE ORACLE VALUES & SYSTEM INDEX</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                    Market Mode: {volatility.toUpperCase()}
                  </span>
                </div>

                <p className="text-xxs text-gray-400 font-sans leading-relaxed">
                  Click on any ticker symbol below to select the assets you wish to execute buy/sell orders for inside the Order Ticket portal:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
                  {(Object.values(stocks) as Stock[]).map((stock) => {
                    const isUp = stock.changePercent >= 0;
                    const isSelected = selectedSymbol === stock.symbol;
                    const profileHolding = currentProfile?.holdings[stock.symbol]?.units || 0;

                    return (
                      <button
                        key={stock.symbol}
                        onClick={() => setSelectedSymbol(stock.symbol)}
                        className={`p-4 rounded-xl text-left border transition relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer ${
                          isSelected
                            ? "bg-[#e82127]/10 border-[#e82127]/40 shadow-lg"
                            : "bg-black/30 hover:bg-black/60 border-white/5"
                        }`}
                        id={`trade-stock-ticker-${stock.symbol}`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-start gap-2.5">
                            <AssetLogo symbol={stock.symbol} className="w-8 h-8 rounded-lg shrink-0 border border-white/5 bg-black/40" />
                            <div>
                              <div className="flex items-center gap-1.5 font-sans">
                                <span className="text-xs font-mono font-black text-zinc-100">{stock.symbol}</span>
                                <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[100px]">{stock.name}</span>
                              </div>
                              <span className="text-[9px] font-mono text-gray-500 uppercase block mt-0.5">{stock.category}</span>
                            </div>
                          </div>
                          
                          {profileHolding > 0 && (
                            <span className="bg-[#e82127]/10 border border-[#e82127]/20 text-zinc-350 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase text-[#e82127]">
                              Holding: {profileHolding.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-end w-full">
                          <div>
                            <span className="text-[9px] font-mono text-gray-500 uppercase block">Rate (USD)</span>
                            <span className="text-sm font-mono font-extrabold text-white block">
                              ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className={`text-right font-mono text-xxs font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                            <span>{isUp ? "▲ +" : "▼ "}{stock.changePercent.toFixed(2)}%</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-[#e82127] rounded-bl" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transactions list specifically for trading */}
              <div className="bg-[#141414] border border-white/5 p-5 rounded-xl shadow-2xl">
                <h3 className="text-xs font-mono font-bold text-zinc-150 uppercase tracking-wider mb-3">Trades & Order Executions</h3>
                <ActivityLog activities={activities.filter((a) => a.userId === activeProfileId && (a.type === "BUY" || a.type === "SELL"))} />
              </div>
            </div>

            {/* Right Column: Order submission card */}
            <div className="space-y-6">
              <OrderTicket
                userProfile={currentProfile}
                stocks={stocks}
                onSelectedStockChange={(sym) => setSelectedSymbol(sym)}
                selectedSymbol={selectedSymbol}
                onExecuteTrade={handleExecuteTrade}
              />
            </div>
          </div>
        )}

        {currentPage === "bridge" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Left/Middle: Wallet Sync Core */}
            <div className="lg:col-span-2 space-y-6">
              <WalletSync
                userProfile={currentProfile}
                onUpdatePower={handleUpdatePower}
                onAddActivity={handleAddActivity}
              />
            </div>

            {/* Right: Informational Bridge Panel */}
            <div className="space-y-6">
              <div className="bg-[#141414] border border-white/5 p-5 rounded-xl shadow-2xl space-y-4">
                <h3 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#e82127]" /> Stacks Bridge Node
                </h3>
                <p className="text-xxs text-gray-400 font-sans leading-relaxed">
                  Our full-stack gateway facilitates deep liquidity bridge settlements. Connecting a simulated Stacks testnet address triggers automatic wallet-tracking, importing connected STX balances to use for instant dollar conversions.
                </p>
                <div className="p-3 bg-black rounded border border-white/5 text-xxs font-mono space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">STX Converter rate:</span>
                    <span className="text-zinc-200">1 STX = $2.50 USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Security Standard:</span>
                    <span className="text-emerald-400 font-bold uppercase">Clarity VM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bridging Commissions:</span>
                    <span className="text-emerald-400 font-bold">0% (Sponsor link)</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed leading-relaxed bg-white/5 p-2.5 rounded border border-white/5">
                  🛡️ <strong>Skeptical of demo bounds?</strong> Any linked STX wallet balance acts as your bridge source. Deposit as much STX as you like to safely increase your USD buying power on the fly!
                </p>
              </div>

              {/* Transactions list specifically for bridge transactions */}
              <div className="bg-[#141414] border border-white/5 p-5 rounded-xl shadow-2xl">
                <h3 className="text-xs font-mono font-bold text-zinc-150 uppercase tracking-wider mb-2">Bridge Logs</h3>
                <ActivityLog activities={activities.filter((a) => a.userId === activeProfileId && (a.type === "DEPOSIT" || a.type === "WITHDRAW" || a.symbol === "STX"))} />
              </div>
            </div>
          </div>
        )}

        {currentPage === "advisory" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <GeminiAdvisor userProfile={currentProfile} stocks={stocks} />
          </div>
        )}

        {currentPage === "ledger" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-[#141414] border border-white/5 p-6 rounded-xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 rounded-lg text-[#e82127] border border-white/5">
                    <History className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-sans font-semibold text-zinc-100">Cryptographic Systems Ledger</h2>
                    <p className="text-xxs font-mono text-gray-500">HISTORICAL TRADES & KEY BLOCKCHAIN BRIDGE DEPOSITS</p>
                  </div>
                </div>
                
                <span className="font-mono text-xxs bg-white/5 px-2.5 py-1 rounded text-zinc-400">
                  Logs Count: {activities.filter((a) => a.userId === activeProfileId).length}
                </span>
              </div>
              
              <ActivityLog activities={activities.filter((a) => a.userId === activeProfileId)} />
            </div>
          </div>
        )}

        {currentPage === "admin" && (
          <div className="max-w-7xl mx-auto animate-fadeIn">
            <AdminDashboard
              allProfiles={profiles}
              stocks={stocks}
              onUpdatePowerForUser={handleAdminUpdatePower}
              onUpdateHoldingsForUser={handleAdminUpdateHoldings}
              onDeleteUser={handleAdminDeleteUser}
              onAddActivity={handleAdminAddActivity}
              onClose={() => setCurrentPage("dashboard")}
            />
          </div>
        )}
      </main>

      {/* Cyber Footer */}
      <footer className="border-t border-white/10 bg-[#111111] p-6 mt-12 text-center text-xxs font-mono text-gray-500 space-y-2">
        <p className="tracking-widest uppercase">
          SECURITY PROTOCOL SHIELD: ENCRYPTED PORTFOLIO TRADINGS ACTIVE
        </p>
        <p className="text-gray-600">
          Stacks blockchain data is proxied seamlessly through our full-stack Express server. Stacks (STX) operates on mock settlement converters at 1 STX = $2.50 USD.
        </p>
        <p>© 2026 TESLA Trade Inc. Systems. Built to outperform.</p>
      </footer>
    </div>
  );
}
