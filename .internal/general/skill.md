---
name: thunder-stack-universal
description: Comprehensive development guide, architectural blueprints, deployment recipes (Cloudflare + Vercel), performance optimization patterns, database configurations (Aiven/Supabase), and pair-programming expectations for full-stack applications built with Thunder Stack (Next.js + Hono + Drizzle/Postgres + Expo + Python ML).
---

# Thunder Stack Universal Engineering & Architecture Blueprint

Thunder Stack is a production-hardened, multi-cloud monorepo template engineered for ultra-fast, cross-platform full-stack applications with Next.js 15, Hono (Cloudflare Workers), Drizzle ORM, Better Auth, Expo 54, and Python-driven ML pipelines.

---

## 1. Golden User Rules & Pair-Programming Expectations

### A. Terminal Command Minimization
- **Minimize command execution:** Avoid running unnecessary shell exploratory commands (`dir`, `ls`, multiple `cat`/`grep` commands). Read and analyze local repository files directly using built-in read/search tools.
- **Suggest in Walkthrough:** Provide clear, copy-pasteable terminal instructions in the final walkthrough or response whenever the user can or prefers to execute steps themselves (e.g., long-running dev servers, database migrations, package installations).

### B. Pre-Commit Quality & Husky Checks
- **Typecheck before commit:** Always verify TypeScript integrity before committing (`pnpm typecheck` or `tsc --noEmit` on affected workspaces).
- **Husky & Hook Verification:** Ensure pre-commit and husky linters will pass cleanly. If a type or lint issue surfaces, fix it immediately prior to committing.

### C. Git Workflow & Commit Convention
- **No rebase and no force-push:** Never run `git rebase` or `git push --force`. Always use standard `git pull origin <branch>` and standard `git push origin <branch>` to prevent team history disruption.
- **Conventional Commits:** Write concise, lowercase, imperative, single-line messages following repository history:
  ```text
  <type>(<scope>): <what changed, imperative, lowercase>
  ```
  *Allowed Types:* `feat`, `fix`, `refac`, `chore`, `docs`, `style`, `data`, `ml`, `exp`  
  *Allowed Scopes:* `web`, `api`, `db`, `ml`, `data`, `auth`, `config`  
  *Examples:*
  - `feat(web): add global app context and runtime domain fallback`
  - `fix(db): resolve aiven postgres custom ca ssl handshake`
  - `chore(deploy): separate cloudflare ci build and deploy commands`
- **Forbidden:** Do not add promotional trailers, changelog essays, or `Co-Authored-By` signatures. Keep commits clean.

### D. Data Privacy & Confidentiality (PHI / PII Safeguard)
- Never stage or commit raw datasets, medical imaging (DICOM, NIfTI, NRRD, `.seg.nrrd`), or confidential archives.
- Never paste patient or confidential identifiers into commit messages, chat, or documentation. Use pseudonymous identifiers (e.g., `CASE-001`).
- Avoid `git add .` or `git add -A`. Explicitly stage individual modified files: `git add path/to/file.tsx`.

---

## 2. Monorepo Architecture & Tech Stack

```text
├── client/
│   ├── nextjs/            # Next.js 15+ (App Router, Tailwind CSS v4, Lucide icons, Canvas)
│   └── expo/              # React Native / Expo 54 cross-platform mobile client
├── server/
│   ├── hono/              # Hono API Gateway (Cloudflare Workers / Node server)
│   └── db/                # @thunder/db: Drizzle ORM schemas, migrations, seeds, Supabase/Aiven
├── packages/
│   ├── shared/            # Shared TypeScript types, Zod schemas, API contracts
│   └── create-thunder-app/# npx create-thunder-stack CLI scaffolding engine
├── ml/                    # Python ML workspace (PyTorch, torchvision, FastAPI, pipeline scripts)
├── scripts/               # Environment setup, database dev lifecycle scripts
├── turbo.json             # Turborepo task pipeline (topological build, dev, typecheck)
└── package.json           # Root pnpm monorepo workspace definition
```

### Monorepo Build Discipline (`turbo.json`)
In `turbo.json`, the `"build"` task must specify `"dependsOn": ["^build"]` so that dependent packages (`@thunder/shared`, `@thunder/db`) compile first in topological order:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**", ".open-next/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

