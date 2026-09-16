import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

let _db: any = null;

/**
 * Creates a dedicated, request-scoped database instance.
 * Explicitly sanitizes the connection string by stripping '?sslmode=...' so node-postgres (pg)
 * does not silently override 'rejectUnauthorized: false' with 'verify-full' (which causes SELF_SIGNED_CERT_IN_CHAIN on Aiven/Cloud DBs).
 */
export function createRequestDb(connectionString: string) {
  const cleanConnectionString = connectionString
    .replace(/[\?&]sslmode=[^&]+/g, "")
    .replace(/[\?&]ssl=[^&]+/g, "")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");

  const pool = new pg.Pool({
    connectionString: cleanConnectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
    maxUses: 1,
    idleTimeoutMillis: 1000,
    allowExitOnIdle: true,
  });

  const dbInstance = drizzle(pool, { schema });
  return { db: dbInstance, pool };
}

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
      connectionString.includes("ssl=") ||
      isRemote;

    // Strip ?sslmode=... so node-postgres (pg) doesn't silently override rejectUnauthorized: false with verify-full
    const cleanConnectionString = connectionString
      .replace(/[\?&]sslmode=[^&]+/g, "")
      .replace(/[\?&]ssl=[^&]+/g, "")
      .replace(/\?&/, "?")
      .replace(/[?&]$/, "");

    // Aiven, Supabase, Neon, and AWS RDS use custom or self-signed intermediate CA certificates
    // in cloud/serverless environments. Setting rejectUnauthorized: false prevents SELF_SIGNED_CERT_IN_CHAIN failures.
    const pool = new pg.Pool({
      connectionString: cleanConnectionString,
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
