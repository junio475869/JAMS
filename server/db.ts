
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export const pool = new pg.Pool({
  connectionString: "postgres://avnadmin:AVNS_TSHCpCN-1ASEeI4spMD@pg-ada48aa-junio475869-6768.b.aivencloud.com:24381/defaultdb",
  ssl: {
    ca: require('fs').readFileSync('cert.pem').toString(),
    rejectUnauthorized: true
  }
});

export const db = drizzle(pool);