---

## 3. Multi-Cloud Deployment Guide (Cloudflare + Vercel)

### A. Cloudflare Pages Deployment (Next.js Frontend)
1. **Build & Deploy Separation (Eliminating Double-Compilation):**
   - Cloudflare CI runs `Build Command` then `Deploy Command`.
   - Never write `"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"`.
   - Configure in `client/nextjs/package.json`:
     ```json
     "scripts": {
       "build": "cross-env NEXT_TELEMETRY_DISABLED=1 opennextjs-cloudflare build",
       "deploy": "opennextjs-cloudflare deploy"
     }
     ```
   - In Cloudflare Dashboard CI:
     - **Build Command:** `pnpm run build`
     - **Deploy Command:** `pnpm run deploy`
     - **Output Directory:** `.open-next/.deploy`

2. **`NEXT_PUBLIC_*` Build-Time Inlining vs Cloudflare Secrets:**
   - Encrypted Cloudflare **Secrets** are *not* provided to the container during `pnpm run build`.
   - Put all public variables in `client/nextjs/wrangler.jsonc` under `"vars"`:
     ```jsonc
     "vars": {
       "NODE_ENV": "production",
       "NEXT_PUBLIC_SERVER_URL": "https://thunder-server.workers.dev"
     }
     ```
   - Only keep sensitive keys (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `SMTP_PASS`) as Cloudflare Secrets.

3. **Dynamic Runtime Domain Fallback (`src/lib/config.ts`):**
   If a developer forgets to set `NEXT_PUBLIC_SERVER_URL` in CI, use runtime detection to prevent silent `localhost:4000` failures:
   ```ts
   export function getServerUrl(): string {
     const envUrl = process.env.NEXT_PUBLIC_SERVER_URL;
     if (typeof window !== "undefined") {
       const hostname = window.location.hostname;
       if (hostname !== "localhost" && hostname !== "127.0.0.1") {
         if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
           return "https://thunder-server.workers.dev";
         }
       }
     }
     return envUrl || "http://localhost:4000";
   }
   ```

### B. Cloudflare Workers Deployment (Hono API Server)
1. In `server/hono/package.json`:
   ```json
   "scripts": {
     "dev": "wrangler dev",
     "build": "tsc",
     "deploy": "wrangler deploy"
   }
   ```
2. Set Cloudflare Secrets via Wrangler:
   ```bash
   npx wrangler secret put DATABASE_URL --cwd server/hono
   npx wrangler secret put BETTER_AUTH_SECRET --cwd server/hono
   ```

### C. Vercel Deployment (Next.js Frontend)
- Setting Root Directory to `./` in the Vercel Dashboard triggers the root `vercel.json`:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "nextjs",
    "buildCommand": "pnpm --filter nextjs build",
    "installCommand": "pnpm install --no-frozen-lockfile"
  }
  ```

---

## 4. Database Layer (Supabase, Aiven, Neon & PostgreSQL SSL)

### A. Aiven & Remote SSL Configuration
- Aiven and managed cloud providers require TLS/SSL. Connection strings must include `?sslmode=require`.
- Aiven and Supabase use intermediate/custom CA certificates. To prevent `Error: self-signed certificate in certificate chain` in serverless Cloudflare Workers and Docker containers:
  ```ts
  // server/db/src/client.ts
  const pool = new pg.Pool({
    connectionString,
    ssl: hasSSL || process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    max: 10,
    maxUses: 1,
    idleTimeoutMillis: 1000,
    allowExitOnIdle: true,
  });
  ```

### B. Standard Database Commands (Drizzle)
```bash
# Generate SQL migrations from schema
pnpm --filter @thunder/db db:generate

# Apply migrations
pnpm --filter @thunder/db db:migrate

# Push schema directly (rapid prototyping)
pnpm --filter @thunder/db db:push

# Open visual Drizzle Studio database browser
pnpm --filter @thunder/db db:studio

# Run database seed
pnpm --filter @thunder/db db:seed
```

---

## 5. Performance & Caching Architecture

### A. Edge CDN `Cache-Control` Middleware for Hono (`server/hono/src/lib/cache.ts`)
```ts
import type { MiddlewareHandler } from "hono";

