require("dotenv").config();

const { Pool } = require("pg");

function createPoolConfig() {
  const connectionString = process.env.DATABASE_URL;

  const config = connectionString
    ? { connectionString }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || "vcoin_ton",
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      };

  if (process.env.DB_SSL === "true") {
    config.ssl = {
      rejectUnauthorized: true
    };
  }

  config.max = Number(process.env.DB_POOL_MAX) || 10;
  config.idleTimeoutMillis = 30000;
  config.connectionTimeoutMillis = 5000;

  return config;
}

const pool = new Pool(createPoolConfig());

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

async function connectDatabase() {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL database connected successfully");
  } finally {
    client.release();
  }
}

async function testDatabaseConnection() {
  await pool.query("SELECT 1");
  return true;
}

async function closeDatabase() {
  await pool.end();
  console.log("PostgreSQL database connection closed");
}

module.exports = {
  pool,
  connectDatabase,
  testDatabaseConnection,
  closeDatabase
};
