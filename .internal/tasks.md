# Tasks & Progress Tracker

## Completed Tasks
- [x] Configure `client/nextjs/wrangler.jsonc` with OpenNext build output and `vars`.
- [x] Configure `server/hono/wrangler.jsonc` with non-sensitive vars.
- [x] Add dynamic runtime domain fallback (`client/nextjs/src/lib/config.ts`).
- [x] Add in-memory request cache & deduplicator (`client/nextjs/src/lib/api-cache.ts`).
- [x] Add Edge CDN caching middleware (`server/hono/src/lib/cache.ts`).
- [x] Standardize global `AppContext.tsx` and `SmoothScroll.tsx`.
- [x] Standardize parameterizable branding in `client/nextjs/src/config/site.ts`.
- [x] Add Web Manifest (`client/nextjs/public/manifest.json`).
- [x] Harden Aiven & Supabase PostgreSQL SSL in `server/db/src/client.ts`.
- [x] Separate Cloudflare CI build (`opennextjs-cloudflare build`) from deploy (`opennextjs-cloudflare deploy`).
- [x] Disable Next.js build telemetry in CI via `NEXT_TELEMETRY_DISABLED=1`.
- [x] Update Turborepo build task to enforce `"dependsOn": ["^build"]`.
- [x] Expand `.internal/general/skill.md` to universal full-stack guide.
- [x] Clean up `.internal` by removing `commit-tool`.

## Active / Upcoming Tasks
- [ ] Verify build and typechecks across all monorepo workspaces.
- [ ] Perform git commit and push following conventional commit standards.
