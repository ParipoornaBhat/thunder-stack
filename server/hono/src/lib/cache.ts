import type { MiddlewareHandler } from "hono";

/**
 * Edge CDN Cache-Control middleware for Hono.
 * Automatically adds HTTP caching headers for successful GET requests so Cloudflare Edge CDN caches them.
 *
 * @param maxAge - Browser cache duration in seconds (default: 60s / 1 min)
 * @param sMaxAge - Cloudflare Edge cache duration in seconds (default: 300s / 5 min)
 * @param swr - Stale-While-Revalidate window in seconds (default: 600s / 10 min)
 */
export const publicCache = (
  maxAge = 60,
  sMaxAge = 300,
  swr = 600
): MiddlewareHandler => {
  return async (c, next) => {
    await next();
    if (c.req.method === "GET" && c.res.status === 200) {
      c.header(
        "Cache-Control",
        `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
      );
    }
  };
};
