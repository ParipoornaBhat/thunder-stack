"use client";

import { BookOpen, Database, Cloud, LayoutDashboard, LogOut, Moon, Sun, Github, Mail, Phone, MessageSquare, ArrowUpRight, Home, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "~/lib/auth-client";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDocsOnly = process.env.NEXT_PUBLIC_IS_DOCS_ONLY === "true";

  // Dynamic Island States (Desktop)
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [renderText, setRenderText] = useState(true);
  const [forceCollapse, setForceCollapse] = useState(false);
  const lastScrollY = useRef(0);

  // Parallelogram Connect Popup States
  const [connectOpen, setConnectOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY < 40);
      setForceCollapse(false);

      if (currentScrollY < lastScrollY.current) {
        setIsScrollingUp(true);
      } else {
        setIsScrollingUp(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/docs", label: "Docs", icon: BookOpen },
    { href: "/docs/db-guide", label: "DB Guide", icon: Database },
    { href: "/docs/deployment-guide", label: "Deploy", icon: Cloud },
  ];

  const showFullNotch = !forceCollapse && (isAtTop || isScrollingUp || isFocused);

  useEffect(() => {
    if (showFullNotch) {
      const timer = setTimeout(() => {
        setRenderText(true);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setRenderText(false);
    }
  }, [showFullNotch]);

  const handleLinkClick = () => {
    setForceCollapse(true);
    setIsScrollingUp(false);
    setIsFocused(false);
  };

  const handleOpenConnect = () => {
    setIsClosing(false);
    setConnectOpen(true);
  };

  const handleCloseConnect = () => {
    setIsClosing(true);
    setTimeout(() => {
      setConnectOpen(false);
      setIsClosing(false);
    }, 450);
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        
        .cursive-logo {
          font-family: 'Dancing Script', cursive;
          color: #f2a93b;
          line-height: 1;
        }

        .dynamic-island-transition {
          transition: width 0.45s cubic-bezier(0.25, 1, 0.5, 1), 
                      background-color 0.4s ease, 
                      border-color 0.4s ease,
                      top 0.45s cubic-bezier(0.25, 1, 0.5, 1),
                      border-radius 0.45s cubic-bezier(0.25, 1, 0.5, 1),
                      height 0.45s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .skewed-card-container {
          position: relative;
          width: min(92vw, 500px);
          height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .skewed-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
        }

        .skewed-yellow {
          background: #f2a93b;
          transform: translateX(-150%) skewX(-14deg);
          box-shadow: -10px 10px 30px rgba(0, 0, 0, 0.3);
          z-index: 1;
        }

        .skewed-white {
          background: #ffffff;
          transform: translateX(150%) skewX(-14deg);
          box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.2);
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 36px;
          border: 1px solid #e5e7eb;
        }

        .popup-active .skewed-yellow {
          transform: translateX(-10px) skewX(-14deg);
        }

        .popup-active .skewed-white {
          transform: translateX(10px) skewX(-14deg);
          transition-delay: 0.1s;
        }

        .popup-closing .skewed-yellow {
          transform: translateX(-150%) skewX(-14deg);
        }

        .popup-closing .skewed-white {
          transform: translateX(150%) skewX(-14deg);
          transition-delay: 0s;
        }

        .skew-counter-content {
          transform: skewX(14deg);
          width: 100%;
          color: #171717;
        }

        @media (max-width: 640px) {
          .skewed-card-container {
            width: min(92vw, 360px);
            height: 430px;
          }
          .skewed-yellow {
            transform: translateY(-150%) skewX(-6deg);
          }
          .skewed-white {
            transform: translateY(150%) skewX(-6deg);
            padding: 20px 24px;
          }
          .popup-active .skewed-yellow {
            transform: translateY(-6px) skewX(-6deg);
          }
          .popup-active .skewed-white {
            transform: translateY(6px) skewX(-6deg);
          }
          .popup-closing .skewed-yellow {
            transform: translateY(-150%) skewX(-6deg);
          }
          .popup-closing .skewed-white {
            transform: translateY(150%) skewX(-6deg);
          }
          .skew-counter-content {
            transform: skewX(6deg);
          }
        }
      `}</style>

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="w-full flex h-16 sm:h-20 items-center justify-between px-3 sm:px-8 lg:px-16 max-w-7xl mx-auto">
          
          {/* Left - Cursive Signature Logo */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                <Image
                  src="/logos/thunder.png"
                  alt="THUNDER Stack Logo"
                  fill
                  priority
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="cursive-logo text-xl sm:text-2xl font-bold hover:scale-102 transition duration-200">
                Paripoorna B.
              </span>
            </Link>
          </div>

          {/* Spacer for desktop dynamic island */}
          <div className="hidden md:block md:flex-1" />

          {/* Right - Connect Button, Theme Toggle, & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={handleOpenConnect}
              className="flex items-center space-x-1.5 px-3 sm:px-4.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] sm:text-xs transition shadow-sm cursor-pointer active:scale-95"
            >
              <span>CONNECT</span>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white flex items-center justify-center text-neutral-900">
                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            </button>

            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full p-1.5 sm:p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 cursor-pointer"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            )}

            {/* GitHub Badge (Docs mode) or Auth */}
            {isDocsOnly ? (
              <div className="hidden sm:flex items-center gap-2">
                <a
                  href="https://github.com/ParipoornaBhat/thunder-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 sm:h-9 items-center justify-center gap-2 rounded-full bg-muted/80 border border-border/50 px-3 sm:px-4 text-xs font-semibold text-foreground hover:bg-accent transition-all"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              </div>
            ) : (
              !isPending &&
                (user ? (
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((o) => !o)}
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white dark:bg-black overflow-hidden text-xs sm:text-sm font-semibold ring-2 ring-primary/20 hover:ring-primary/50 transition-all cursor-pointer"
                    >
                      {user.image ? (
                        <img src={user.image} alt={user.name ?? ""} className="h-full w-full object-contain" />
                      ) : (
                        initials
                      )}
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden z-50">
                        <div className="border-b border-border/50 px-4 py-3">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
                    className="inline-flex h-8 sm:h-9 items-center justify-center rounded-full bg-foreground px-3.5 sm:px-5 text-xs sm:text-sm font-medium text-background transition-all duration-300 hover:bg-foreground/90"
                  >
                    Sign In
                  </Link>
                ))
            )}
          </div>
        </div>
      </header>

      {/* Desktop Floating Center Sticky Dynamic Island Menu (md+) */}
      <div
        onMouseEnter={() => setIsFocused(true)}
        onMouseLeave={() => setIsFocused(false)}
        className={`hidden md:flex fixed left-1/2 -translate-x-1/2 z-50 dynamic-island-transition items-center justify-center space-x-1 shadow-xl border bg-neutral-950/95 border-neutral-800 text-neutral-400 backdrop-blur-md overflow-hidden flex-nowrap ${
          isAtTop
            ? "top-0 rounded-b-3xl rounded-t-none border-t-0 h-11"
            : "top-6 rounded-full h-11"
        }`}
        style={{
          width: showFullNotch ? "420px" : "165px",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`relative flex items-center justify-center transition-all duration-300 h-8 flex-shrink-0 ${
                isAtTop ? "rounded-xl" : "rounded-2xl"
              } ${
                showFullNotch
                  ? "w-24 text-xs font-bold uppercase tracking-wider"
                  : "w-8 p-1.5"
              } ${
                isActive
                  ? "bg-white text-neutral-950 font-black shadow-md"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center whitespace-nowrap overflow-hidden">
                {showFullNotch && renderText ? (
                  <span>{item.label}</span>
                ) : (
                  <Icon className="w-4.5 h-4.5" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile Floating Dynamic Dock Menu (Fixed at Bottom for thumb-reach accessibility) */}
      <nav 
        aria-label="Mobile Navigation"
        className="flex md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 items-center justify-around gap-1 p-1.5 rounded-full bg-neutral-950/92 dark:bg-neutral-950/92 border border-neutral-800 shadow-2xl backdrop-blur-xl max-w-[calc(100vw-24px)] w-[360px] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-white text-neutral-950 font-bold shadow-md scale-102"
                  : "text-neutral-400 hover:text-white active:bg-neutral-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] tracking-tight leading-none mt-0.5 font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Full-Screen Connect overlay featuring skewed sliding Parallelogram pop-up card */}
      {connectOpen && (
        <div
          onClick={handleCloseConnect}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 transition-all duration-500 ease-in-out ${
            isClosing ? "backdrop-blur-[0px] opacity-0" : "backdrop-blur-[8px] opacity-100"
          } ${isClosing ? "popup-closing" : "popup-active"}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="skewed-card-container"
          >
            {/* Yellow Background layer sliding from left */}
            <div className="skewed-layer skewed-yellow rounded-2xl"></div>

            {/* White Foreground layer sliding from right holding counter-skewed text details */}
            <div className="skewed-layer skewed-white rounded-2xl">
              <div className="skew-counter-content space-y-4 sm:space-y-6 relative">
                {/* Top Close Button for Mobile Accessibility */}
                <button
                  onClick={handleCloseConnect}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center space-y-0.5 sm:space-y-1">
                  <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight text-neutral-900">Let's Connect</h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest">Direct Access Channels</p>
                </div>

                {/* Connection Options */}
                <div className="space-y-2 sm:space-y-2.5">
                  <a
                    href="mailto:paripoornabhat@gmail.com"
                    className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl border border-neutral-200 hover:border-amber-500 hover:bg-neutral-50 transition text-neutral-800 font-medium text-xs active:scale-[0.99]"
                  >
                    <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Email Address</div>
                      <span className="font-semibold text-neutral-800 font-mono text-[11px] sm:text-xs truncate block">paripoornabhat@gmail.com</span>
                    </div>
                  </a>

                  <a
                    href="tel:+917338652017"
                    className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl border border-neutral-200 hover:border-amber-500 hover:bg-neutral-50 transition text-neutral-800 font-medium text-xs active:scale-[0.99]"
                  >
                    <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Phone Number</div>
                      <span className="font-semibold text-neutral-800 font-mono text-[11px] sm:text-xs truncate block">+91 7338652017</span>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/917338652017?text=Hi%20Paripoorna,%20let's%20collaborate!"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl border border-neutral-200 hover:border-emerald-500 hover:bg-neutral-50 transition text-neutral-800 font-medium text-xs active:scale-[0.99]"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-400 font-bold">WhatsApp Messenger</div>
                      <span className="font-semibold text-neutral-800 text-[11px] sm:text-xs truncate block">Direct instant text message</span>
                    </div>
                  </a>
                </div>

                {/* Close Trigger Button */}
                <div className="text-center pt-1">
                  <button
                    onClick={handleCloseConnect}
                    className="px-5 sm:px-6 py-2 rounded-xl bg-neutral-900 text-white text-[11px] sm:text-xs font-bold hover:bg-neutral-800 transition uppercase tracking-wider shadow cursor-pointer active:scale-95"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
