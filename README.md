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

## 🧹 Utilities

*   **Clean build/cache folders**:
    ```bash
    pnpm run clean
    ```
*   **Clean and Reinstall all dependencies**:
    ```bash
    pnpm run ci
    ```
