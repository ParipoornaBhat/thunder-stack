"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Key, ShieldCheck, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const res = await fetch(`${serverUrl}/api/users/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "OTP code sent successfully!");
        setStep(2);
      } else {
        toast.error(data.error || "No account found with this email");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const res = await fetch(`${serverUrl}/api/users/reset-password-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Password reset successfully!");
        router.push("/login");
      } else {
        toast.error(data.error || "Invalid or expired OTP");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-muted/30 dark:bg-background/95 px-4 sm:px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-linear-to-tr from-blue-600/10 via-indigo-600/5 to-transparent blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-xl backdrop-blur-xs relative z-10"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {step === 1 
              ? "Enter your email to receive a 6-digit verification code"
              : "Enter the code sent to your email and set your new password"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleRequestOtp}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-background/25"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-md shadow-blue-500/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send OTP Code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="otp"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm font-semibold tracking-widest transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-background/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  New Password
                </label>
                <div className="relative">
                  <Key className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="newPassword"
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-background/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Key className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-background/25"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-md shadow-blue-500/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
