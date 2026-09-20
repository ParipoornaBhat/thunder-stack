import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "sonner";
import { SmoothScroll } from "~/components/SmoothScroll";
import { AppProvider } from "~/context/AppContext";
import { siteConfig } from "~/config/site";

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

const spaceMono = Space_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"]
});

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/logos/favicon.png",
    shortcut: "/logos/favicon.png",
    apple: "/logos/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <SmoothScroll />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            {children}
          </AppProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
