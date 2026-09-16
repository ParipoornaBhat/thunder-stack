"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { useSession, type Session, type User } from "~/lib/auth-client";
import { siteConfig, type SiteConfig } from "~/config/site";
import { getServerUrl } from "~/lib/config";

interface AppContextValue {
  siteConfig: SiteConfig;
  serverUrl: string;
  session: Session | null | undefined;
  user: User | null | undefined;
  isSessionPending: boolean;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [activeNavTab, setActiveNavTab] = useState<string>("home");

  const serverUrl = useMemo(() => getServerUrl(), []);

  const value = useMemo<AppContextValue>(() => ({
    siteConfig,
    serverUrl,
    session: session ?? null,
    user: session?.user ?? null,
    isSessionPending: isPending,
    activeNavTab,
    setActiveNavTab,
  }), [session, isPending, serverUrl, activeNavTab]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
