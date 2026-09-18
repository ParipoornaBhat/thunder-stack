"use client";

import { useEffect, useState, useRef, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "~/lib/auth-client";
import { ThemeToggle } from "~/components/theme-toggle";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { Breadcrumbs } from "~/components/ui/Breadcrumbs";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { 
  Users, 
  Shield, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  UserCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProfileData {
  user: any;
  activeRole: { id: string; name: string; displayName: string } | null;
  permissions: string[];
  roles: Array<{ id: string; name: string; displayName: string; isActive: boolean }>;
}

interface DashboardContextType {
  profile: ProfileData | null;
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardLayout/Provider");
  }
  return context;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDocsOnly = process.env.NEXT_PUBLIC_IS_DOCS_ONLY === "true";

  const fetchProfile = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {};
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/users/profile`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 401 && !isDocsOnly) {
        await signOut();
        router.replace("/login");
      }
    } catch (err) {
      console.error("Failed to load profile details", err);
    }
  };

  useEffect(() => {
    if (!isDocsOnly) {
      if (!isPending && !session) {
        router.replace("/login");
      } else if (session) {
        fetchProfile();
      }
    }
  }, [session, isPending, isDocsOnly]);

  if (isDocsOnly) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background selection:bg-primary/30">
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0">
              <Image src="/logos/thunder.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-lg font-extrabold text-foreground">THUNDER Stack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/docs" className="text-xs font-semibold text-muted-foreground hover:text-foreground">Docs</Link>
            <Link href="/docs/db-guide" className="text-xs font-semibold text-muted-foreground hover:text-foreground">DB Guide</Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl border border-border/50 bg-card text-center space-y-6 shadow-xl">
            <div className="p-4 w-fit mx-auto rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground">User Dashboard</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This live deployment is running in <strong>Docs-Only Mode</strong>. To test the active RBAC Dashboard, User Profile Switcher, and Permission Management with a live database, run:
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/40 p-3 font-mono text-xs text-primary font-bold">
              npx create-thunder-app
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/docs"
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
              >
                Explore Docs
              </Link>
              <Link
                href="/docs/db-guide"
                className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-background text-foreground text-xs font-semibold hover:bg-accent transition-all"
              >
                DB Guide
              </Link>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleRoleSwitch = async (roleId: string) => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/users/switch-role`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ roleId }),
      });

      if (res.ok) {
        toast.success("Switched active role!");
        setRoleDropdownOpen(false);
        window.location.reload();
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to switch role");
      }
    } catch {
      toast.error("An error occurred while switching roles");
    }
  };

  if (isPending || !session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/users", icon: Users, permission: "users:view" },
    { name: "Roles & Permissions", href: "/roles", icon: Shield, permission: "roles:manage" },
    { name: "My Profile", href: "/profile", icon: UserCircle },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    if (profile?.activeRole?.name === "admin") return true;
    return profile?.permissions.includes(item.permission);
  });

  return (
    <DashboardContext.Provider value={{ profile, loadingProfile: !profile, refreshProfile: fetchProfile }}>
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden selection:bg-primary/30">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/55 backdrop-blur-xl shrink-0">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl md:hidden text-muted-foreground hover:bg-accent cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="relative h-9 w-9 shrink-0">
                  <Image
                    src="/logos/thunder.png"
                    alt="THUNDER Stack Logo"
                    fill
                    priority
                    sizes="36px"
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
                  THUNDER Stack
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="hidden sm:inline-block text-xs font-bold text-muted-foreground">
                {session.user.name}
              </div>
            </div>
          </div>
        </header>

        {/* Main Container below Header */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile Drawer Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 z-40 bg-black/80 md:hidden"
                />

                {/* Drawer Content */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background p-6 shadow-2xl border-r border-border/40 md:hidden"
                >
                  <div className="flex items-center justify-between mb-8">
                    <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
                      <div className="relative h-9 w-9">
                        <Image
                          src="/logos/thunder.png"
                          alt="THUNDER Stack Logo"
                          fill
                          sizes="36px"
                          className="object-contain"
                        />
                      </div>
                      <span className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
                        THUNDER Stack
                      </span>
                    </Link>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-accent cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Navigation Links (Mobile) */}
                  <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                    {filteredNavigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                            isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3 shrink-0" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Mobile Sign Out */}
                  <div className="border-t border-border/40 pt-4 mt-auto">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center px-3 py-2.5 text-sm font-semibold text-muted-foreground rounded-xl transition-all hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    >
                      <LogOut className="h-4.5 w-4.5 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar */}
          <aside
            className={`hidden md:flex flex-col border-r border-border/40 bg-background/55 backdrop-blur-xl shrink-0 transition-all duration-300 relative ${
              isMinimized ? "w-20" : "w-64"
            }`}
          >
            {/* Resize Toggle Button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground shadow-sm transition-all hover:bg-accent z-30 cursor-pointer"
              title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
            >
              {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Navigation Links (Desktop) */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isMinimized ? item.name : undefined}
                    className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    } ${isMinimized ? "justify-center" : ""}`}
                  >
                    <div className={`relative flex items-center justify-center ${isMinimized ? "" : "mr-3"}`}>
                      <Icon className="h-5 w-5 shrink-0 transition-colors" />
                    </div>
                    {!isMinimized && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Role Switcher & Sign Out (Desktop Bottom) */}
            <div className="border-t border-border/40 p-3 bg-muted/10 space-y-2 shrink-0">
              {profile && profile.roles.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  {profile.roles.length > 1 ? (
                    <>
                      <button
                        onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                        className={`w-full flex items-center rounded-xl border border-border/50 bg-background px-3 py-2.5 text-xs font-bold transition-all hover:bg-accent cursor-pointer ${
                          isMinimized ? "justify-center" : "justify-between"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`relative flex items-center justify-center ${isMinimized ? "" : "mr-2"}`}>
                            <Shield className="h-4 w-4 shrink-0 text-primary" />
                          </div>
                          {!isMinimized && (
                            <span className="truncate uppercase tracking-wider">
                              {profile.activeRole?.displayName || "Role"}
                            </span>
                          )}
                        </div>
                        {!isMinimized && <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${roleDropdownOpen ? "-rotate-90" : ""}`} />}
                      </button>

                      <AnimatePresence>
                        {roleDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className={`absolute bottom-full left-0 mb-2 bg-popover/90 border border-border/50 rounded-2xl shadow-xl p-1.5 backdrop-blur-2xl z-30 ${
                              isMinimized ? "w-48" : "w-full"
                            }`}
                          >
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-3 py-2">Switch Active Role</p>
                            <div className="h-px bg-border/40 my-1" />
                            {profile.roles.map((r) => (
                              <button
                                key={r.id}
                                onClick={() => handleRoleSwitch(r.id)}
                                className={`flex w-full items-center justify-between px-3 py-2 text-xs font-bold rounded-xl text-left transition-colors cursor-pointer ${
                                  r.isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground hover:bg-accent"
                                }`}
                              >
                                <span>{r.displayName}</span>
                                {r.isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <div
                      className={`w-full flex items-center rounded-xl border border-border/40 bg-muted/40 px-3 py-2.5 text-xs font-bold ${
                        isMinimized ? "justify-center" : "justify-start"
                      }`}
                    >
                      <div className={`relative flex items-center justify-center ${isMinimized ? "" : "mr-2"}`}>
                        <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      {!isMinimized && (
                        <span className="truncate uppercase tracking-wider text-muted-foreground">
                          {profile.activeRole?.displayName || "Role"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSignOut}
                title={isMinimized ? "Sign Out" : undefined}
                className={`flex w-full items-center px-3 py-2.5 text-sm font-semibold text-muted-foreground rounded-xl transition-all hover:bg-destructive/10 hover:text-destructive cursor-pointer ${
                  isMinimized ? "justify-center" : ""
                }`}
              >
                <div className={`relative flex items-center justify-center ${isMinimized ? "" : "mr-3"}`}>
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                </div>
                {!isMinimized && <span>Sign Out</span>}
              </button>
            </div>
          </aside>

          {/* Scrollable Main Content Area */}
          <main className="flex-1 min-w-0 overflow-y-auto flex flex-col relative">
            <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto relative z-10 animate-in fade-in duration-500">
              <Breadcrumbs />
              {children}
            </div>
            <SiteFooter />
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
