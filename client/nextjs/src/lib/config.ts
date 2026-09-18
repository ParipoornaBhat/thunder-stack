/**
 * Server and API URL resolver with dynamic runtime domain fallback.
 * Prevents client-side network failures when deployed on production or staging domains
 * if NEXT_PUBLIC_SERVER_URL was omitted during CI build time.
 */
export function getServerUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If deployed on production/staging domain but env is missing or points to localhost:
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
        return "https://thunder-server.workers.dev";
      }
    }
  }
  return envUrl || "http://localhost:4000";
}
