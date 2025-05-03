import { Pool } from 'pg';

let pool: Pool | null = null;


async function initPool() {
  if (pool) {
    return pool;
  }
  // Connect via DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  } else {
    // Load DB config from individual environment variables
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;
    if (!host || !port || !user || !password || !database) {
      throw new Error(
        'Database configuration variables DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME must be set, or provide DATABASE_URL'
      );
    }
    pool = new Pool({
      host,
      port: Number.parseInt(port, 10),
      user,
      password,
      database,
      max: 5,
      // Enable SSL if environment variable DB_SSL is set
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }

  // Initialize schema
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      symbol TEXT NOT NULL,
      quantity NUMERIC NOT NULL,
      cost_basis NUMERIC,
      purchased_at DATE,
      portfolio_name TEXT NOT NULL DEFAULT ''
    );
  `);
  // Ensure portfolio_name column exists for legacy tables
  await pool.query(
    `ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS portfolio_name TEXT NOT NULL DEFAULT ''`
  );

  return pool;
}

/**
 * Execute a database query
 * @param text SQL query text
 * @param params Optional parameters array
 */
export async function query(text: string, params?: (string | number | boolean | null)[]) {
  const client = await initPool();
  return client.query(text, params);
}