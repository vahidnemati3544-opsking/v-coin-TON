'use strict';

const path = require('node:path');
const fs = require('node:fs/promises');
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

const migrations = [
  {
    name: 'Core PostgreSQL schema',
    file: path.resolve(__dirname, '../database/schema.sql')
  },
  {
    name: 'Mining reserve allocation and controls',
    file: path.resolve(__dirname, '../database/migrations/001-mining-reserve.sql')
  },
  {
    name: 'Mining reward ledger settlement',
    file: path.resolve(__dirname, '../database/migrations/002-mining-ledger-settlement.sql')
  }
];

async function main() {
  const client = await pool.connect();

  try {
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
      await client.query(sql);
      console.log('Applied: ' + migration.name);
    }

    console.log('Database schema and mining reserve setup completed.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
});
