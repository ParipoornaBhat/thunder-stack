// Polyfill global setTimeout to prevent "tid.unref is not a function" errors in wrangler dev server
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

globalThis.setTimeout = function (callback: any, delay: any, ...args: any[]) {
  const timer = originalSetTimeout(callback, delay, ...args);
  if (typeof timer === "number") {
    return {
      ref() { return this; },
      unref() { return this; },
      [Symbol.toPrimitive]() { return timer; },
      valueOf() { return timer; },
    } as any;
  } else if (timer && typeof timer === "object" && !("unref" in timer)) {
    (timer as any).unref = () => timer;
    (timer as any).ref = () => timer;
  }
  return timer;
} as any;

globalThis.clearTimeout = function (timer: any) {
  if (timer && typeof timer === "object" && typeof timer.valueOf === "function") {
    return originalClearTimeout(timer.valueOf());
  }
  return originalClearTimeout(timer);
} as any;

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.js";
import { getClientUrls, getServerUrl } from "./lib/env.js";
import usersHandler from "./routes/users.js";
import rolesHandler from "./routes/roles.js";
import type { Env } from "./lib/permissions.js";

import { getCookie } from "hono/cookie";

import { publicCache } from "./lib/cache.js";

const app = new Hono<Env>();

// Middleware to sync Wrangler environment bindings to process.env and globalThis at request time
app.use("*", async (c, next) => {
  if (c.env) {
    for (const [key, value] of Object.entries(c.env)) {
      if (typeof value === "string") {
        process.env[key] = value;
        (globalThis as any)[key] = value;
      }
    }
    // Hyperdrive provides a dynamic pooled connection string per request
    if ((c.env as any).HYPERDRIVE?.connectionString) {
      process.env.DATABASE_URL = (c.env as any).HYPERDRIVE.connectionString;
      (globalThis as any).DATABASE_URL = (c.env as any).HYPERDRIVE.connectionString;
    }
  }
  await next();
});

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: (origin: string | undefined) => {
      const allowedOrigins = [...getClientUrls(), getServerUrl()];
      if (!origin) return allowedOrigins[0] || "*";
      if (allowedOrigins.includes(origin)) return origin;
      if (process.env.NODE_ENV !== "production") {
        return origin;
      }
      return allowedOrigins[0];
    },
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    exposeHeaders: ["Set-Cookie"],
  })
);

app.get("/health", publicCache(30, 120), (c) => {
  return c.json({
    status: "ok",
    service: "thunder-server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/auth/mobile-callback", (c) => {
  const redirectUri = c.req.query("redirect_uri") || "thunderstack://auth-callback";

  // Prevent open redirect: only allow thunderstack:// scheme or trusted origins
  const allowedScheme = "thunderstack://";
  const trustedOrigins = [...getClientUrls(), getServerUrl()];
  const isSafeRedirect = redirectUri.startsWith(allowedScheme)
    || trustedOrigins.some((origin) => redirectUri.startsWith(origin));

  if (!isSafeRedirect) {
    return c.json({ error: "Invalid redirect URI" }, 400);
  }

  const token = getCookie(c, "better-auth.session_token") || getCookie(c, "__secure-better-auth.session_token");

  if (!token) {
    const separator = redirectUri.includes("?") ? "&" : "?";
    return c.redirect(`${redirectUri}${separator}error=no_token`);
  }

  const separator = redirectUri.includes("?") ? "&" : "?";
  return c.redirect(`${redirectUri}${separator}token=${token}`);
});

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/api/users", usersHandler);
app.route("/api/roles", rolesHandler);

export default app;
