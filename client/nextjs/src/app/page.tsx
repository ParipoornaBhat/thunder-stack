"use client";

import { useState } from "react";
import { 
  ArrowRight, 
  Terminal, 
  Copy, 
  Check, 
  Zap, 
  ShieldCheck, 
  Database, 
  Globe, 
  Smartphone, 
  Layers, 
  ChevronDown, 
  Code,
  Sparkles,
  ExternalLink,
  Cpu,
  Lock,
  Activity,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { TechStack3D } from "~/components/TechStack3D";
import { useSession } from "~/lib/auth-client";
import { toast } from "sonner";

export default function HomePage() {
  const { data: session } = useSession();
  const primaryHref = session?.user ? "/dashboard" : "/login";
  const primaryLabel = session?.user ? "Go to Dashboard" : "Get Started";

  const [activeTab, setActiveTab] = useState<"npx" | "pnpm" | "bun">("npx");
  const [copiedCli, setCopiedCli] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [codeTab, setCodeTab] = useState<"hono" | "schema" | "next" | "expo">("hono");

  const cliCommands = {
    npx: "npx create-thunder-stack@latest my-app",
    pnpm: "pnpm dlx create-thunder-stack@latest my-app",
    bun: "bunx create-thunder-stack@latest my-app",
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommands[activeTab]);
    setCopiedCli(true);
    toast.success("Installation command copied!");
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const faqItems = [
    {
      q: "Why Cloudflare Workers + Hono instead of monolithic Next.js API routes?",
      a: "Cloudflare Workers run on V8 isolated edge nodes across 300+ global data centers. Moving the backend REST API to Hono on Cloudflare Workers guarantees sub-10ms global API responses with zero serverless cold starts, while keeping Next.js focused purely on frontend rendering and Server Components."
    },
    {
      q: "How does lazy connection pooling work with Drizzle ORM in serverless?",
      a: "Standard PostgreSQL drivers can exhaust connection limits or hang during serverless cold starts. THUNDER Stack wraps Drizzle in a lazy-evaluated proxy that only negotiates database sockets when an active query is initiated, and automatically reaps dead connection sockets to prevent pool lockup."
    },
    {
      q: "How is authentication synchronized between Next.js Web and Expo Native Mobile?",
      a: "Authentication is managed by Better Auth. Web clients use secure HTTP-only credentials across ports, while mobile clients securely cache bearer tokens inside hardware-encrypted SecureStore and attach them to API headers via DashboardContext."
    },
    {
      q: "Can I deploy the web frontend to Vercel and the API to Cloudflare Workers?",
      a: "Yes! THUNDER Stack is built for multi-platform production deployment out-of-the-box. The Next.js client includes zero-config Vercel root metadata (`vercel.json`), while the Hono API deploys globally with Wrangler (`pnpm deploy:server`)."
    }
  ];

  const codeSnippets = {
    hono: `// server/hono/src/index.ts (Cloudflare Workers Edge API)
import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "@thunder/db";
import { users } from "@thunder/db/schema";

const app = new Hono();
app.use("*", cors({ origin: "http://localhost:3000", credentials: true }));

app.get("/api/users/profile", async (c) => {
  const allUsers = await db.select().from(users).limit(10);
  return c.json({ status: "success", data: allUsers });
});

export default app;`,
    schema: `// server/db/src/schema.ts (Drizzle ORM PostgreSQL RBAC)
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export className roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // admin | manager | user
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export className users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  roleId: text("role_id").references(() => roles.id),
});`,
    next: `// client/nextjs/src/app/page.tsx (Next.js 15 Client Consumer)
import { useSession } from "~/lib/auth-client";

export default function Page() {
  const { data: session } = useSession();
  
  return (
    <main className="p-8">
      <h1>Welcome, {session?.user?.name ?? "Developer"}</h1>
      <p>Role-based access active</p>
    </main>
  );
}`,
    expo: `// client/expo/app/(tabs)/index.tsx (Expo 54 Native Mobile)
import { View, Text } from "react-native";
import { SecureStore } from "expo-secure-store";

export default function MobileScreen() {
  return (
    <View style={{ flex: 1, justifyCenter: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>THUNDER Native</Text>
    </View>
  );
}`
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      <SiteHeader />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 border-b border-border/50">
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
            
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-6 sm:mb-8 select-none shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              <span>THUNDER STACK v1.0.3 — Production Ready</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.08]">
              Full-stack engineering <br className="hidden sm:block" />
              <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
                at the speed of thought.
              </span>
            </h1>

            {/* Architectural Overview Paragraph */}
            <p className="mx-auto max-w-3xl text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed font-normal">
              Software engineering was never meant to be bottlenecked by endless boilerplate, cold-start latency, and disjointed tools. 
              We crafted <strong className="text-foreground font-semibold">THUNDER Stack</strong> for how modern teams actually build: an edge API on Cloudflare Workers, Next.js 15 App Router, Expo 54 native mobile, and Drizzle ORM.
            </p>

            {/* Interactive Tabbed CLI Terminal Box */}
            <div className="max-w-xl mx-auto mb-10 rounded-2xl border border-border/60 bg-card p-2 sm:p-3 shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 text-xs font-mono text-muted-foreground mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-bold text-foreground">Scaffold CLI</span>
                </div>

                {/* Package Manager Selector Tabs */}
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md">
                  {(["npx", "pnpm", "bun"] as const).map((pm) => (
                    <button
                      key={pm}
                      onClick={() => setActiveTab(pm)}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        activeTab === pm ? "bg-primary text-white" : "hover:text-foreground"
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Command Display & One-Click Copy */}
              <div 
                onClick={handleCopyCli}
                className="flex items-center justify-between p-3 rounded-xl bg-black/80 dark:bg-black/90 font-mono text-xs text-emerald-400 cursor-pointer group active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-muted-foreground">$</span>
                  <span className="truncate font-bold">{cliCommands[activeTab]}</span>
                </div>
                <button className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white shrink-0 transition">
                  {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
              <Link
                href="/docs"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-95"
              >
                <span>Explore Documentation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/ParipoornaBhat/thunder-stack"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-8 text-xs sm:text-sm font-bold text-foreground shadow-xs hover:bg-accent transition-all active:scale-95"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>

          </div>
        </section>

        {/* 3D Tech Stack Architecture Visualizer Section */}
        <section id="architecture" className="py-12 sm:py-20 bg-card/30 border-b border-border/50 scroll-mt-24">
          <TechStack3D />
        </section>

        {/* Core 6-Pillar Architecture Grid */}
        <section className="py-16 sm:py-24 border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary block mb-2">
                Core Stack Pillars
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Engineered for High-Velocity Teams
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card shadow-xs space-y-4 hover:border-primary/50 transition">
                <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">Next.js 15 Web Client</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  App Router and React 19 Server Components for instantaneous page navigation and zero client-side hydration delays.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card shadow-xs space-y-4 hover:border-primary/50 transition">
                <div className="p-3 w-fit rounded-2xl bg-sky-500/10 text-sky-500">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">Hono Cloudflare Workers</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Sub-10ms global edge REST API execution with zero V8 cold starts across 300+ Cloudflare edge data centers.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card shadow-xs space-y-4 hover:border-primary/50 transition">
                <div className="p-3 w-fit rounded-2xl bg-purple-500/10 text-purple-500">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">Expo 54 Native Mobile</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Cross-platform iOS and Android native application using Expo Router with hardware-encrypted SecureStore auth.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card shadow-xs space-y-4 hover:border-primary/50 transition">
                <div className="p-3 w-fit rounded-2xl bg-amber-500/10 text-amber-500">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">Drizzle ORM & PostgreSQL</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  100% type-safe PostgreSQL database client with lazy-evaluated connection proxies and Aiven SSL handshake resolution.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card shadow-xs space-y-4 hover:border-primary/50 transition">
                <div className="p-3 w-fit rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">Better Auth & Session Shield</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Pre-seeded RBAC roles (Admin, Manager, User), email OTP verification, Google OAuth, and user-agent anti-hijacking.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card shadow-xs space-y-4 hover:border-primary/50 transition">
                <div className="p-3 w-fit rounded-2xl bg-slate-500/10 text-slate-500">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">TurboRepo Monorepo</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  High-speed cached builds, shared workspace packages (`@thunder/db`, `@thunder/shared`), and unified TypeScript types.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Code Inspector Section */}
        <section className="py-16 sm:py-24 bg-card/20 border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
                Developer Preview
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">
                Unified End-to-End Type Safety
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
                Inspect how cleanly backend Hono routes, Drizzle schemas, Next.js web clients, and Expo mobile screens communicate.
              </p>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm">
              {/* Code Tab Switcher */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30 overflow-x-auto">
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: "hono", label: "Edge Route (Hono)" },
                      { id: "schema", label: "RBAC Schema (Drizzle)" },
                      { id: "next", label: "Web Client (Next.js)" },
                      { id: "expo", label: "Mobile Client (Expo)" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCodeTab(t.id)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
                        codeTab === t.id
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/80"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-black/85 text-emerald-400 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre text-[11px] sm:text-xs leading-relaxed">{codeSnippets[codeTab]}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Everything you need to know about THUNDER Stack architecture and CLI workflow.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl border border-border/60 bg-card overflow-hidden transition"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-foreground hover:bg-accent/40 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3 bg-muted/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
