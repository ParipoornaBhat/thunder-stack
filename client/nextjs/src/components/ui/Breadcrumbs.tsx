"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/" || pathname === "/dashboard") {
    return null; // Don't show breadcrumbs on root or main dashboard home
  }

  // Remove trailing slashes and split by '/'
  const segments = pathname.replace(/\/+$/, "").split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground/80">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          // Skip the initial 'dashboard' segment if it exists
          if (index === 0 && segment.toLowerCase() === "dashboard") return null;

          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          // Format the segment name: capitalize and replace dashes with spaces
          const name = segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

          return (
            <React.Fragment key={href}>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <li>
                {isLast ? (
                  <span
                    className="font-medium text-foreground"
                    aria-current="page"
                  >
                    {name}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="transition-colors hover:text-foreground hover:underline"
                  >
                    {name}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
