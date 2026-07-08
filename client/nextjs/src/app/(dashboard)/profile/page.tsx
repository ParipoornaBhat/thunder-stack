"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Shield, Key, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useDashboard } from "../layout";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const { profile, loadingProfile, refreshProfile } = useDashboard();
  
  // OTP States
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = Trigger OTP, 2 = Verify OTP & Update Password
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleSendOtp = async () => {
    if (!session?.user?.email) return;

    setUpdatingPassword(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const res = await fetch(`${serverUrl}/api/users/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session.user.email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Verification code sent to your email!");
        setStep(2);
      } else {
        toast.error(data.error || "Failed to trigger OTP verification");
      }
    } catch {
      toast.error("An error occurred while sending verification code");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;

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

    setUpdatingPassword(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const res = await fetch(`${serverUrl}/api/users/reset-password-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          otp,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated successfully! You can now log in using credentials too.");
        setStep(1);
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Invalid or expired OTP code");
      }
    } catch {
      toast.error("An error occurred while resetting the password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (isPending || loadingProfile || !session) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl flex items-center gap-3">
          <UserCircle className="h-9 w-9 text-primary" />
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account information, security credentials, and active roles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Card - User info */}
        <div className="md:col-span-1 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">{session.user.name}</h2>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </div>
          </div>

          <div className="h-px bg-border/40" />

          {/* Role details */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                Active System Role
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                <Shield className="h-3.5 w-3.5" />
                {profile?.activeRole?.displayName || "Standard User"}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                Available Roles
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile?.roles.map((r) => (
                  <span
                    key={r.id}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-border bg-muted/40 text-muted-foreground"
                  >
                    {r.displayName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card - Password Reset With OTP */}
        <div className="md:col-span-2 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Forgot / Reset Password
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reset your credentials or set up a password for standard log-in.
            </p>
          </div>

          <div className="h-px bg-border/40" />

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="request-otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border/40 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground space-y-2.5">
                  <p className="font-semibold text-foreground">Forgot password or setting up credential log-in?</p>
                  <p>
                    If you forgot your password or initially signed in with Google, click the button below to send a 6-digit verification code to your registered email to configure a new credential password.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendOtp}
                    disabled={updatingPassword}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/95 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {updatingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Forgot / Reset Password
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="verify-otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleUpdatePassword}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                        className="h-10 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm font-semibold tracking-widest transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                        className="h-10 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/95 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {updatingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={updatingPassword}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background/50 px-6 text-sm font-semibold transition-all hover:bg-accent focus:outline-hidden cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
