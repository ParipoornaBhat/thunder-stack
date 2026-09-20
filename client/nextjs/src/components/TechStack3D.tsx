"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Globe, 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  Database, 
  Layers, 
  Check, 
  Copy, 
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Terminal,
  Activity,
  Cpu,
  Lock
} from "lucide-react";
import { toast } from "sonner";

export interface StackLayer {
  id: string;
  name: string;
  category: string;
  badge: string;
  icon: any;
  color: string;
  accentBg: string;
  description: string;
  metrics: { label: string; value: string }[];
  codeSnippet: string;
  features: string[];
}

export const STACK_LAYERS: StackLayer[] = [
  {
    id: "clients",
    name: "Web & Mobile Clients",
    category: "Presentation Layer",
    badge: "Next.js 15 & Expo 54",
    icon: Globe,
    color: "#263B70",
    accentBg: "rgba(38, 59, 112, 0.12)",
    description: "Unified web client with Next.js 15 App Router (React 19) and cross-platform native iOS & Android client with Expo 54.",
    metrics: [
      { label: "Rendering", value: "RSC & Client SSR" },
      { label: "State Sync", value: "DashboardContext" },
      { label: "Mobile Auth", value: "SecureStore Token" }
    ],
    codeSnippet: `// client/nextjs/src/app/page.tsx
import { useSession } from "~/lib/auth-client";

export default function App() {
  const { data: session } = useSession();
  return <Dashboard user={session?.user} />;
}`,
    features: ["Zero Hydration Mismatch", "Expo Router File Navigation", "Shared TypeScript Schemas"]
  },
  {
    id: "edge",
    name: "Edge API Gateway",
    category: "Routing & Compute",
    badge: "Cloudflare Workers & Hono",
    icon: Zap,
    color: "#1E52C8",
    accentBg: "rgba(30, 82, 200, 0.12)",
    description: "Sub-10ms global edge dispatch powered by Hono API running inside Cloudflare Workers V8 isolated runtimes.",
    metrics: [
      { label: "Cold Start", value: "< 5ms" },
      { label: "Locations", value: "300+ Edge Nodes" },
      { label: "Execution", value: "Sub-millisecond" }
    ],
    codeSnippet: `// server/hono/src/index.ts
import { Hono } from "hono";
const app = new Hono();

app.get("/api/users/profile", async (c) => {
  return c.json({ status: "ok", user: c.get("user") });
});`,
    features: ["Lightweight Hono Router", "Global Cloudflare Anycast", "Zero Node.js Overhead"]
  },
  {
    id: "security",
    name: "Security & Session Shield",
    category: "Identity & Access",
    badge: "Better Auth & RBAC",
    icon: ShieldCheck,
    color: "#059669",
    accentBg: "rgba(5, 150, 105, 0.12)",
    description: "Granular multi-role RBAC permissions, 6-digit email OTPs, Google OAuth, and automated user-agent hijacking prevention.",
    metrics: [
      { label: "RBAC Scope", value: "Admin/Manager/User" },
      { label: "Session Shield", value: "User-Agent Hash" },
      { label: "OAuth", value: "Google Social Sync" }
    ],
    codeSnippet: `// server/hono/src/lib/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
});`,
    features: ["Pre-Seeded Permission Matrix", "JWT & Bearer Tokens", "Automatic Session Revocation"]
  },
  {
    id: "database",
    name: "Data Persistence Tier",
    category: "Storage & Querying",
    badge: "Drizzle ORM & PostgreSQL",
    icon: Database,
    color: "#D97706",
    accentBg: "rgba(217, 119, 6, 0.12)",
    description: "Type-safe PostgreSQL relational schema with lazy-evaluated connection pooling and built-in Aiven SSL handshake resolution.",
    metrics: [
      { label: "ORM Safety", value: "100% TypeScript" },
      { label: "Connection Pool", value: "Lazy Proxy" },
      { label: "SSL Fix", value: "Auto TLS Bypass" }
    ],
    codeSnippet: `// server/db/src/schema.ts
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  roleId: text("role_id").references(() => roles.id),
});`,
    features: ["Automated CLI Automation", "Drizzle Migration Engine", "Connection Socket Reaper"]
  },
  {
    id: "foundation",
    name: "Monorepo Engine",
    category: "Build System",
    badge: "TurboRepo & pnpm",
    icon: Layers,
    color: "#4B5563",
    accentBg: "rgba(75, 85, 99, 0.12)",
    description: "Cached, parallelized monorepo pipelines for building, typechecking, seeding, and deploying workspace packages.",
    metrics: [
      { label: "Build Speed", value: "Cached Turbo" },
      { label: "Packages", value: "4 Shared Modules" },
      { label: "Package Manager", value: "pnpm v12" }
    ],
    codeSnippet: `// package.json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "db:migrate": "pnpm --filter @thunder/db db:migrate"
  }
}`,
    features: ["Shared Type Definitions", "Zero-Config Task Caching", "Cross-Package Linking"]
  }
];

