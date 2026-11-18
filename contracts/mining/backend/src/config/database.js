const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Configure it in the backend .env file.");
}

let parsedDatabaseUrl;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
}

if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
  throw new Error("DATABASE_URL must use postgres:// or postgresql://.");
}

const pool = new Pool({
  connectionString: databaseUrl,
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
