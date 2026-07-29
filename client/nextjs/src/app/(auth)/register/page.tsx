"use client";

import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signUp } from "~/lib/auth-client";

const STUDENT_DOMAIN = "student.nitte.edu.in";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isDocsOnly = process.env.NEXT_PUBLIC_IS_DOCS_ONLY === "true";

  if (isDocsOnly) {
    return (
      <div className="flex w-full items-center justify-center bg-background min-h-[calc(100vh-160px)] px-4 py-12">
        <div className="max-w-md w-full p-8 rounded-3xl border border-border/50 bg-card text-center space-y-6 shadow-lg">
          <div className="p-4 w-fit mx-auto rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Loader2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground">Documentation Site Mode</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This deployment is running in <strong>Docs-Only Mode</strong> for the npm registry & showcase. To run full authentication, user registration, and database sessions locally, run:
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
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Registration failed");
      } else {
        toast.success("Account created successfully! Logging in...");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full bg-background min-h-[calc(100vh-80px)]">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden w-1/2 flex-col justify-center border-r border-border/50 bg-muted/30 p-10 lg:flex relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-linear-to-tr from-primary/20 via-secondary/10 to-transparent blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
              THUNDER Stack
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            State-of-the-art developer boilerplate featuring robust role-based access control,
            lazy-initialized database clients, and secure token session protection.
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex w-full flex-col justify-center px-4 sm:px-6 lg:w-1/2 lg:px-8 relative">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-8 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Sign Up
            </h2>
            <p className="text-sm text-muted-foreground">
              Create a secure institutional account to get started
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1"
              >
                Institutional Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={`yourname@${STUDENT_DOMAIN}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background pl-4 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Sign Up
            </button>
          </form>

          <p className="mt-12 mb-12 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