export const publicCache = (
  maxAge = 60,       // Browser cache: 1 min
  sMaxAge = 300,     // Cloudflare Edge cache: 5 min
  swr = 600          // Stale-While-Revalidate: 10 min
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
```

### B. Client-Side In-Memory Cache & Request Deduplicator (`client/nextjs/src/lib/api-cache.ts`)
```ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export async function fetchCached<T>(
  url: string,
  options?: RequestInit,
  ttlMs = 300000
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
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (method === "GET") memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      return data as T;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  if (method === "GET") inFlightRequests.set(cacheKey, promise);
  return promise;
}
```

---

## 6. UI/UX, State Management & Canvas Patterns

### A. Global AppContext & Parameterizable Branding
- Use `client/nextjs/src/config/site.ts` for parameterizable branding strings.
- Wrap root in `client/nextjs/src/context/AppContext.tsx` to stop multiple child components from dispatching redundant session/profile fetches.

### B. Atomic Snapshot Pattern for Auto-Saving & Drawing
1. Maintain `loadedItemRef.current` to strictly record the currently active item.
2. Snapshots target data synchronously before asynchronous fetch or save dispatches:
   ```ts
   const saveInternal = async ({
     targetItem = loadedItemRef.current,
     buffer = new Uint8Array(canvasDataRef.current)
   } = {}) => {
     if (!targetItem || !buffer) return;
     // Dispatches strictly to targetItem.id
   };
   ```
3. Use a monotonic request counter (`loadRequestIdRef.current++`) to discard out-of-order asynchronous responses when quickly clicking through records.

### C. Touch & Touchpad Double-Tap Gestures
- Double-tap detection within 320ms–350ms toggles locked draw mode (`isLockedDraw = true`).
- Set `touchAction: "none"` on `<canvas>` to prevent default browser gestures from interfering.

---

## 7. Python ML & Deep Learning Integration Pattern

### A. Environment & Dynamic Virtualenv Detection
```ts
function getPythonPath(rootDir: string): string {
  const isWin = process.platform === "win32";
  const venv = isWin
    ? path.join(rootDir, "ml", ".venv", "Scripts", "python.exe")
    : path.join(rootDir, "ml", ".venv", "bin", "python");
  return fs.existsSync(venv) ? venv : isWin ? "python" : "python3";
}
```

### B. Training Discipline & Honesty
- **Patient/Entity Grouping:** Slices, frames, or augmentations from the same entity must NEVER straddle train and validation folds.
- **Metric Honesty:** In imbalanced datasets, report Dice, IoU, AUROC, F1, and False Positives per case rather than accuracy.
- **Reproducibility:** Fix random seeds (`SEED = 1337`) across NumPy, PyTorch, and Python random.
- **Stateless Detached Training:** Launch training jobs in detached processes writing progress and metrics to disk (`metrics.json`). Web clients poll API routes to survive browser disconnects.

---

## 8. Universal LLM Prompting Blueprints

When prompting an AI assistant or generating a new full-stack module on Thunder Stack, use these structured prompts:

### Full-Stack Feature Prompt Blueprint
```text
Act as a Principal Full-Stack Engineer on Thunder Stack. Implement the [FEATURE_NAME] module:
1. Define shared TypeScript types and Zod schemas in packages/shared/src.
2. Create Drizzle schemas and relations in server/db/src/schema.
3. Build authenticated Hono routes in server/hono/src/routes with role-based permissions.
4. Implement Next.js 15 UI with Tailwind CSS v4, Lucide icons, and in-memory fetch deduplication (fetchCached).
5. Ensure typecheck passes across all workspaces without modifying build configurations.
```

### Performance & Edge Optimization Prompt Blueprint
```text
Optimize [ROUTE/PAGE] on Thunder Stack:
1. Apply publicCache() middleware on GET endpoints for Cloudflare Edge caching.
2. Wrap repetitive client requests in fetchCached() with appropriate TTL.
3. Ensure process.env and Cloudflare bindings are safely accessed with dynamic runtime domain fallbacks.
```
