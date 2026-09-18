"use client";

import { useEffect } from "react";

/**
 * Standardized client component to ensure smooth scrolling behavior across pages and browsers.
 */
export function SmoothScroll() {
  useEffect(() => {
    try {
      document.documentElement.style.scrollBehavior = "smooth";
    } catch {
      // Fallback for environments where document is not fully ready
    }
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return null;
}
