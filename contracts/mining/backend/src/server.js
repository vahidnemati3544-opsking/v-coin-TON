require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");

const {
  pool,
  connectDatabase,
  closeDatabase,
  testDatabaseConnection
} = require("./config/database");
const { createTelegramAuthRouter, createSessionAuthMiddleware } = require("./auth/telegram");
const { createPriceReferenceRouter, startPriceReferenceScheduler } = require("./services/price-reference");
const { createTonProofRouter } = require("./routes/ton-proof");
const { createSessionAuthMiddleware } = require("./auth/telegram");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS_ORIGIN_NOT_ALLOWED"));
    }
  })
);

app.use(express.json({ limit: "100kb" }));

const telegramLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({ error: "RATE_LIMIT_EXCEEDED" });
  }
});

const miningApiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({ error: "RATE_LIMIT_EXCEEDED" });
  }
});

const telegramAuthMaxAge = Number.parseInt(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || "86400", 10);
app.use("/api/v1/auth/telegram", telegramLoginRateLimit);
app.use(
  "/api/v1/auth",
  createTelegramAuthRouter({
    pool,
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    maxAgeSeconds: Number.isSafeInteger(telegramAuthMaxAge) && telegramAuthMaxAge > 0
      ? telegramAuthMaxAge
      : 86400
  })
);
// Public modelled reference price and 72-hour candle history.
app.use("/api/v1/price-reference", createPriceReferenceRouter({ pool }));

// Session-bound TON Connect proof authentication. This verifies wallet ownership
// but does not enable mining or submit any blockchain transaction.
const tonProofDomain = process.env.TON_PROOF_DOMAIN || "";
const tonProofRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({ error: "RATE_LIMIT_EXCEEDED" });
  }
});
app.use(
  "/api/v1/wallet/ton-proof",
  tonProofRateLimit,
  createSessionAuthMiddleware({ pool }),
  createTonProofRouter({ pool, expectedDomain: tonProofDomain })
);

// Fail closed until the wallet-balance mining implementation is complete.
// The current engine still uses internal PostgreSQL balances and must not be
// exposed as an extraction API under the owner's approved TON-wallet rule.
app.use("/api/v1/mining", miningApiRateLimit, (req, res) => {
  return res.status(503).json({
    error: "WALLET_BALANCE_MINING_NOT_IMPLEMENTED",
    message: "Mining is unavailable until verified TON Jetton wallet balances and confirmed payouts are implemented."
  });
});

// Keep the internal-balance router available for isolated tests only.
// Do not mount it on the public API before the wallet-balance adapter is complete.


app.get("/", (req, res) => {
  res.status(200).json({
    project: "V COIN - TON",
    service: "Backend Core Engine",
    version: "1.1.0",
    status: "running"
  });
});

app.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString()
  });
});

app.get("/health/ready", async (req, res) => {
  try {
    await testDatabaseConnection();

    res.status(200).json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      database: "unavailable"
    });
  }
});

app.get("/health", (req, res) => {
  res.redirect(307, "/health/live");
});

app.use((req, res) => {
  res.status(404).json({
    error: "ROUTE_NOT_FOUND"
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === "CORS_ORIGIN_NOT_ALLOWED") {
    return res.status(403).json({
      error: "CORS_ORIGIN_NOT_ALLOWED"
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "INVALID_JSON"
    });
  }

  console.error("Server error:", err.message);

  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR"
  });
});

async function startServer() {
  let server;
  let stopPriceReferenceScheduler;

  try {
    await connectDatabase();
    stopPriceReferenceScheduler = startPriceReferenceScheduler({ pool });

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`V COIN TON Backend running on port ${PORT}`);
    });

    let shuttingDown = false;

    const shutdown = async (signal) => {
      if (shuttingDown) return;

      shuttingDown = true;
      console.log(`${signal} received. Shutting down gracefully...`);
      if (stopPriceReferenceScheduler) stopPriceReferenceScheduler();

      server.close(async () => {
        try {
          await closeDatabase();
          process.exit(0);
        } catch (error) {
          console.error("Shutdown failed:", error.message);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    return server;
  } catch (error) {
    console.error("Backend startup failed:", error.message);

    if (stopPriceReferenceScheduler) stopPriceReferenceScheduler();
    if (server) {
      server.close();
    }

    try {
      await closeDatabase();
    } catch (closeError) {
      console.error("Database shutdown failed:", closeError.message);
    }

    process.exitCode = 1;
    throw error;
  }
}

if (require.main === module) {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = {
  app,
  startServer
};
