import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

// Establish database url and pool
const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_kEaxRytu4Qq7@ep-patient-river-ada2yz60-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

let pool: pg.Pool | null = null;

async function testAndGetReplicaPool(originalUrl: string): Promise<pg.Pool> {
  const trimmedUrl = originalUrl.trim();
  const dbUrl = new URL(trimmedUrl);
  let databaseName = decodeURIComponent(dbUrl.pathname.substring(1)).split("?")[0].trim();

  console.log(`Testing pool with database name: "${databaseName}"`);

  let testPool = new Pool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "5432"),
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: databaseName,
    ssl: dbUrl.searchParams.get("sslmode") === "require" ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await testPool.connect();
    client.release();
    console.log(`Connection successful with database "${databaseName}"`);
    return testPool;
  } catch (err: any) {
    console.error(`Connection failed or database "${databaseName}" does not exist:`, err.message || err);
    await testPool.end().catch(() => {});

    // Fallback 1: Try "neondb"
    if (databaseName !== "neondb") {
      console.log(`Retrying with fallback database: "neondb"`);
      testPool = new Pool({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port || "5432"),
        user: dbUrl.username,
        password: decodeURIComponent(dbUrl.password),
        database: "neondb",
        ssl: dbUrl.searchParams.get("sslmode") === "require" ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 10000,
      });
      try {
        const client = await testPool.connect();
        client.release();
        console.log(`Connection successful with fallback database "neondb"`);
        return testPool;
      } catch (err2: any) {
        console.error(`Fallback to "neondb" failed:`, err2.message || err2);
        await testPool.end().catch(() => {});
      }
    }

    // Fallback 2: Try "postgres"
    if (databaseName !== "postgres") {
      console.log(`Retrying with fallback database: "postgres"`);
      testPool = new Pool({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port || "5432"),
        user: dbUrl.username,
        password: decodeURIComponent(dbUrl.password),
        database: "postgres",
        ssl: dbUrl.searchParams.get("sslmode") === "require" ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 10000,
      });
      try {
        const client = await testPool.connect();
        client.release();
        console.log(`Connection successful with fallback database "postgres"`);
        return testPool;
      } catch (err3: any) {
        console.error(`Fallback to "postgres" failed:`, err3.message || err3);
        await testPool.end().catch(() => {});
      }
    }

    // Fallback 3: Hardcoded backup db
    const backupUrl = "postgresql://neondb_owner:npg_kEaxRytu4Qq7@ep-patient-river-ada2yz60-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    console.log("Retrying with backup hardcoded pool...");
    const backupDbUrl = new URL(backupUrl);
    testPool = new Pool({
      host: backupDbUrl.hostname,
      port: parseInt(backupDbUrl.port || "5432"),
      user: backupDbUrl.username,
      password: decodeURIComponent(backupDbUrl.password),
      database: "neondb",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    return testPool;
  }
}

// Set up the pool connection
async function setupPool() {
  try {
    pool = await testAndGetReplicaPool(databaseUrl);
    pool.on("error", (err) => {
      console.error("Postgres idle pool client error:", err);
    });
  } catch (error) {
    console.error("Failed to establish pool:", error);
  }
}

// Preloaded default user profiles
const DEFAULT_PROFILES = [
  {
    id: "uid-001",
    username: "ChiefCyberBroker",
    email: "ericwalison2406@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80",
    password: "password123",
    buyingPower: 180000.0,
    holdings: {},
    stacksAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    lastStxBalance: 0,
  },
  {
    id: "uid-002",
    username: "StarshipCommander",
    email: "starship@spacex.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80",
    password: "password123",
    buyingPower: 180000.0,
    holdings: {},
    stacksAddress: "ST39R27M9NWH1GZNDHNVHVDM1H60R2MGS0YFA21XG",
    lastStxBalance: 0,
  }
];

