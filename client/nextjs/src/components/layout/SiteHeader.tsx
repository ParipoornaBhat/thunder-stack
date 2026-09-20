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
    { href: "/#architecture", label: "Architecture" },
    { href: "/docs", label: "Docs" },
    { href: "/docs/db-guide", label: "DB Guide" },
    { href: "/docs/deployment-guide", label: "Deploy" },
  ];

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="w-full flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 rounded-lg border border-border/90 bg-card/95 backdrop-blur-xl shadow-xs transition-colors">
        
        {/* Left: Clean Logo & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-md overflow-hidden shadow-xs border border-border/60 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/logos/thunder.png"
                alt="THUNDER Stack Logo"
                fill
                priority
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                thunder.
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                v1.0.3
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Action CTA Button */}
        <div className="flex items-center">
          <button
            onClick={handleCopyCommand}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-md bg-primary text-primary-foreground text-xs font-mono font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            title="Click to copy CLI command"
          >
            <span className="hidden sm:inline">{CLI_COMMAND}</span>
            <span className="sm:hidden">Get Started</span>
            <div className="w-3.5 h-3.5 rounded bg-white/20 flex items-center justify-center shrink-0">
              {copiedCmd ? <Check className="w-2.5 h-2.5 text-white" /> : <Copy className="w-2.5 h-2.5 text-white" />}
            </div>
          </button>
        </div>

        {/* Right: Theme Toggle & Architectural Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Switcher */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* GitHub Star Link */}
          <a
            href="https://github.com/ParipoornaBhat/thunder-stack"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-card border border-border/70 px-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            <Github className="h-3.5 w-3.5" />
          </a>

          {/* Architectural Menu Trigger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/80 hover:bg-accent text-xs font-mono font-bold uppercase tracking-wider text-foreground transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <span className="text-[11px] font-sans font-bold">Menu</span>
            <div className="w-4 h-4 rounded-sm border border-foreground/60 flex flex-col justify-center items-center gap-[2.5px] p-[2px]">
              <span className="w-full h-[1px] bg-foreground/80" />
              <span className="w-full h-[1px] bg-foreground/80" />
              <span className="w-full h-[1px] bg-foreground/80" />
            </div>
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
