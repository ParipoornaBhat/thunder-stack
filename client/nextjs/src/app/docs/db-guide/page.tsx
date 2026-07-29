"use client";

import {
  Database,
  Terminal,
  ShieldCheck,
  Zap,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  FileCode,
  Layers,
  Key,
  Server,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";

export default function DbGuidePage() {
  const cliCommands = [
    {
      command: "pnpm db:status",
      title: "Migration & System Health Status",
      description:
        "Displays current database migration state, counts applied vs pending migrations, verifies active database connections, and checks SSL handshake stability.",
      icon: CheckCircle2,
      badge: "Diagnostics",
      snippet: `$ pnpm db:status
[DB Status] Checking database migration status...
[DB Status] Connected to PostgreSQL: postgresql://*****@aiven-db.com:25432/defaultdb
[DB Status] Current migration version: 20260729_init
[DB Status] Applied migrations: 3 / 3
[DB Status] Pending migrations: 0
[DB Status] System Health: OK`,
    },
    {
      command: "pnpm db:migrate",
      title: "Apply Pending Migrations",
      description:
        "Executes all pending Drizzle SQL migration files sequentially inside a database transaction.",
      icon: Zap,
      badge: "Deployment",
      snippet: `$ pnpm db:migrate
[DB Migrate] Applying pending migrations...
[DB Migrate] Executing migration: 0001_add_rbac_tables.sql
[DB Migrate] Migrations completed successfully in 142ms.`,
    },
    {
      command: "pnpm db:seed",
      title: "Seed Default Roles & Users",
      description:
        "Seeds default system roles (Admin, Manager, User), granular permissions, and creates default administrator credentials.",
      icon: ShieldCheck,
      badge: "Data Setup",
      snippet: `$ pnpm db:seed
[DB Seed] Seeding database...
[DB Seed] Created roles: admin, manager, user
[DB Seed] Assigned 24 RBAC permissions
[DB Seed] Default admin created: admin@thunderstack.dev`,
    },
    {
      command: "pnpm db:rollback",
      title: "Roll Back Migrations",
      description:
        "Safely rolls back the last applied migration batch, updating migration metadata tables accurately.",
      icon: RotateCcw,
      badge: "Recovery",
      snippet: `$ pnpm db:rollback
[DB Rollback] Reverting last migration batch...
[DB Rollback] Rolled back: 0001_add_rbac_tables.sql
[DB Rollback] Database state restored to version 0000_init.sql`,
    },
    {
      command: "pnpm db:reset",
      title: "Wipe & Re-initialize Database",
      description:
        "Drops all existing database schema tables, re-applies all Drizzle migrations from scratch, and runs the seed script.",
      icon: RefreshCw,
      badge: "Dangerous / Dev",
      snippet: `$ pnpm db:reset
[DB Reset] WARNING: Dropping all database tables...
[DB Reset] Schema dropped successfully.
[DB Reset] Running pnpm db:migrate...
[DB Reset] Running pnpm db:seed...
[DB Reset] Database reset complete!`,
    },
    {
      command: "pnpm db:help",
      title: "Interactive Command Manual",
      description:
        "Launches the interactive CLI manual explaining all available database options, parameters, and flags.",
      icon: HelpCircle,
      badge: "Utility",
      snippet: `$ pnpm db:help
===================================================
   ⚡ THUNDER STACK DATABASE UTILITIES MANUAL ⚡
===================================================
Available commands:
  pnpm db:status    - Check migration status & SSL
  pnpm db:migrate   - Apply pending migrations
  pnpm db:seed      - Seed default RBAC roles & admin
  pnpm db:rollback  - Revert last migration batch
  pnpm db:reset     - Clean rebuild database tables
  pnpm db:generate  - Generate Drizzle SQL migration
  pnpm db:studio    - Open visual Drizzle Studio GUI`,
    },
  ];

  const dbTables = [
    {
      name: "users",
      description: "Core user entity storing profiles, email verification status, and RBAC role assignment.",
      columns: "id, name, email, emailVerified, image, roleId, createdAt, updatedAt",
    },
    {
      name: "roles",
      description: "RBAC Role definitions (e.g., Admin, Manager, User) supporting system-level locking.",
      columns: "id, name, description, isSystem, createdAt, updatedAt",
    },
    {
      name: "permissions",
      description: "Granular permission definitions (e.g., users:read, users:write, settings:manage).",
      columns: "id, key, name, description, category",
    },
    {
      name: "role_permissions",
      description: "Junction table mapping roles to multiple permissions.",
      columns: "roleId, permissionId",
    },
    {
      name: "sessions",
      description: "Active authentication sessions managed by Better Auth with IP and user-agent tracking.",
      columns: "id, userId, token, expiresAt, ipAddress, userAgent",
    },
    {
      name: "accounts",
      description: "OAuth provider accounts (Google, GitHub) connected to user profiles.",
      columns: "id, userId, accountId, providerId, accessToken, refreshToken",
    },
    {
      name: "verifications",
      description: "Email verification tokens and 6-digit OTP codes for passwordless or email auth.",
      columns: "id, identifier, value, expiresAt",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-8">
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Documentation
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">Database & Drizzle CLI Guide</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Database className="h-3.5 w-3.5" />
            <span>Database Architecture & CLI Suite</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            THUNDER Database & Drizzle Guide
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Complete guide to managing PostgreSQL databases, Drizzle ORM, schema migrations, Aiven SSL connection handling, and custom CLI automation scripts.
          </p>
        </div>

        <div className="h-px bg-border/60 mb-12" />

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm space-y-2">
            <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-blue-500">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">PostgreSQL Datastore</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Supports Aiven PostgreSQL, Neon serverless, Supabase, or local PostgreSQL containers seamlessly.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm space-y-2">
            <div className="p-2.5 w-fit rounded-xl bg-purple-500/10 text-purple-500">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Drizzle ORM</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              100% TypeScript type safety with zero runtime code generation overhead.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm space-y-2">
            <div className="p-2.5 w-fit rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Aiven SSL Fix Built-in</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automatic SSL certificate resolution (<code className="text-primary font-mono text-[11px]">rejectUnauthorized: false</code>) for Cloudflare Workers.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm space-y-2">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Complete CLI Suite</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dedicated status checking, seeding, migration rollback, and database reset commands.
            </p>
          </div>
        </div>

        {/* Section: CLI Commands Reference */}
        <section className="space-y-8 mb-20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Terminal className="h-6 w-6 text-primary" />
              Database CLI Management Commands
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Run these commands from the root directory to manage migrations, seed data, or run diagnostics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cliCommands.map((cmd) => (
              <div
                key={cmd.command}
                className="rounded-2xl border border-border/50 bg-card p-6 space-y-4 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
                      {cmd.command}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/40">
                      {cmd.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{cmd.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {cmd.description}
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-muted/40 dark:bg-black/40 p-3 font-mono text-xs overflow-x-auto">
                  <pre className="text-muted-foreground whitespace-pre-wrap">{cmd.snippet}</pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Schema Architecture */}
        <section className="space-y-8 mb-20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <FileCode className="h-6 w-6 text-secondary" />
              Database Schema & Models
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Core entities defined in <code className="text-primary font-mono text-xs">server/db/src/schema.ts</code>.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="py-3.5 px-6 font-bold text-foreground">Table Name</th>
                  <th className="py-3.5 px-6 font-bold text-foreground">Description</th>
                  <th className="py-3.5 px-6 font-bold text-foreground">Columns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                {dbTables.map((table) => (
                  <tr key={table.name} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-primary">{table.name}</td>
                    <td className="py-3.5 px-6 text-xs leading-relaxed max-w-xs">{table.description}</td>
                    <td className="py-3.5 px-6 font-mono text-xs text-foreground/80">{table.columns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Aiven SSL & Connection Configuration */}
        <section className="space-y-6 mb-20 p-8 rounded-3xl border border-border/60 bg-muted/20 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Aiven PostgreSQL SSL Connection Setup</h2>
              <p className="text-xs text-muted-foreground">
                Connecting Cloudflare Workers & Node.js to cloud PostgreSQL databases with SSL verification.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            When connecting to cloud PostgreSQL providers such as <strong>Aiven PostgreSQL</strong>, SSL mode is mandatory. In serverless environments like Cloudflare Workers (wrangler), default SSL CA certificate bundles can cause handshake errors. THUNDER Stack automatically configures the connection driver:
          </p>

          <div className="rounded-2xl border border-border/50 bg-black/80 p-4 font-mono text-xs text-emerald-400 space-y-2">
            <div className="text-muted-foreground">// server/db/src/index.ts</div>
            <pre className="whitespace-pre-wrap">{`import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

export const db = drizzle(pool);`}</pre>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-background to-secondary/10">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-foreground">Ready to deploy your frontend & backend?</h3>
            <p className="text-xs text-muted-foreground">
              Check out our complete deployment guide for Vercel, Cloudflare Pages, and Cloudflare Workers.
            </p>
          </div>
          <Link
            href="/docs/deployment-guide"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shrink-0 shadow-md"
          >
            <span>View Deployment Guide</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
