interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Lightweight, zero-dependency in-memory cache and in-flight request deduplicator.
 * Prevents multiple components from simultaneously dispatching identical GET requests.
 */
export async function fetchCached<T>(
  url: string,
  options?: RequestInit,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const method = options?.method?.toUpperCase() || "GET";
  const cacheKey = `${method}:${url}`;

  if (method === "GET") {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data as T;
    }
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey) as Promise<T>;
    }
  }

  const promise = fetch(url, options)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (method === "GET") {
        memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data as T;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  if (method === "GET") {
    inFlightRequests.set(cacheKey, promise);
  }
  return promise;
}

/**
 * Clear cached entries manually or invalidate by matching prefix/key.
 */
export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}
