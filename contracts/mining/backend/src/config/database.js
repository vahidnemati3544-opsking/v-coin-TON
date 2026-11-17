const { Pool } = require("pg");

function buildPoolConfig(env = process.env) {
  const hasUrl = Boolean(env.DATABASE_URL);
  const config = hasUrl
    ? { connectionString: env.DATABASE_URL }
    : {
        host: env.PGHOST || "127.0.0.1",
        port: Number(env.PGPORT) || 5432,
        database: env.PGDATABASE,
        user: env.PGUSER,
        password: env.PGPASSWORD
      };

  if (!hasUrl && (!config.database || !config.user || !config.password)) {
    throw new Error("DATABASE_CONFIG_MISSING: set DATABASE_URL or PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD");
  }

  return {
    ...config,
    ssl: env.PGSSL === "true" ? { rejectUnauthorized: true } : false,
    max: Number(env.PGPOOL_MAX) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    application_name: "vcoin-ton-backend"
  };
}

const pool = new Pool(buildPoolConfig());

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

async function testDatabaseConnection() {
  const result = await pool.query("SELECT 1 AS database_ok");
  if (result.rows[0]?.database_ok !== 1) {
    throw new Error("DATABASE_HEALTH_CHECK_FAILED");
  }
  return true;
}

async function connectDatabase() {
  await testDatabaseConnection();
  console.log("PostgreSQL connected successfully.");
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  pool,
  buildPoolConfig,
  connectDatabase,
  testDatabaseConnection,
  closeDatabase
};
