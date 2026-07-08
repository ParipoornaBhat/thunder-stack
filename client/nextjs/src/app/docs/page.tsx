"use client";

import { BookOpen, ShieldCheck, Key, Terminal, Code, Cpu, Smartphone, Server, Database, Layers } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";

export default function DocsPage() {
  const sections = [
    {
      title: "Architecture & Stack",
      icon: Layers,
      content: "THUNDER Stack is a high-performance, developer-first boilerplate optimized for serverless runtime environments. It links multiple modules in a unified monorepo: a PostgreSQL database with Drizzle ORM, a Cloudflare Workers Hono backend, a Next.js App Router web client, and an Expo mobile client.",
    },
    {
      title: "Backend API (Hono)",
      icon: Server,
      content: "The backend is powered by Hono, running inside a Cloudflare Workers (Wrangler) sandbox. It provides lightweight, extremely fast execution and exposes REST endpoints for user profiles, database queries, and role-based permissions.",
    },
    {
      title: "Web Client (Next.js)",
      icon: Code,
      content: "Built on Next.js 15 (App Router) and React 19. It uses a custom global DashboardContext hook to fetch and synchronize user profiles, permissions, and active roles once at the layout level. This eliminates redundant page-load requests and provides instantaneous page transitions.",
    },
    {
      title: "Mobile App (Expo)",
      icon: Smartphone,
      content: "An Expo 54 client using Expo Router for dynamic file-based mobile navigation. It features a custom CustomTabBar layout rendering direct links and dynamic overflow menus. Session tokens are securely cached in the mobile hardware-encrypted SecureStore.",
    },
    {
      title: "Database & Drizzle",
      icon: Database,
      content: "Uses PostgreSQL as the datastore. Connections are lazily evaluated in Drizzle ORM to avoid serverless cold starts. The connection pool dynamically caps concurrent queries and automatically reaps dead connection sockets to prevent locks and deadlocks inside wrangler.",
    },
    {
      title: "Authentication (Better Auth)",
      icon: Key,
      content: "Secured using Better Auth. It handles standard email/password authentication (verified using 6-digit email OTPs) as well as Google Social OAuth. Web clients utilize credentials sharing across ports, while mobile clients use secure HTTP headers.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-6">
            <div className="sticky top-28">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Documentation</h2>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.title}
                    href={`#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-all"
                  >
                    <s.icon className="h-4 w-4" />
                    {s.title}
                  </a>
                ))}
                <a
                  href="#command-reference"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-all"
                >
                  <Terminal className="h-4 w-4" />
                  Command Reference
                </a>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl space-y-12">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                THUNDER Stack Documentation
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Learn how to develop, run, and scale applications using the THUNDER architecture stack.
              </p>
            </div>

            <div className="h-px bg-border/60" />

            <div className="space-y-12">
              {sections.map((s) => (
                <section
                  key={s.title}
                  id={s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  className="space-y-4 scroll-mt-28"
                >
                  <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 border border-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </span>
                    {s.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.content}
                  </p>
                </section>
              ))}

              <section id="command-reference" className="space-y-4 scroll-mt-28">
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-primary/10 border border-primary/10 text-primary">
                    <Terminal className="h-5 w-5" />
                  </span>
                  Command Reference
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Execute the following package manager commands in the workspace root to control different services, migrations, and development modules:
                  </p>
                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 font-mono text-xs text-muted-foreground space-y-4 dark:bg-white/5">
                    <div>
                      <span className="text-primary font-bold"># Start the Development Servers (Backend Hono + Web Next.js)</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm dev</pre>
                    </div>
                    <div>
                      <span className="text-primary font-bold"># Start the Expo Mobile App (with Cache Clearing)</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm native</pre>
                    </div>
                    <div>
                      <span className="text-primary font-bold"># Start the Expo App on Android Simulator</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm --filter mobile android</pre>
                    </div>
                    <div>
                      <span className="text-primary font-bold"># Start the Expo App on iOS Simulator</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm --filter mobile ios</pre>
                    </div>
                    <div>
                      <span className="text-primary font-bold"># Seed the Database (Roles, Permissions, Users)</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm db:seed</pre>
                    </div>
                    <div>
                      <span className="text-primary font-bold"># Generate a New Drizzle Schema Migration</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm migrate:generate &lt;name&gt;</pre>
                    </div>
                    <div>
                      <span className="text-primary font-bold"># Apply All Database Migrations</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm db:migrate</pre>
                    </div>
                    <div>
                      <span className="text-primary font-bold"># Clear Cached Cache/Build/Turbo Artifacts</span>
                      <pre className="text-foreground mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm clean</pre>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
