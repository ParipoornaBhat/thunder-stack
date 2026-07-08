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
- **NodeJS** (v20+ recommended)
- **pnpm** (v10+ recommended)

---

## 🛠️ Build & Dev Commands (Together/Global)

These commands run across the entire monorepo using **Turbo** to manage dependencies and concurrency efficiently.

### Install All Dependencies
```bash
pnpm install
```

### Start All Development Servers Concurrently
```bash
pnpm dev
```
*Starts Next.js (port `3000`), Hono Backend Server (port `8787`), and Expo bundler concurrently.*

### Build All Projects in Monorepo
```bash
pnpm build
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

## 🧹 Utilities

*   **Clean build/cache folders**:
    ```bash
    pnpm run clean
    ```
*   **Clean and Reinstall all dependencies**:
    ```bash
    pnpm run ci
    ```
