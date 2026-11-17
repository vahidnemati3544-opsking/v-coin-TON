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

  try {
    await connectDatabase();

    server = app.listen(PORT, "0.0.0.0", () => {
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

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    return server;
  } catch (error) {
    console.error("Backend startup failed:", error.message);

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
