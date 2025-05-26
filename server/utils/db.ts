import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure database pool
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://avnadmin:AVNS_TSHCpCN-1ASEeI4spMD@pg-ada48aa-junio475869-6768.b.aivencloud.com:24381/defaultdb",
  // ssl: {
  //   rejectUnauthorized: false // Required for Aiven PostgreSQL
  // },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export drizzle instance
export const db = drizzle(pool);

// Test database connection
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
