import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

export function getRawPool(): pg.Pool {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in env");
  }

  const hasSSL = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
  if (hasSSL) {
    connectionString = connectionString
      .replace(/([\?&])sslmode=[^&]*/, "$1")
      .replace(/([\?&])ssl=[^&]*/, "$1")
      .replace(/\?&/, "?")
      .replace(/\?$/, "");
  }

  return new pg.Pool({
    connectionString,
    ssl: hasSSL || process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });
}

export async function findMigrationTable(pool: pg.Pool): Promise<{ schemaName: string; tableName: string } | null> {
  const result = await pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name = '__drizzle_migrations'
  `);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    schemaName: row.table_schema,
    tableName: row.table_name,
  };
}
