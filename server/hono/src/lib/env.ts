/**
 * Helpers for parsing environment variables in Hono server.
 */

/**
 * Returns an array of allowed client URLs parsed from `CLIENT_URL`.
 * Supports comma-separated string (e.g. "https://url1.in,https://url2.in").
 */
export const getClientUrls = (): string[] => {
  const raw = process.env.CLIENT_URL || (globalThis as any).CLIENT_URL || "http://localhost:3000";
  return raw
    .split(",")
    .map((url: string) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);
};

/**
 * Returns the single server URL for Better Auth and server endpoints.
 * Enforces a single URL even if comma-separated values are accidentally passed.
 */
export const getServerUrl = (): string => {
  const raw = process.env.BETTER_AUTH_URL || (globalThis as any).BETTER_AUTH_URL || "http://localhost:4000";
  const firstUrl = raw.split(",")[0].trim();
  return firstUrl.replace(/\/+$/, "");
};
