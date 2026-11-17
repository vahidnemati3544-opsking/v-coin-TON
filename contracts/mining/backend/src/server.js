require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const {
  connectDatabase,
  closeDatabase,
  testDatabaseConnection
} = require("./config/database");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS_ORIGIN_NOT_ALLOWED"));
  }
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => res.status(200).json({
  project: "V COIN - TON",
  service: "Backend Core Engine",
  version: "1.1.1",
  status: "running"
}));

app.get("/health/live", (_req, res) => res.status(200).json({
  status: "alive",
  timestamp: new Date().toISOString()
}));

app.get("/health/ready", async (_req, res) => {
  try {
    await testDatabaseConnection();
    return res.status(200).json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (_error) {
    return res.status(503).json({ status: "not_ready", database: "unavailable" });
  }
});

app.get("/health", (_req, res) => res.redirect(307, "/health/live"));
app.use((_req, res) => res.status(404).json({ error: "ROUTE_NOT_FOUND" }));

app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.message === "CORS_ORIGIN_NOT_ALLOWED") {
    return res.status(403).json({ error: "CORS_ORIGIN_NOT_ALLOWED" });
  }
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "INVALID_JSON" });
  }
  console.error("Server error:", err.message);
  return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

async function startServer() {
  await connectDatabase();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`V COIN TON Backend running on port ${PORT}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received. Shutting down gracefully...`);
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
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Backend startup failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
