"use client";

import Image from "next/image";
import Link from "next/link";
import { Globe, Github, Linkedin, Package, Activity, Terminal } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/60 pt-12 pb-16 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          
          {/* Column 1: Brand & Status */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-8 w-8 shrink-0 rounded-xl overflow-hidden border border-border/60">
                <Image
                  src="/logos/thunder.png"
                  alt="THUNDER Stack Logo"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="font-extrabold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                THUNDER STACK
              </span>
            </Link>

            <p className="text-muted-foreground leading-relaxed text-xs">
              Developer-first serverless architecture linking Next.js 15, Hono (Cloudflare Workers), Drizzle ORM, and Expo 54.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Column 2: Documentation Hub */}
          <div>
            <h3 className="font-extrabold text-foreground mb-3 text-xs uppercase tracking-widest font-mono">
              Documentation
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Overview & Architecture
                </Link>
              </li>
              <li>
                <Link href="/docs/db-guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  Database & Drizzle CLI Guide
                </Link>
              </li>
              <li>
                <Link href="/docs/deployment-guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  Vercel & Cloudflare Deploy Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Ecosystem & CLI */}
          <div>
            <h3 className="font-extrabold text-foreground mb-3 text-xs uppercase tracking-widest font-mono">
              Ecosystem & CLI
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.npmjs.com/package/create-thunder-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <Package className="h-3.5 w-3.5 text-red-500" />
                  npm Registry Package
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ParipoornaBhat/thunder-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded text-foreground border border-border/40 inline-flex items-center gap-1">
                  <Terminal className="h-3 w-3 text-primary" />
                  npx create-thunder-stack
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect & Credits */}
          <div>
            <h3 className="font-extrabold text-foreground mb-3 text-xs uppercase tracking-widest font-mono">
              Connect
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                Crafted with precision by{" "}
                <a
                  href="https://paripoorna.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold hover:underline"
                >
                  Paripoorna B
                </a>
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://paripoorna.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-border/60 hover:bg-accent text-foreground transition"
                  title="Portfolio"
                >
                  <Globe className="h-4 w-4" />
                </a>
                <a
                  href="https://github.com/ParipoornaBhat/thunder-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-border/60 hover:bg-accent text-foreground transition"
                  title="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/paripoorna-bhat/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-border/60 hover:bg-accent text-foreground transition"
                  title="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} THUNDER Stack. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Next.js 15</span>
            <span>&bull;</span>
            <span>Cloudflare Workers</span>
            <span>&bull;</span>
            <span>Drizzle ORM</span>
            <span>&bull;</span>
            <span>Expo 54</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
