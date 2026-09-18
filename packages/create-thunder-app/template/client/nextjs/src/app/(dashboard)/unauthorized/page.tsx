"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-transparent px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[300px] bg-linear-to-tr from-red-600/10 via-indigo-600/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center z-10 space-y-6"
      >
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-md shadow-red-500/5">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Access Denied</h1>
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Error 403: Forbidden</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
            You do not have the required permissions to access this management area. Please contact your system administrator.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-semibold hover:bg-accent/50 cursor-pointer active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <Link
            href="/dashboard"
            className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer active:scale-[0.98] transition-all shadow-md shadow-blue-500/10"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
