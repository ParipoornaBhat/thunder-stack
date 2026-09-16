# Project Architecture & Progress Summary

## Overview
- **Project Name:** THUNDER Stack
- **Architecture:** Monorepo (pnpm + Turborepo)
- **Frontend Web:** Next.js 15+ (App Router, Tailwind CSS v4, Lucide icons)
- **Mobile:** Expo 54 / React Native
- **Backend API:** Hono REST API Gateway (Cloudflare Workers / Edge / Node)
- **Database & Auth:** PostgreSQL (Supabase / Aiven / Neon) with Drizzle ORM and Better Auth
- **Machine Learning Integration:** Python workspace with isolated virtual environments & dynamic runner detection

## Core Highlights & Implemented Features
1. **Multi-Cloud Deployment Support:**
   - Next.js Web: Zero-config Vercel deployment + Cloudflare Pages with `@opennextjs/cloudflare`.
   - Hono API: Serverless Cloudflare Workers with Wrangler CLI.
2. **Double-Compilation Prevention:**
   - Cloudflare CI build and deploy separation (`pnpm run build` and `pnpm run deploy`) preventing redundant compilation cycles.
3. **Build-Time Inlining & Secrets Safety:**
   - Non-sensitive variables defined under `vars` in `wrangler.jsonc`.
   - Encrypted secrets managed cleanly via Cloudflare Secrets.
4. **Resilient Production Networking:**
   - `getServerUrl()` dynamic runtime domain fallback preventing silent `localhost:4000` client failures.
5. **High-Performance Caching:**
   - Server: `publicCache` middleware adding edge and browser Cache-Control headers.
   - Client: `fetchCached` lightweight in-memory cache and in-flight request deduplicator.
6. **Aiven & Supabase PostgreSQL SSL Tolerance:**
   - Enhanced Drizzle ORM client supporting `?sslmode=require` and custom intermediate CA certificate validation (`rejectUnauthorized: false`).
