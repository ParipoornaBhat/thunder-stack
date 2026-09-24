# THUNDER Stack ⚡

A high-performance monorepo boilerplate featuring **Hono**, **Next.js**, **Expo (React Native)**, **Better-Auth**, and **Drizzle ORM**.

---

## 📂 Project Structure

```text
thunder-stack/
├── client/
│   ├── expo/             # Mobile Client App (React Native + Expo Router) - [Package: mobile]
│   └── nextjs/           # Web Client App (Next.js + TailwindCSS) - [Package: nextjs]
├── server/
│   ├── db/               # Shared Database Package (Drizzle Schema, Migrations, & Services) - [Package: @thunder/db]
│   └── hono/             # Backend API Server (Hono + Cloudflare Workers / Wrangler) - [Package: server]
└── packages/
    ├── shared/           # Common Shared Configs & Utilities
    └── create-thunder-app # CLI bootstrap tool
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- **NodeJS** (v22+ recommended for pnpm 11)
- **pnpm** (v11+ recommended)

### 🛠️ Step-by-Step Initialization

#### 1. Install Dependencies & Link Environment Files
Run the install command. This will automatically execute the post-installation/prepare script, creating `.env` from `.env.example` and automatically connecting/linking it to `server/hono/.dev.vars`:
```bash
pnpm install
```
*(If you ever need to manually recreate the connection later, you can run `pnpm run prepare`.)*

#### 2. Configure Your Database URL
Open the newly created `.env` file in the root directory and update your database credentials (e.g., `DATABASE_URL`).

#### 3. Generate the Initial Database Migration
Generate your database schema/migration file with the name `initial_schema`:
```bash
pnpm migrate:generate initial_schema
```

#### 4. Deploy the Database Migration
Apply the migrations to your target database:
```bash
pnpm migrate:deploy
```

---

## 🛠️ Run, Build & Dev Commands

These commands run globally using **Turbo** to orchestrate across all workspaces.

### Start All Development Servers Concurrently
```bash
pnpm dev
```
*Starts Next.js (port `3000`), Hono Backend Server (port `8787`), and the Expo bundler concurrently.*

### Run the Mobile Application (Expo Client)
```bash
pnpm native
```

### Build & Start for Production
To build all applications and packages:
```bash
pnpm build
```

To start the production servers (Next.js web & Hono backend):
```bash
pnpm start
```

### Typecheck All Projects
```bash
pnpm typecheck
```

---

## 🧩 Build & Dev Commands (Separate Projects)

You can run commands for specific workspaces using pnpm's `--filter` flag.

### 🗄️ Database (`@thunder/db`)
Commands are run from the root using workspace filtering:

*   **Generate Migrations**:
    ```bash
    pnpm db:generate
    ```
*   **Run Migrations**:
    ```bash
    pnpm db:migrate
    ```
*   **Seed Database**:
    ```bash
    pnpm db:seed
    ```

Alternatively, you can run them directly in the directory `server/db`:
```bash
# In server/db
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
```

---

### 🌐 Next.js Web Client (`nextjs`)

*   **Start Dev Server**:
    ```bash
    pnpm --filter nextjs dev
    ```
*   **Build Project**:
    ```bash
    pnpm --filter nextjs build
    ```
*   **Start Production Server**:
    ```bash
    pnpm --filter nextjs start
    ```

---

### 📱 Expo Mobile Client (`mobile`)

*   **Start Bundler**:
    ```bash
    pnpm --filter mobile start
    ```
*   **Run on Android**:
    ```bash
    pnpm --filter mobile android
    ```
*   **Run on iOS**:
    ```bash
    pnpm --filter mobile ios
    ```

---

### ⚡ Hono Backend API Server (`server`)

*   **Start Local Dev Server (Wrangler/Cloudflare Workers)**:
    ```bash
    pnpm --filter server dev
    ```
*   **Deploy to Cloudflare**:
    ```bash
    pnpm --filter server deploy
    ```

---

---

## 🌐 Production Deployment Guide

ThunderStack is architected for seamless multi-target production deployments across **Cloudflare Workers & Pages**, **Vercel**, **Managed PostgreSQL (Neon / Aiven / Supabase)**, and **Expo EAS (Mobile)**.

---

### 🔑 Platform Authentication & CLI Login (One-Time Setup)

Before deploying to the respective cloud platforms for the first time, authenticate via their CLI tools:

| Platform | Login Command | Check Whoami | Logout Command |
|---|---|---|---|
| **Cloudflare (Workers & Pages)** | `pnpm login:cf` *(or `wrangler login`)* | `pnpm whoami:cf` | `pnpm logout:cf` |
| **Expo EAS (Mobile APK & iOS)** | `pnpm login:expo` *(or `npx eas login`)* | `pnpm whoami:expo` | `pnpm logout:expo` |
| **Vercel (Web Frontend)** | `pnpm login:vercel` *(or `vercel login`)* | `pnpm whoami:vercel` | `pnpm logout:vercel` |

---

### ⚡ 1. One-Command Full Deploy
Deploy both your Cloudflare Worker backend and Cloudflare Pages web client together:
```bash
pnpm deploy
# or
pnpm deploy:all
```

---

### ☁️ 2. Cloudflare Deployment (Workers & Pages)

#### A. Backend API (Cloudflare Workers)
The backend runs on Cloudflare Workers with ultra-low latency edge compute.
* **Deploy Worker**:
  ```bash
  pnpm deploy:server
  ```
* **Bulk Upload Encrypted Secrets** (from `server/hono/.dev.vars`):
  ```bash
  pnpm secrets:server
  ```
  *(Cloudflare retains encrypted secrets permanently across subsequent deploys.)*

#### B. Web Frontend (Cloudflare Pages + OpenNext)
The Next.js application is compiled via `@opennextjs/cloudflare` for high-performance edge rendering.
* **Build & Deploy to Cloudflare Pages**:
  ```bash
  pnpm build:web:cf
  pnpm deploy:web:cf
  ```
* **Bulk Upload Pages Secrets** (from `client/nextjs/.dev.vars`):
  ```bash
  pnpm secrets:client
  ```

#### C. Push All Secrets (Server & Client)
```bash
pnpm secrets:all
```

---

### ▲ 3. Vercel Deployment (Next.js Frontend)

#### Option A: Vercel CLI
Deploy directly from your terminal:
```bash
pnpm deploy:web:vercel
```

#### Option B: Vercel Web Dashboard
1. Import the Git repository into [Vercel Dashboard](https://vercel.com/new).
2. Set **Root Directory**: `./` (Root) — Vercel will automatically detect the root [`vercel.json`](file:///d:/Codes/Working/thunder-stack/vercel.json).
3. Configure your Environment Variables:
   - `NEXT_PUBLIC_SERVER_URL` = `https://your-hono-worker.workers.dev`
   - `BETTER_AUTH_SECRET` = `your-32-char-secret`
   - `NEXT_PUBLIC_IS_DOCS_ONLY` = `false` (or `true` if deploying only documentation site)
