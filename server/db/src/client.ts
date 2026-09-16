import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

let _db: any = null;

function getDb() {
  if (!_db) {
    let connectionString = process.env.DATABASE_URL || (globalThis as any).DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined in env");
    }

    const isRemote =
      !connectionString.includes("localhost") &&
      !connectionString.includes("127.0.0.1") &&
      !connectionString.includes("0.0.0.0");

    const hasSSL =
      connectionString.includes("sslmode=") ||
      connectionString.includes("ssl=true") ||
      isRemote;

    // Normalize connection string query parameters to prevent pg driver conflicting SSL configurations
    if (connectionString.includes("sslmode=") || connectionString.includes("ssl=")) {
      connectionString = connectionString
        .replace(/([\?&])sslmode=[^&]*/g, "$1")
        .replace(/([\?&])ssl=[^&]*/g, "$1")
        .replace(/\?&/, "?")
        .replace(/[?&]$/, "");
    }

    // Aiven, Supabase, Neon, and AWS RDS use custom or self-signed intermediate CA certificates
    // in cloud/serverless environments. Setting rejectUnauthorized: false prevents connection handshake failures.
    const pool = new pg.Pool({
      connectionString,
      ssl: hasSSL || process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 10,
      maxUses: 1,
      idleTimeoutMillis: 1000,
      allowExitOnIdle: true,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Database pool unexpected error:", err);
    });

    _db = drizzle(pool, { schema });
  }
  return _db;
}

// Lazy-initialized database client using a Proxy.
// This prevents top-level module evaluation crashes in Cloudflare Workers and makes sure env variables are populated first.
export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getDb();
    return Reflect.set(instance, prop, value, receiver);
  }
}) as unknown as ReturnType<typeof drizzle<typeof schema>>;

export type Database = ReturnType<typeof drizzle<typeof schema>>;
export * as schemaExports from "./schema/index.js";
