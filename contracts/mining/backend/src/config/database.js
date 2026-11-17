"use strict";

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

async function testDatabaseConnection() {
  const result = await pool.query("SELECT 1 AS database_connected");

  if (result.rows[0]?.database_connected !== 1) {
    throw new Error("PostgreSQL health check returned an unexpected result.");
  }

  return true;
}

async function connectDatabase() {
  await testDatabaseConnection();
  console.log("PostgreSQL connected successfully.");
}

async function closeDatabase() {
  await pool.end();
  console.log("PostgreSQL connection pool closed.");
}

module.exports = {
  pool,
  connectDatabase,
  testDatabaseConnection,
  closeDatabase
};
