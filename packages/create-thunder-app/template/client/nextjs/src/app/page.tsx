"use client";

import { ArrowRight, Calendar, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { SplashLoader } from "~/components/SplashLoader";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { useSession } from "~/lib/auth-client";

export default function HomePage() {
  const { data: session } = useSession();
  const primaryHref = session?.user ? "/dashboard" : "/login";
  const primaryLabel = session?.user ? "Dashboard" : "Get Started";

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      <SiteHeader />
      <SplashLoader />
      <style>{`
        @keyframes homeFadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <main
        className="flex-1 w-full"
        style={{
          opacity: 0,
          animation:
            "homeFadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) 1.8s forwards",
        }}
      >
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-10 pb-32 lg:pt-25 lg:pb-40">
          {/* Dynamic background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-100 bg-linear-to-tr from-primary/20 via-secondary/10 to-transparent blur-[120px] rounded-full pointer-events-none" />

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex flex-col items-center mb-8 select-none">
                <span className="text-[3.5vw] sm:text-[10px] md:text-[18px] lg:text-2xl font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                  THUNDER Stack Console
                </span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl mb-8">
                Accelerating Modern <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
                  Web Development
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
                A highly secure, role-based boilerplate designed to streamline
                user permissions, lazy database queries, and automatic state mapping
                across serverless stacks.
              </p>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={primaryHref}
                    className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-500 ease-in-out hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <Link
                  href="#features"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-input bg-background/50 backdrop-blur-sm px-8 text-sm font-medium shadow-sm transition-all duration-500 ease-in-out hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Explore Features
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-24 bg-muted/30 border-y border-border/50"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Designed for Excellence
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built with modern serverless technologies to ensure reliability, speed,
                and a premium developer experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Role-Based Access
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Granular permissions for standard users, managers, and
                  administrators ensure complete endpoint security and proper workflow
                  routing.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-secondary/20">
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Lazy Connections</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Lazy-initialized database client connection proxies eliminate cold start overhead
                  within Cloudflare Worker endpoints.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Session Shield</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automated user-agent validation protects against hijacked sessions, immediately
                  revoking copies from the database.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
