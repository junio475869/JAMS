
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const pool = new pg.Pool({
  connectionString: "postgres://avnadmin:AVNS_TSHCpCN-1ASEeI4spMD@pg-ada48aa-junio475869-6768.b.aivencloud.com:24381/defaultdb",
  ssl: {
    ca: readFileSync(join(__dirname, '..', 'cert.pem')).toString(),
    rejectUnauthorized: true
  }
});

export const db = drizzle(pool);
