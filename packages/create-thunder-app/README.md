# ⚡ create-thunder-stack ⚡

Scaffold a premium, production-ready, cross-platform monorepo application using the **THUNDER Stack** in seconds. 

Web application with **Next.js**, mobile app with **Expo**, a lightning-fast API backend with **Hono**, and database services powered by **Drizzle ORM** & **PostgreSQL**.

---

## 🚀 Quick Start

Run the initializer in your terminal:

```bash
# Create in a new folder
npx create-thunder-stack my-app

# Or scaffold directly inside your current directory
npx create-thunder-stack .

# Scaffold with full AI architecture blueprints, deployment guides & fix docs (.internal/)
npx create-thunder-stack my-app --ai
npx create-thunder-stack . --ai
```

> [!TIP]
> Use the `--ai` (or `--docs`, `--internal`) flag to bundle the universal DevOps master deployment guides, database & Hyperdrive blueprints, and cross-origin auth architecture into `.internal/` for AI pair-programming and developer agents.

The installer will automatically scaffold the workspace, install dependencies, and run the preparation script to copy `.env.example` to `.env` and connect `.dev.vars` inside the Hono server to it.

Once the setup is completed, follow these steps to initialize and start your project:

### ⚙️ Step-by-Step Initialization

#### 1. Navigate to your project directory
```bash
cd my-app
```

#### 2. Configure Your Database URL
Open the root `.env` file and configure your `DATABASE_URL` with your Postgres connection string (e.g., Neon serverless Postgres).

#### 3. Generate Database Migration
Generate your database schema migration named `initial_schema`:
```bash
pnpm migrate:generate initial_schema
```

#### 4. Deploy Database Migration
Apply the migrations to your target database:
```bash
pnpm migrate:deploy
```

---

## 🛠️ Run, Build & Dev Commands

Run these commands from the root directory:

### Run Development Servers Concurrently
```bash
pnpm dev
```
*Starts Next.js (port `3000`), Hono Backend Server (port `8787`), and the Expo bundler concurrently.*

### Run the Mobile Application (Expo Client)
```bash
pnpm native
```

### Build & Start for Production
To build all applications:
```bash
pnpm build
```

To start the production servers (Next.js web & Hono backend):
```bash
pnpm start
```

---

## 📂 Architecture Layout

```text
my-thunder-app/
├── client/              # Frontend Applications
│   ├── expo/            # Mobile client (React Native / Expo Go)
│   └── nextjs/          # Web client (Next.js App Router)
│
├── server/              # Backend Services
│   ├── db/              # Relational database client & migrations (@thunder/db)
│   └── hono/            # Light & fast web API Gateway (@thunder/api)
│
└── packages/            # Shared Monorepo Packages
    └── shared/          # Shared types, constants, & utility code
```

---

## ✨ Features Included

* **Cross-Platform Routing & Structure**: Ready-to-go monorepo architecture structure for unified Next.js + React Native mobile apps.
* **Serverless Hono Backend**: Mount Hono API endpoints on Cloudflare Workers, Edge, or traditional Node.js servers.
* **Drizzle ORM & Postgres**: Connect to Postgres (e.g. Neon Database) with automated Drizzle migrations and custom seeding hooks.
* **Complete Authentication Solution**: Pre-configured **Better Auth** with social logins (Google) and secure authentication callback logic.