4. Click **Deploy**.

---

### 🗄️ 4. Database Setup & Production Management

ThunderStack is powered by **Drizzle ORM** with native PostgreSQL support (works seamlessly with Neon Serverless, Aiven, Supabase, AWS RDS, or standard PostgreSQL).

#### Database Production Lifecycle:
1. **Configure Production URL**:
   Ensure `DATABASE_URL` is set in your environment / Cloudflare Secrets (`pnpm secrets:server`).
2. **Generate New Migration**:
   ```bash
   pnpm migrate:generate <feature_name>
   ```
3. **Deploy Migrations to Target DB**:
   ```bash
   pnpm migrate:deploy
   ```
4. **Check Migration & Table Status**:
   ```bash
   pnpm db:status
   ```
5. **Seed Production / Staging Data**:
   ```bash
   pnpm db:seed
   ```
6. **Rollback Last Migration**:
   ```bash
   pnpm db:rollback
   ```
7. **Launch Visual Database Studio**:
   ```bash
   pnpm db:studio
   ```

---

### 📱 5. Mobile Client Deployment (Expo EAS)

ThunderStack includes complete Expo Application Services (EAS) pipelines configured in [`eas.json`](file:///d:/Codes/Working/thunder-stack/client/expo/eas.json).

* **Build Standalone Android APK & Auto-Sync to Web**:
  ```bash
  pnpm deploy:app
  ```
  *(Compiles the APK on EAS, grabs the live downloadable artifact URL via [`scripts/sync-eas-apk.js`](file:///d:/Codes/Working/thunder-stack/scripts/sync-eas-apk.js), injects `NEXT_PUBLIC_APP_DOWNLOAD_URL`, and automatically redeploys your web client with the direct download button!)*

* **Build Production Android (APK/AAB) & Sync**:
  ```bash
  pnpm deploy:app:prod
  ```

* **Build Production iOS App**:
  ```bash
  pnpm deploy:app:ios
  ```

* **Sync Latest Existing APK Artifact**:
  ```bash
  pnpm sync:apk
  ```

---

## 🧹 Utilities

* **Clean build/cache folders**:
  ```bash
  pnpm run clean
  ```
* **Clean and Reinstall all dependencies**:
  ```bash
  pnpm run ci
  ```

