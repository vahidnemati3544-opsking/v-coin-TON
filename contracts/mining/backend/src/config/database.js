const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

async function testDatabaseConnection() {
  await pool.query("SELECT 1");
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
  testDatabaseConnection,
  connectDatabase,
  closeDatabase,
};
