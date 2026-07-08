"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth-client";
import { motion } from "framer-motion";
import { Shield, Sparkles, User, Info, Key, Fingerprint } from "lucide-react";
import Link from "next/link";

import { useDashboard } from "../layout";

interface DashboardStats {
  usersCount: number | null;
  rolesCount: number | null;
  permissionsCount: number | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { profile } = useDashboard();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
        const headers: Record<string, string> = {};
        if (session?.session?.token) {
          headers["Authorization"] = `Bearer ${session.session.token}`;
        }
        const res = await fetch(`${serverUrl}/api/users/dashboard-stats`, {
          credentials: "include",
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header welcome banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-xs"
      >
        <div className="absolute top-[-50%] right-[-10%] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Welcome, {session?.user?.name || "User"} <Sparkles className="h-6 w-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              You are logged in to the THUNDER Stack console. Here is your security configuration.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2 border border-blue-500/25">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              Active: {profile?.activeRole?.displayName || "Loading..."}
            </span>
          </div>
        </div>
      </motion.div>

      {/* System Statistics Section */}
      {stats && (stats.usersCount !== null || stats.rolesCount !== null || stats.permissionsCount !== null) && (
        <motion.div variants={itemVariants} className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {stats.usersCount !== null && (
            <Link href="/users" className="block">
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs hover:border-blue-500/30 transition-all group relative overflow-hidden cursor-pointer">
                <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground">{stats.usersCount}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Total Registered Users</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {stats.rolesCount !== null && (
            <Link href="/roles" className="block">
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs hover:border-indigo-500/30 transition-all group relative overflow-hidden cursor-pointer">
                <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground">{stats.rolesCount}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Configured System Roles</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {stats.permissionsCount !== null && (
            <Link href="/roles" className="block">
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs hover:border-emerald-500/30 transition-all group relative overflow-hidden cursor-pointer">
                <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground">{stats.permissionsCount}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">System Permissions</p>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </motion.div>
      )}

      {/* Grid of detail cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Profile Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" /> User Profile Info
          </h2>
          <div className="space-y-3.5 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">User Name</p>
              <p className="font-semibold text-foreground mt-0.5">{session?.user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Email Address</p>
              <p className="font-semibold text-foreground mt-0.5">{session?.user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Session Created</p>
              <p className="font-semibold text-foreground mt-0.5">
                {session?.session?.createdAt ? new Date(session.session.createdAt).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Active Role Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-indigo-500" /> Active Role details
          </h2>
          {profile?.activeRole ? (
            <div className="space-y-3.5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Role Display Name</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.activeRole.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">System ID</p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5 break-all select-all">{profile.activeRole.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Privilege Status</p>
                <p className="mt-1">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    profile.activeRole.name === 'admin' 
                      ? 'bg-red-500/10 text-red-500 ring-red-500/25' 
                      : 'bg-green-500/10 text-green-500 ring-green-500/25'
                  }`}>
                    {profile.activeRole.name === 'admin' ? 'Superuser' : 'Standard User'}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Loading active role...
            </div>
          )}
        </motion.div>

        {/* Security Session Details Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs md:col-span-2 lg:col-span-1"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-violet-500" /> Session Details
          </h2>
          <div className="space-y-3.5 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">IP Address</p>
              <p className="font-semibold text-foreground mt-0.5">{session?.session?.ipAddress || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">User Agent</p>
              <p className="font-semibold text-foreground mt-0.5 text-xs break-all break-words leading-relaxed">
                {session?.session?.userAgent || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Authentication Host</p>
              <p className="font-semibold text-foreground mt-0.5">Hono (Cloudflare Workers)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Permissions List Card */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs"
      >
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-500" /> Authorized Permissions ({profile?.permissions.length || 0})
        </h2>
        {profile?.permissions && profile.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {profile.permissions.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400"
              >
                {p}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {profile?.activeRole?.name === "admin" 
              ? "Administrator has access to all permissions by default." 
              : "No specific permissions granted for this role."}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
