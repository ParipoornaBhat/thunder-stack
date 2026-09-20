"use client";

import { 
  BookOpen, 
  Database, 
  Cloud, 
  LayoutDashboard, 
  LogOut, 
  Moon, 
  Sun, 
  Github, 
  Copy, 
  Check, 
  Menu, 
  X, 
  Terminal, 
  Layers, 
  ArrowUpRight,
  Code
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "~/lib/auth-client";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDocsOnly = process.env.NEXT_PUBLIC_IS_DOCS_ONLY === "true";
  const CLI_COMMAND = "npx create-thunder-stack";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(CLI_COMMAND);
    setCopiedCmd(true);
    toast.success("Command copied: npx create-thunder-stack");
    setTimeout(() => setCopiedCmd(false), 2200);
  };

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

  const navItems = [
    { href: "/", label: "Overview" },
    { href: "/#architecture", label: "3D Stack" },
    { href: "/docs", label: "Docs" },
    { href: "/docs/db-guide", label: "DB Guide" },
    { href: "/docs/deployment-guide", label: "Deploy" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl transition-colors">
      <div className="w-full flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        
        {/* Left: 3D Logo & Wordmark */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl overflow-hidden shadow-xs border border-border/60 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/logos/thunder.png"
                alt="THUNDER Stack Logo"
                fill
                priority
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                  THUNDER STACK
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                  v1.0.3
                </span>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground hidden sm:block">
                Architectural Serverless Boilerplate
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav aria-label="Header Navigation" className="hidden lg:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/40">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Interactive Terminal Pill, Theme Toggle & Auth */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* CLI One-Click Copy Pill */}
          <button
            onClick={handleCopyCommand}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-mono font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            title="Click to copy CLI command"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="truncate max-w-[170px]">{CLI_COMMAND}</span>
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {copiedCmd ? <Check className="w-2.5 h-2.5 text-white" /> : <Copy className="w-2.5 h-2.5 text-white" />}
            </div>
          </button>

          {/* GitHub Star Link */}
          <a
            href="https://github.com/ParipoornaBhat/thunder-stack"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-card border border-border/60 px-3.5 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            <Github className="h-3.5 w-3.5" />
            <span>Star</span>
          </a>

          {/* Theme Switcher */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          )}

          {/* Auth State Button / Profile Dropdown */}
          {!isDocsOnly && !isPending && (
            user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-card overflow-hidden text-xs sm:text-sm font-semibold ring-2 ring-primary/20 hover:ring-primary/50 transition-all cursor-pointer"
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden z-50">
                    <div className="border-b border-border/50 px-4 py-3 bg-muted/30">
                      <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-accent transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                      <div className="border-t border-border/50 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
                className="inline-flex h-8 sm:h-9 items-center justify-center rounded-full bg-foreground px-4 text-xs font-bold text-background transition-all duration-300 hover:bg-foreground/90"
              >
                Sign In
              </Link>
            )
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Architectural Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-2xl px-6 py-6 space-y-5 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Navigation Menu
            </span>
            <nav className="space-y-1 pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl font-bold text-sm text-foreground hover:bg-accent transition"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-3 border-t border-border/50 space-y-3">
            <button
              onClick={handleCopyCommand}
              className="flex w-full items-center justify-between p-3 rounded-xl bg-primary text-primary-foreground text-xs font-mono font-bold shadow-xs active:scale-95 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>{CLI_COMMAND}</span>
              </div>
              <Copy className="w-3.5 h-3.5" />
            </button>

            <a
              href="https://github.com/ParipoornaBhat/thunder-stack"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 p-3 rounded-xl border border-border/60 text-xs font-semibold hover:bg-accent transition"
            >
              <Github className="w-4 h-4" />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
