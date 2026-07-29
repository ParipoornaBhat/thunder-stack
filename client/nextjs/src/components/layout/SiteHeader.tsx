"use client";

import { BookOpen, Database, Cloud, LayoutDashboard, LogOut, Moon, Sun, Github, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "~/lib/auth-client";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDocsOnly = process.env.NEXT_PUBLIC_IS_DOCS_ONLY === "true";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    try {
      await signOut();
      router.push("/");
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="w-full flex h-16 sm:h-20 items-center justify-between px-4 sm:px-12 lg:px-16">
        {/* Left - Logo & Main Nav */}
        <div className="flex items-center gap-6 sm:gap-8 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="relative h-9 w-9 sm:h-11 sm:w-11 shrink-0">
              <Image
                src="/logos/thunder.png"
                alt="THUNDER Stack Logo"
                fill
                priority
                sizes="44px"
                className="object-contain"
              />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
              THUNDER Stack
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/docs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              Docs
            </Link>
            <Link
              href="/docs/db-guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              <Database className="h-4 w-4 text-secondary" />
              DB Guide
            </Link>
            <Link
              href="/docs/deployment-guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              <Cloud className="h-4 w-4 text-sky-500" />
              Deploy Guide
            </Link>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile links */}
          <div className="flex md:hidden items-center gap-1 mr-1">
            <Link
              href="/docs"
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground text-xs font-semibold"
              title="Documentation"
            >
              Docs
            </Link>
            <Link
              href="/docs/db-guide"
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground text-xs font-semibold"
              title="DB Guide"
            >
              DB
            </Link>
            <Link
              href="/docs/deployment-guide"
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground text-xs font-semibold"
              title="Deploy"
            >
              Deploy
            </Link>
          </div>

          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}

          {/* GitHub / NPM Badge or Auth Buttons */}
          {isDocsOnly ? (
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/ParipoornaBhat/thunder-stack"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-muted/80 border border-border/50 px-4 text-xs font-semibold text-foreground hover:bg-accent transition-all animate-fade-in"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a
                href="https://www.npmjs.com/package/create-thunder-stack"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-muted/80 border border-border/50 px-4 text-xs font-semibold text-foreground hover:bg-accent transition-all animate-fade-in"
              >
                <Package className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="hidden sm:inline">NPM Package</span>
              </a>
            </div>
          ) : (
            !isPending &&
              (user ? (
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-black overflow-hidden text-sm font-semibold ring-2 ring-primary/20 hover:ring-primary/50 transition-all cursor-pointer"
                    aria-label="Open user menu"
                  >
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt={user.name ?? ""}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerText = initials;
                          }
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden z-50">
                      <div className="border-b border-border/50 px-4 py-3">
                        <p className="text-sm font-medium truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          Dashboard
                        </Link>
                        <div className="border-t border-border/50 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-all duration-300 hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Sign In
                </Link>
              ))
          )}
        </div>
      </div>
    </header>
  );
}
