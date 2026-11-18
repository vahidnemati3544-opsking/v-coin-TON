'use strict';

const path = require('node:path');
const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run the development database setup against NODE_ENV=production.');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and set your local PostgreSQL connection.');
}

let parsedDatabaseUrl;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL.');
}

if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol) ||
    !parsedDatabaseUrl.hostname ||
    parsedDatabaseUrl.pathname.length < 2) {
  throw new Error('DATABASE_URL must use postgres:// or postgresql:// and include a host and database name.');
}

const { pool } = require('../src/config/database');
const MIGRATION_LOCK_ID = 741230018;

const migrations = [
  {
    version: '000_core_schema',
    description: 'Core PostgreSQL schema',
    file: path.resolve(__dirname, '../database/schema.sql')
  },
  {
    version: '001_mining_reserve',
    description: 'Fixed mining reserve allocation and controls',
    file: path.resolve(__dirname, '../database/migrations/001-mining-reserve.sql')
  },
  {
    version: '002_mining_ledger_settlement',
    description: 'Atomic mining reward ledger settlement',
    file: path.resolve(__dirname, '../database/migrations/002-mining-ledger-settlement.sql')
  },
  {
    version: '003_balance_based_mining',
    description: 'Balance-based 1 percent daily mining snapshots',
    file: path.resolve(__dirname, '../database/migrations/003-balance-based-mining.sql')
  }
];

async function main() {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
    lockAcquired = true;

    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (' +
      'version VARCHAR(100) PRIMARY KEY, ' +
      'description TEXT NOT NULL, ' +
      'checksum CHAR(64) NOT NULL, ' +
      'applied_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()' +
      ')'
    );

    const target = await client.query(
      'SELECT current_database() AS database_name, current_user AS database_role'
    );
    console.log(
      'Applying V COIN – TON database setup to database "' +
      target.rows[0].database_name +
      '" as role "' +
      target.rows[0].database_role +
      '".'
    );

    for (const migration of migrations) {
      const sql = await fs.readFile(migration.file, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        [migration.version]
      );

      if (existing.rowCount === 1) {
        if (existing.rows[0].checksum.trim() !== checksum) {
          throw new Error(
            'Applied migration ' + migration.version +
            ' has changed. Create a new migration instead of editing an applied file.'
          );
        }
        console.log('Already applied: ' + migration.version);
        continue;
      }

      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, description, checksum) VALUES ($1, $2, $3)',
        [migration.version, migration.description, checksum]
      );
      console.log('Applied: ' + migration.version + ' — ' + migration.description);
    }

    console.log('Database schema and migrations are up to date.');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* preserve original error */ }
    throw error;
  } finally {
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
      } catch (_) { /* connection release still returns the session lock */ }
    }
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
});