// Bootstrap Neon database tables
async function initializeDatabase() {
  if (!pool) return;
  try {
    console.log("Checking and bootstrapping database tables...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        avatar TEXT,
        password VARCHAR(255) NOT NULL,
        buying_power NUMERIC DEFAULT 180000.0,
        holdings JSONB DEFAULT '{}'::jsonb,
        stacks_address VARCHAR(255) DEFAULT '',
        last_stx_balance NUMERIC DEFAULT 0.0
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_activities (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC DEFAULT 0.0,
        price NUMERIC DEFAULT 0.0,
        total_usd NUMERIC DEFAULT 0.0,
        timestamp VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL
      )
    `);

    const checkRes = await pool.query(`SELECT COUNT(*) FROM user_profiles`);
    if (parseInt(checkRes.rows[0].count) === 0) {
      console.log("Seeding database with default profiles...");
      for (const p of DEFAULT_PROFILES) {
        await pool.query(`
          INSERT INTO user_profiles (id, username, email, avatar, password, buying_power, holdings, stacks_address, last_stx_balance)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          p.id,
          p.username,
          p.email,
          p.avatar,
          p.password,
          p.buyingPower,
          JSON.stringify(p.holdings),
          p.stacksAddress,
          p.lastStxBalance
        ]);
      }
      console.log("Database seeding completed.");
    }

    console.log("Database environment initialized successfully!");
  } catch (error) {
    console.error("Error during database bootstrap:", error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize DB pool connection
  await setupPool();

  // Initialize DB tables
  await initializeDatabase();

  // Initialize Gemini if key exists
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY not found in server environment.");
  }

  // API Route: AI Market Advisor
  app.post("/api/gemini-analysis", async (req: express.Request, res: express.Response) => {
    try {
      if (!ai) {
        return res.status(200).json({
          analysis: "### ⚠️ Gemini Advisor Offline\n\nPlease add a valid `GEMINI_API_KEY` in the AI Studio **Secrets Panel** to activate your automated cyberbroker. Active portfolio sync and Stacks testnet functions will continue to operate normally!"
        });
      }

      const { user, stocks } = req.body;

      if (!user || !stocks) {
        return res.status(400).json({ error: "Missing required parameter content (user & stocks)." });
      }

      const holdingsStr = Object.values(user.holdings || {})
        .filter((h: any) => h.units > 0)
        .map((h: any) => `- **${h.symbol}**: ${h.units.toFixed(4)} units (Avg Cost: $${h.averagePrice.toFixed(2)})`)
        .join("\n");

      const stocksStr = Object.values(stocks || {})
        .map((s: any) => `- **${s.name} (${s.symbol})**: $${s.price.toFixed(2)} (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`)
        .join("\n");

      const prompt = `
Generate a brief, sleek, and premium cybernetic Wall Street advisor report for the Tesla Investment Terminal.

[USER PROFILE]
Trader: ${user.username}
Buying Power: $${user.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
Linked Stacks Address: ${user.stacksAddress || "None Linked"}
Stacks Testnet Balance: ${user.lastStxBalance ? (user.lastStxBalance / 1000000).toLocaleString() + " STX" : "0 STX"}

[PORTFOLIO POSITION INDEX]
${holdingsStr || "No active stock positions. Portfolio is currently in 100% Cash/Buying Power."}

[LIVE TELEMETRY FEED]
${stocksStr}

Generate a concise, high-value visual response structured exactly as follows:
1. **Market Pulse**: Highlight immediate trend direction for Tesla (TSLA) and the broader ecosystem under the current market state.
2. **Portfolio Health**: Rate their profile allocation efficiency.
3. **Strategic Playbook**: Outline 2 specific tactical recommendations based on their current cash liquidity and potential Stacks testnet token reserves. (Be highly hyper-focused on TSLA and Tesla Coin [TSLC]).

Keep the reply compact, punchy, visually clean, and fully formatted in markdown. Use bullet points and bold headers. Speak in an intelligent, sophisticated, slightly digital, and strategic voice. Avoid preamble like "Here is your report".
`;

      // Try to generate content with retries and model fallback
      let responseText = "";
      let success = false;
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

      for (const modelName of modelsToTry) {
        if (success) break;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`Querying ${modelName} (attempt ${attempt})...`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                temperature: 0.82,
              }
            });
            if (response && response.text) {
              responseText = response.text;
              success = true;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Attempt ${attempt} for model ${modelName} failed:`, modelErr.message || modelErr);
            if (attempt < 2 || modelName !== modelsToTry[modelsToTry.length - 1]) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }
      }

      if (!success) {
        console.warn("All Gemini API attempts failed. Generating high-fidelity fallback report.");
        const totalValue = user.buyingPower + Object.values(user.holdings || {}).reduce((sum: number, h: any) => {
          const livePrice = stocks[h.symbol]?.price || 0;
          return sum + h.units * livePrice;
        }, 0);
        const holdsCount = Object.values(user.holdings || {}).filter((h: any) => h.units > 0).length;

        responseText = `### 🛰️ SECURE SATELLITE TELEMETRY [STANDBY COMPILER]

1. **Market Pulse**
- **Tesla Ecosystem Highlight**: TSLA is demonstrating sustained interest at current levels. The broader EV segment is experiencing temporary volume stabilization as miners and traders seek entry limits.
- **Tesla Coin (TSLC)**: Showing resilient order-book liquidity with dynamic buy-wall support on our internal decentralized bridge ledgers.

2. **Portfolio Health**
- **Allocation Rating**: **OPTIMAL PRESERVATIVE** (Holds count: ${holdsCount}). With a total asset valuation of $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD, your portfolio maintains robust stability.
- **Liquidity Buffer**: Your buying power of $${user.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD represents strong liquidity reserves to leverage any sudden micro-market dips.

3. **Strategic Playbook**
- **Tactical Buying Trigger**: Maintain close telemetry alerts on **TSLA** around support corridors. Allocate up to 15% of your available liquidity at lower thresholds.
- **Reserve Bridge Swap**: Leverage Stacks holdings. Sync your connected Web3 Ledger and utilize the STX-to-USD Decentralized Bridge to secure additional trading power if TSLA breaks current resistance lines.`;
      }

      res.json({ analysis: responseText });
    } catch (err: any) {
      console.error("Gemini Advisor Service Error:", err);
      res.status(500).json({ error: err.message || "An internal error occurred during portfolio analysis." });
    }
  });

  // API Route: Stacks Testnet Balance Fetcher proxy
  app.get("/api/stacks-balance/:address", async (req: express.Request, res: express.Response) => {
    try {
      const { address } = req.params;
      const apiRes = await fetch(`https://api.testnet.hiro.so/extended/v1/address/${address}/balances`);
      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ error: `Hiro nodes responded with status ${apiRes.status}` });
      }
      const data = await apiRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("Stacks Balance Proxy Error:", err);
      res.status(500).json({ error: err.message || "An error occurred fetching testnet balances." });
    }
  });

  // API Route: Stacks Testnet Recent Transactions proxy
  app.get("/api/stacks-txs/:address", async (req: express.Request, res: express.Response) => {
    try {
      const { address } = req.params;
      const apiRes = await fetch(`https://api.testnet.hiro.so/extended/v1/address/${address}/transactions?limit=10`);
      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ error: `Hiro API failed with status ${apiRes.status}` });
      }
      const data = await apiRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("Stacks Transactions Proxy Error:", err);
      res.status(500).json({ error: err.message || "An error occurred fetching testnet transactions." });
    }
  });

  // API Route: Get DB data (profiles and activities)
  app.get("/api/db-data", async (req: express.Request, res: express.Response) => {
    try {
      if (!pool) {
        return res.status(500).json({ error: "Database client is not initialized" });
      }

      // Fetch profiles
      const profilesRes = await pool.query(`SELECT * FROM user_profiles`);
      const dbProfiles = profilesRes.rows.map((row) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        avatar: row.avatar,
        password: row.password,
        buyingPower: parseFloat(row.buying_power),
        holdings: typeof row.holdings === "string" ? JSON.parse(row.holdings) : row.holdings,
        stacksAddress: row.stacks_address,
        lastStxBalance: parseFloat(row.last_stx_balance),
      }));

      // Fetch activities
      const activitiesRes = await pool.query(`SELECT * FROM trade_activities`);
      const dbActivities = activitiesRes.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        symbol: row.symbol,
        type: row.type,
        amount: parseFloat(row.amount),
        price: parseFloat(row.price),
        totalUsd: parseFloat(row.total_usd),
        timestamp: row.timestamp,
        status: row.status,
      }));

      res.json({
        profiles: dbProfiles,
        activities: dbActivities
      });
    } catch (err: any) {
      console.error("Error fetching db data:", err);
      res.status(500).json({ error: err.message || "Database fetch error" });
    }
  });

  // API Route: Synchronize profiles
  app.post("/api/sync-profiles", async (req: express.Request, res: express.Response) => {
    try {
      if (!pool) {
        return res.status(500).json({ error: "Database client is not initialized" });
      }

      const { profiles } = req.body;
      if (!Array.isArray(profiles)) {
        return res.status(400).json({ error: "profiles array is required" });
      }

      // Upsert profiles
      for (const p of profiles) {
        if (p.id === "admin-uid") continue;
        await pool.query(`
          INSERT INTO user_profiles (id, username, email, avatar, password, buying_power, holdings, stacks_address, last_stx_balance)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            avatar = EXCLUDED.avatar,
            password = EXCLUDED.password,
            buying_power = EXCLUDED.buying_power,
            holdings = EXCLUDED.holdings,
            stacks_address = EXCLUDED.stacks_address,
            last_stx_balance = EXCLUDED.last_stx_balance
        `, [
          p.id,
          p.username,
          p.email,
          p.avatar || "",
          p.password || "password123",
          p.buyingPower,
          JSON.stringify(p.holdings || {}),
          p.stacksAddress || "",
          p.lastStxBalance || 0
        ]);
      }

      // Remove deleted profiles
      const idsToKeep = profiles.map((p: any) => p.id).filter((id) => id !== "admin-uid");
      if (idsToKeep.length > 0) {
        const placeholders = idsToKeep.map((_, i) => `$${i + 1}`).join(",");
        await pool.query(`DELETE FROM user_profiles WHERE id NOT IN (${placeholders}) AND id <> 'admin-uid'`, idsToKeep);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error syncing profiles:", err);
      res.status(500).json({ error: err.message || "Database sync error" });
    }
  });

  // API Route: Synchronize activities
  app.post("/api/sync-activities", async (req: express.Request, res: express.Response) => {
    try {
      if (!pool) {
        return res.status(500).json({ error: "Database client is not initialized" });
      }

      const { activities } = req.body;
      if (!Array.isArray(activities)) {
        return res.status(400).json({ error: "activities array is required" });
      }

      for (const act of activities) {
        await pool.query(`
          INSERT INTO trade_activities (id, user_id, symbol, type, amount, price, total_usd, timestamp, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [
          act.id,
          act.userId,
          act.symbol,
          act.type,
          act.amount,
          act.price,
          act.totalUsd,
          act.timestamp,
          act.status
        ]);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error syncing activities:", err);
      res.status(500).json({ error: err.message || "Database sync error" });
    }
  });

  // Static Assets or Vite HMR Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tesla Investment Terminal Server running on Port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to boot full-stack server:", error);
});
