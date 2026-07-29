"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <footer className="border-t border-border/40 bg-background pt-10 pb-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex flex-col items-center md:items-start gap-4 mb-4">
              <Link
                href="/"
                className="flex items-center gap-2 group mb-2"
              >
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src="/logos/thunder.png"
                    alt="THUNDER Stack Logo"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                  THUNDER <span className="text-primary transition-colors">Stack</span>
                </span>
              </Link>
            </div>
            <p className="text-muted-foreground max-w-sm mx-auto md:mx-0 mb-4 leading-relaxed text-sm text-center md:text-left">
              High-performance, developer-first boilerplate with Next.js 15, Hono (Cloudflare Workers), Drizzle ORM, and Expo 54.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4 text-base">
              Documentation Hub
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Overview & Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/db-guide"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Database & Drizzle CLI Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/deployment-guide"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Vercel & Cloudflare Deploy Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4 text-base">
              Ecosystem & CLI
            </h3>
            <ul className="space-y-2.5">
              <li>
                <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-md text-foreground border border-border/50 inline-block">
                  npx create-thunder-app
                </span>
              </li>
              <li>
                <Link
                  href="https://github.com/ParipoornaBhat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  GitHub Repository
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} THUNDER Stack. All rights reserved.
          </p>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-xs font-medium text-foreground/90">
              Made by <span className="text-primary font-semibold">Paripoorna B</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
