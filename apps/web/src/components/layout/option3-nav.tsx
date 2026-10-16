"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavFilter } from "@/components/layout/nav-data";

/* ============================================================ */
/*  Option 3: Tabbed Navigation                                 */
/* ============================================================ */

interface Tab {
  key: string;
  label: string;
  href: string;
  prefixes?: string[];
  accent?: boolean;
}

const tabs: Tab[] = [
  { key: "guides", label: "Guides", href: "/guides" },
  { key: "education", label: "Education", href: "/education" },
  { key: "map", label: "Ocean Map", href: "/map" },
  { key: "sounds", label: "Ocean Sounds", href: "/sounds" },
  { key: "sightings", label: "Sightings", href: "/sightings" },
  { key: "catches", label: "Fish Catch", href: "/catches" },
  { key: "observations", label: "Observations", href: "/observations" },
  { key: "contributions", label: "Contributions", href: "/contributions", prefixes: ["/contributions"] },
  { key: "community", label: "Community", href: "/community/members", prefixes: ["/community"] },
  { key: "events", label: "Events", href: "/events" },
  { key: "cleanups", label: "Clean-ups", href: "/cleanups" },
  { key: "marketplace", label: "Marketplace", href: "/marketplace" },
  { key: "ecotourism", label: "Ecotourism", href: "/ecotourism", prefixes: ["/ecotourism"] },
  { key: "emergency", label: "Emergency", href: "/emergency", accent: true },
];

function isTabActive(tab: Tab, pathname: string): boolean {
  if (pathname === tab.href) return true;
  return (tab.prefixes ?? []).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function Option3Nav() {
  const pathname = usePathname();
  const filter = useNavFilter();

  /* Admin-disabled tabs are dropped; the rest keep the admin's order. */
  const visibleTabs = tabs
    .map((tab, index) => ({ tab, index }))
    .filter(({ tab }) => filter.isVisible(tab.href))
    .sort((a, b) => filter.orderOf(a.tab.href) - filter.orderOf(b.tab.href) || a.index - b.index)
    .map(({ tab }) => tab);

  return (
    <div className="border-t border-border/50 bg-white/95 backdrop-blur-sm">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Desktop tab bar */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Section tabs">
          {visibleTabs.map((tab) => {
            const active = isTabActive(tab, pathname);
            const Icon = tab.accent ? AlertTriangle : null;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-2",
                  tab.accent
                    ? active
                      ? "text-ocean-danger"
                      : "text-ocean-danger/80 hover:bg-ocean-danger/10 hover:text-ocean-danger"
                    : active
                      ? "text-ocean-blue"
                      : "text-ocean-text-secondary hover:bg-ocean-light/60 hover:text-ocean-blue"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{tab.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0",
                    active && tab.accent ? "bg-ocean-danger" : "bg-ocean-blue"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Mobile tab strip */}
        <div className="lg:hidden flex flex-wrap items-center gap-1 py-2">
          {visibleTabs.map((tab) => {
            const active = isTabActive(tab, pathname);
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  tab.accent
                    ? active
                      ? "bg-ocean-danger/10 text-ocean-danger"
                      : "text-ocean-danger"
                    : active
                      ? "bg-ocean-light text-ocean-blue"
                      : "text-ocean-text-secondary hover:bg-ocean-light hover:text-ocean-blue"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
