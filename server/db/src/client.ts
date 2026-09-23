import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

let _db: any = null;

/**
 * Returns the singleton or lazily-initialized Drizzle ORM instance using postgres.js.
 * Automatically adapts between Cloudflare Hyperdrive connection pooling, remote SSL, and local environments.
 */
function getDb() {
  if (!_db) {
    let connectionString = process.env.DATABASE_URL || (globalThis as any).DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined in env");
    }

    const isHyperdrive =
      connectionString.includes("hyperdrive") || connectionString.includes("cloudflare");

    const isRemote =
      !connectionString.includes("localhost") &&
      !connectionString.includes("127.0.0.1") &&
      !connectionString.includes("0.0.0.0");

    const hasSSL =
      connectionString.includes("sslmode=") ||
      connectionString.includes("ssl=") ||
      isRemote;

    // postgres.js client configuration for edge & serverless runtimes
    const client = postgres(connectionString, {
      ssl: isHyperdrive ? false : (hasSSL ? "require" : false),
      max: 5,
      idle_timeout: 10,
      connect_timeout: 10,
      prepare: false, // Mandatory for Cloudflare Workers / serverless runtimes
    });

    _db = drizzle(client, { schema });
  }
  return _db;
}

/**
 * Creates a dedicated, request-scoped database instance.
 */
export function createRequestDb(connectionString: string) {
  const isHyperdrive =
    connectionString.includes("hyperdrive") || connectionString.includes("cloudflare");

  const isRemote =
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1") &&
    !connectionString.includes("0.0.0.0");

  const hasSSL =
    connectionString.includes("sslmode=") ||
    connectionString.includes("ssl=") ||
    isRemote;

  const client = postgres(connectionString, {
    ssl: isHyperdrive ? false : (hasSSL ? "require" : false),
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false,
  });

  const dbInstance = drizzle(client, { schema });
  return { db: dbInstance, client };
}

// Lazy-initialized database client using a Proxy.
// This prevents top-level module evaluation crashes in Cloudflare Workers and ensures env variables are populated first.
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
