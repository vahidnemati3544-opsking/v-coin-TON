require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const {
  connectDatabase,
  closeDatabase
} = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || false
}));

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({
    project: "V COIN - TON",
    service: "Backend Core Engine",
    version: "1.0.0",
    status: "operational"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "ROUTE_NOT_FOUND"
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR"
  });
});

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(V COIN TON Backend running on port ${PORT});
    });

    const shutdown = async () => {
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
