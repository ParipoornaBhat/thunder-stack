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
```

The installer will automatically:
1. Scaffold the entire monorepo workspace.
2. Install all package dependencies using `pnpm` or `npm`.
3. Set up your local configuration config files (`.env`).

Once completed, start developing:
```bash
cd my-app
pnpm dev
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