export function TechStack3D() {
  const [activeLayer, setActiveLayer] = useState<StackLayer>(STACK_LAYERS[0]);
  const [isExploded, setIsExploded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [rotation, setRotation] = useState({ x: 55, y: 0, z: -35 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);

    setRotation({
      x: 55 - mouseY * 8,
      y: mouseX * 6,
      z: -35 + mouseX * 10
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 55, y: 0, z: -35 });
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success("Code snippet copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Activity className="w-3.5 h-3.5" />
            <span>Interactive Architecture Canvas</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            3D Axonometric Stack Matrix
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Hover or tap layers to inspect real-time connection pipelines, live route handlers, and performance metrics across the THUNDER monorepo.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsExploded(!isExploded)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/60 text-xs font-mono font-bold hover:bg-accent hover:text-foreground transition shadow-xs cursor-pointer active:scale-95"
          >
            {isExploded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isExploded ? "Dock Stack" : "Explode Stack"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left 3D Stage | Right Layer Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: 3D Axonometric Stage */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="lg:col-span-7 relative min-h-[460px] sm:min-h-[520px] rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md p-6 flex items-center justify-center overflow-hidden shadow-xs select-none"
        >
          {/* Architectural Drafting Lines Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>3D Axonometric View</span>
          </div>

          <div className="absolute bottom-4 left-4 text-[10px] font-mono text-muted-foreground">
            Angle: {Math.round(rotation.x)}° / {Math.round(rotation.z)}°
          </div>

          {/* 3D Perspective Canvas Container */}
          <div 
            className="relative w-full max-w-[340px] sm:max-w-[400px] h-[320px] sm:h-[360px] flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%"
            }}
          >
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-500 ease-out"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`
              }}
            >
              {/* Vertical Connecting Laser Guide Line */}
              <div 
                className="absolute w-0.5 bg-gradient-to-b from-primary via-emerald-500 to-amber-500 opacity-40 pointer-events-none transition-all duration-500"
                style={{
                  height: isExploded ? "320px" : "180px",
                  transform: "translateZ(0px)",
                }}
              />

              {/* Render Stack Plates from Bottom to Top */}
              {STACK_LAYERS.map((layer, idx) => {
                const isSelected = activeLayer.id === layer.id;
                const Icon = layer.icon;

                // Calculate vertical Z offset
                const baseZ = (STACK_LAYERS.length - 1 - idx) * (isExploded ? 64 : 36);
                const activeZOffset = isSelected ? 24 : 0;
                const totalZ = baseZ + activeZOffset;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayer(layer)}
                    className={`absolute w-[240px] sm:w-[280px] h-[70px] sm:h-[80px] rounded-2xl p-4 cursor-pointer transition-all duration-500 flex items-center justify-between border ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-2xl scale-105 ring-4 ring-primary/20"
                        : "border-border/80 bg-card/95 hover:border-primary/60 text-foreground hover:bg-muted/80 shadow-md"
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: `translateZ(${totalZ}px)`,
                      boxShadow: isSelected 
                        ? `0 20px 40px -10px ${layer.color}66, inset 0 0 15px ${layer.color}33`
                        : "0 10px 25px -5px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                          isSelected 
                            ? "bg-white/20 text-white" 
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 text-left">
                        <div className={`text-[10px] font-mono font-bold uppercase tracking-wider truncate ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                          {layer.category}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold truncate leading-tight">
                          {layer.name}
                        </div>
                      </div>
                    </div>

                    <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected ? "bg-white text-neutral-900" : "bg-muted text-muted-foreground"
                    }`}>
                      0{STACK_LAYERS.length - idx}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Layer Inspector */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-4">
            {/* Layer Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: activeLayer.color }}
                >
                  <activeLayer.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                    {activeLayer.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-foreground">
                    {activeLayer.name}
                  </h3>
                </div>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                {activeLayer.badge}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {activeLayer.description}
            </p>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-2 py-2">
              {activeLayer.metrics.map((m) => (
                <div key={m.label} className="p-2.5 rounded-xl border border-border/50 bg-muted/30 text-center space-y-0.5">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{m.label}</div>
                  <div className="text-xs font-bold text-foreground truncate">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Code Snippet Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
                <span className="flex items-center gap-1.5 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  Code Inspection
                </span>
                <button
                  onClick={() => handleCopyCode(activeLayer.codeSnippet)}
                  className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border/60 bg-black/80 p-4 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner">
                <pre className="whitespace-pre text-[11px] sm:text-xs">{activeLayer.codeSnippet}</pre>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-foreground">Key Architecture Benefits:</span>
              <ul className="space-y-1.5">
                {activeLayer.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>Selected Layer 0{STACK_LAYERS.findIndex((l) => l.id === activeLayer.id) + 1} of 05</span>
            <div className="flex items-center gap-1 text-primary font-bold">
              <span>Click layers to switch</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
