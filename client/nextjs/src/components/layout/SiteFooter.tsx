"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  return (
    <footer className="border-t border-border/40 bg-background pt-8 pb-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex flex-col items-center md:items-start gap-5 mb-5">
              <Link
                href="/"
                className="flex items-center gap-2 group mb-3"
              >
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                  <Image
                    src="/logos/thunder.png"
                    alt="THUNDER Stack Logo"
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                  THUNDER <span className="text-blue-500 group-hover:text-blue-400 transition-colors">Stack</span>
                </span>
              </Link>
              <Link
                href="https://github.com/ParipoornaBhat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold hover:text-primary transition-colors text-muted-foreground"
              >
                GitHub Repository
              </Link>
            </div>
            <p className="text-muted-foreground max-w-sm mx-auto md:mx-0 mb-4 leading-relaxed text-sm sm:text-base text-center md:text-left mt-4">
              THUNDER Stack boilerplate
              <br />
              Advanced RBAC User Management
              <br />
              High-performance Developer Console
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4 text-lg">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {isDashboard ? (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
                    >
                      Documentation
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
                    >
                      Documentation
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4 text-lg">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
                >
                  Guides
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} THUNDER Stack. All rights reserved.
          </p>
          <div className="flex flex-col items-center md:items-end gap-1.5">
            <p className="text-sm sm:text-base font-semibold text-foreground/90">
              Made by <span className="text-primary hover:underline cursor-default">Paripoorna B</span>
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Link href="https://github.com/ParipoornaBhat" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</Link>
              <span>&bull;</span>
              <Link href="https://www.linkedin.com/in/paripoorna-bhat/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
