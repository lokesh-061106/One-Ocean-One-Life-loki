"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Compass, Users, Package, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavData } from "@/components/layout/nav-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

/* ============================================================ */
/*  Option 1: Split Navigation with integrated search           */
/* ============================================================ */

const groupTriggers = [
  { key: "explore", label: "Explore", icon: Compass, match: (p: string) => p === "/guides" || p.startsWith("/guides/") },
  { key: "community", label: "Community", icon: Users, match: (p: string) => p === "/community/members" || p.startsWith("/community/") },
  { key: "marketplace", label: "Marketplace", icon: Package, match: (p: string) => p === "/marketplace" || p.startsWith("/marketplace/") },
];

interface Option1NavProps {
  onOpenSearch?: () => void;
}

export function Option1Nav({ onOpenSearch }: Option1NavProps) {
  const pathname = usePathname();
  const { navGroups, emergencyNavItem } = useNavData();

  return (
    <nav
      className="hidden lg:flex items-center gap-3 flex-1 min-w-0 justify-center"
      aria-label="Main navigation"
    >
      {/* Inline search field built into the navigation bar */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={onOpenSearch}
        aria-label="Search the site"
        className="hidden xl:flex w-44 2xl:w-56 items-center gap-2 rounded-full border border-ocean-border bg-ocean-foam px-3 py-2 text-sm text-ocean-muted transition-colors hover:border-ocean-blue/50 hover:text-ocean-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-2"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search O3L…</span>
      </button>

      <div className="flex items-center gap-2">
        {groupTriggers.map((group) => {
          const TriggerIcon = group.icon;
          const navGroup = navGroups.find((g) => g.label.toLowerCase() === group.key);
          if (!navGroup) return null;
          return (
            <DropdownMenu key={group.key}>
              <DropdownMenuTrigger asChild>
                <button
                  suppressHydrationWarning
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-2",
                    group.match(pathname) && "bg-ocean-light text-ocean-blue"
                  )}
                >
                  <TriggerIcon className="h-4 w-4" />
                  <span>{group.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 rounded-lg p-2 pt-1 shadow animate-in fade-in-up">
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-ocean-muted text-xs pb-1">
                  {group.label}
                </DropdownMenuLabel>
                {navGroup.items.map((item) => {
                  const ItemIcon = item.icon;
                  const itemActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-start gap-3 px-2.5 py-1.5 rounded-lg cursor-pointer",
                          itemActive && "bg-ocean-50 text-ocean-blue"
                        )}
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                          <ItemIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ocean-navy">{item.label}</div>
                          <div className="text-xs text-ocean-muted leading-snug mt-0.5">{item.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>

      {/* Standalone emergency link at xl+ */}
      {emergencyNavItem && (
        <Link
          href={emergencyNavItem.href}
          className={cn(
            "hidden xl:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
            "text-ocean-danger hover:bg-ocean-danger/10 focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-2 outline-none",
            (pathname === emergencyNavItem.href || pathname.startsWith(emergencyNavItem.href + "/")) &&
              "bg-ocean-danger/10 text-ocean-danger"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          {emergencyNavItem.label}
        </Link>
      )}
    </nav>
  );
}
