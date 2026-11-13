const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: true }
    : false
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error.message);
});

async function testDatabaseConnection() {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT NOW() AS server_time");
    console.log("PostgreSQL connected:", result.rows[0].server_time);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testDatabaseConnection
};
