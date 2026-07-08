"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center bg-background px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-linear-to-tr from-amber-500/10 via-red-500/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center z-10 space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-md shadow-amber-500/5"
        >
          <AlertTriangle className="h-10 w-10" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-foreground">404</h1>
          <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
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
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
