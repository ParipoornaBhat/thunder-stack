"use client";

import {
  Cloud,
  Globe,
  Server,
  Zap,
  CheckCircle2,
  Terminal,
  ArrowRight,
  ShieldAlert,
  Code,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";

export default function DeploymentGuidePage() {
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
          <span className="text-foreground font-bold">Vercel & Cloudflare Deployment Guide</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
            <Cloud className="h-3.5 w-3.5" />
            <span>Multi-Platform Production Deployment</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Vercel & Cloudflare Deployment Guide
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Deploy the THUNDER Next.js web client to Vercel or Cloudflare Pages, and deploy the Hono API server globally to Cloudflare Workers with Wrangler.
          </p>
        </div>

        <div className="h-px bg-border/60 mb-12" />

        {/* Platform Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-xs space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-black dark:bg-white/10 text-white dark:text-foreground">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">1. Vercel (Frontend)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Zero-config deployment for the Next.js App Router client using root <code className="text-primary font-mono text-[11px]">vercel.json</code>.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-xs space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-amber-500/10 text-amber-500">
              <Cloud className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">2. Cloudflare Pages (Frontend)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Edge deployment for Next.js using <code className="text-amber-500 font-mono text-[11px]">@cloudflare/next-on-pages</code>.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-xs space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-orange-500/10 text-orange-500">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">3. Cloudflare Workers (Backend)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sub-millisecond global execution for the Hono REST API server using Wrangler.
            </p>
          </div>
        </div>

        {/* Section 1: Vercel Deployment */}
        <section id="vercel" className="space-y-6 mb-20 scroll-mt-28">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-black dark:bg-white/10 text-white dark:text-foreground">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Deploying Next.js Frontend to Vercel</h2>
              <p className="text-xs text-muted-foreground">
                Official Vercel Web Dashboard import & zero-config deployment guide.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Step A */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Vercel Web Dashboard Import (Recommended)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When importing your GitHub repository into the <strong>Vercel Web Dashboard</strong>:
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Root Directory:</strong> Click <strong>Edit</strong> next to Root Directory and set it to <code className="text-primary font-mono font-bold">./</code> (Root Directory).
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Framework Preset:</strong> Select <code className="text-foreground font-mono font-bold">Next.js</code>.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Environment Variables:</strong> Add <code className="text-primary font-mono font-bold">NEXT_PUBLIC_IS_DOCS_ONLY</code> = <code className="text-emerald-500 font-mono font-bold">true</code>.
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-3 rounded-xl border border-border/40">
                💡 <strong>Why `./` Root Directory?</strong> The repository includes a root <code className="font-mono">vercel.json</code> file. Setting Root Directory to <code className="font-mono">./</code> enables zero-config deployment so Vercel automatically runs <code className="font-mono">pnpm --filter nextjs build</code> without requiring manual command overrides!
              </p>
            </div>

            {/* Step B */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Manual Overrides (If Root Directory is set to `client/nextjs`)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you keep the Root Directory as <code className="text-foreground font-mono text-xs">client/nextjs</code>, toggle the <strong>Build and Output Settings</strong> override switches to ON:
              </p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1.5 font-mono">
                <li>Build Command Override: <code className="text-primary font-bold">pnpm build</code></li>
                <li>Install Command Override: <code className="text-primary font-bold">pnpm install --prefix=../..</code></li>
                <li>Environment Variable: <code className="text-primary font-bold">NEXT_PUBLIC_IS_DOCS_ONLY=true</code></li>
              </ul>
            </div>

            {/* Step C */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                Environment Variables Reference
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-foreground">
                      <th className="py-2 px-3 font-bold">Variable Key</th>
                      <th className="py-2 px-3 font-bold">Docs-Only Live Site</th>
                      <th className="py-2 px-3 font-bold">Full App Deployment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-muted-foreground font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-primary">NEXT_PUBLIC_IS_DOCS_ONLY</td>
                      <td className="py-2.5 px-3 text-emerald-500 font-bold">true</td>
                      <td className="py-2.5 px-3 text-amber-500">false</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-primary">NEXT_PUBLIC_SERVER_URL</td>
                      <td className="py-2.5 px-3">https://your-hono-api.workers.dev</td>
                      <td className="py-2.5 px-3">https://your-hono-api.workers.dev</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Cloudflare Pages Deployment */}
        <section id="cloudflare-pages" className="space-y-6 mb-20 scroll-mt-28">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Deploying Next.js Frontend to Cloudflare Pages</h2>
              <p className="text-xs text-muted-foreground">
                Deploying Next.js edge assets using the modern, officially recommended <code className="text-amber-500 font-mono text-xs">@opennextjs/cloudflare</code> adapter.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
            <h3 className="font-bold text-foreground text-lg">Build & Deploy Commands</h3>
            <div className="rounded-xl border border-border/40 bg-muted/40 dark:bg-black/40 p-4 font-mono text-xs text-foreground space-y-4">
              <div>
                <span className="text-amber-500 font-bold"># Step 1: Build Next.js for Cloudflare Pages (OpenNext)</span>
                <pre className="text-emerald-400 mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm build:web:cf</pre>
              </div>
              <div>
                <span className="text-amber-500 font-bold"># Step 2: Deploy compiled output (.open-next/.deploy) to Cloudflare</span>
                <pre className="text-emerald-400 mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm deploy:web:cf</pre>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ensure the <code className="text-foreground font-mono text-xs">nodejs_compat</code> compatibility flag is enabled in your Cloudflare Pages project settings under <strong>Settings &gt; Functions &gt; Compatibility flags</strong>.
            </p>
          </div>
        </section>

        {/* Section 3: Cloudflare Workers Deployment */}
        <section id="cloudflare-workers" className="space-y-6 mb-20 scroll-mt-28">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Deploying Hono Backend to Cloudflare Workers</h2>
              <p className="text-xs text-muted-foreground">
                Global serverless API deployment using Wrangler CLI.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
            <h3 className="font-bold text-foreground text-lg">Wrangler Deployment Walkthrough</h3>
            <div className="rounded-xl border border-border/40 bg-muted/40 dark:bg-black/40 p-4 font-mono text-xs text-foreground space-y-4">
              <div>
                <span className="text-orange-500 font-bold"># Step 1: Set Secret Environment Variables in Cloudflare</span>
                <pre className="text-emerald-400 mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">npx wrangler secret put DATABASE_URL --cwd server/hono
npx wrangler secret put BETTER_AUTH_SECRET --cwd server/hono</pre>
              </div>
              <div>
                <span className="text-orange-500 font-bold"># Step 2: Deploy Backend to Cloudflare Workers</span>
                <pre className="text-emerald-400 mt-1 select-all bg-card/65 p-2 rounded-xl border border-border/30">pnpm deploy:server</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-background to-secondary/10">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-foreground">Need Database CLI Assistance?</h3>
            <p className="text-xs text-muted-foreground">
              Learn how to generate schema migrations, seed roles, and run diagnostic status checks.
            </p>
          </div>
          <Link
            href="/docs/db-guide"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shrink-0 shadow-md"
          >
            <span>View Database Guide</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
