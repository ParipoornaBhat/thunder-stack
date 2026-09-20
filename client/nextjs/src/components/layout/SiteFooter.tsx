"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Github, Linkedin, Package } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <footer className="border-t border-border/40 bg-background pt-10 pb-24 md:pb-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 mb-8 md:mb-10">
          <div className="col-span-1 md:col-span-2 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-4 mb-4">
              <Link
                href="/"
                className="flex items-center gap-2 group mb-1"
              >
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                  <Image
                    src="/logos/thunder.png"
                    alt="THUNDER Stack Logo"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <>
                  <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                    .footer-cursive-logo {
                      font-family: 'Dancing Script', cursive;
                      line-height: 1;
                    }
                  `}</style>
                  <span className="footer-cursive-logo text-amber-500 font-bold text-2xl sm:text-3xl">
                    Paripoorna B.
                  </span>
                </>
              </Link>
            </div>
            <p className="text-muted-foreground max-w-sm mx-auto md:mx-0 mb-4 leading-relaxed text-xs sm:text-sm">
              High-performance, developer-first boilerplate with Next.js 15, Hono (Cloudflare Workers), Drizzle ORM, and Expo 54.
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
              Documentation Hub
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
                >
                  Overview & Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/db-guide"
                  className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
                >
                  Database & Drizzle CLI Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/deployment-guide"
                  className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
                >
                  Vercel & Cloudflare Deploy Guide
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
              Ecosystem & CLI
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://www.npmjs.com/package/create-thunder-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono bg-muted px-2.5 py-1 rounded-md text-foreground hover:text-primary border border-border/50 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Package className="h-3.5 w-3.5 text-red-500" />
                  npx create-thunder-stack
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ParipoornaBhat/thunder-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm inline-flex items-center gap-1.5"
                >
                  <Github className="h-4 w-4" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/create-thunder-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm inline-flex items-center gap-1.5"
                >
                  <Package className="h-4 w-4 text-red-500" />
                  npm Registry Package
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} THUNDER Stack. All rights reserved.
          </p>
          <div className="flex flex-col items-center md:items-end gap-1.5">
            <p className="text-xs font-medium text-foreground/90">
              Made by{" "}
              <a
                href="https://paripoorna.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Paripoorna B
              </a>
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <a
                href="https://paripoorna.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
              >
                <Globe className="h-3.5 w-3.5" />
                paripoorna.me
              </a>
              <span>&bull;</span>
              <a
                href="https://github.com/ParipoornaBhat/thunder-stack"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
              <span>&bull;</span>
              <a
                href="https://www.linkedin.com/in/paripoorna-bhat/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
