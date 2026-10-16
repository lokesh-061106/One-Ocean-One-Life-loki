"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Award, Map, BarChart3, Settings, Bell, ChevronLeft, ChevronRight, LogOut, Waves, Fish, Eye, Mic, Ticket, Compass, Menu, ShieldCheck, ListOrdered, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";

const adminItems = [
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/content", label: "Content", icon: FileText },
  { href: "/dashboard/guides", label: "Species Guides", icon: Fish },
  { href: "/dashboard/events", label: "Events", icon: Bell },
  { href: "/dashboard/contributions", label: "Contributions", icon: Award },
];

const contributorItems = [
  { href: "/dashboard/content", label: "My Content", icon: FileText },
  { href: "/dashboard/guides", label: "Species Guides", icon: Fish },
  { href: "/dashboard/events", label: "Events", icon: Bell },
  { href: "/dashboard/contributions", label: "My Contributions", icon: Award },
];

const analystItems = [
  { href: "/dashboard/maps", label: "Ocean Maps", icon: Map },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

const viewerItems = [
  { href: "/dashboard/content", label: "Content", icon: FileText },
  { href: "/dashboard/events", label: "Events", icon: Bell },
  { href: "/dashboard/contributions", label: "My Contributions", icon: Award },
];

function getItemsForRole(role: string | undefined) {
  switch (role) {
    case "admin":
    case "super_admin": return [...adminItems, ...analystItems];
    case "community_leader": return [...contributorItems, ...analystItems];
    case "fisherman":
    case "researcher":
    case "educator": return contributorItems;
    default: return viewerItems;
  }
}

const REVIEWER_ROLES = ["admin", "super_admin", "moderator", "scientific_validator"];

interface SidebarProps { collapsed?: boolean; onToggle?: () => void; }

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const mounted = useHydrated();
  const isReviewer = !!user?.isSuperuser || REVIEWER_ROLES.includes((user?.role || "").toLowerCase());
  const managementItems = isReviewer
    ? [{ href: "/dashboard/pending-reviews", label: "Pending Reviews", icon: ShieldCheck }, ...getItemsForRole(user?.role)]
    : getItemsForRole(user?.role);
  const canConfigureHeader = user?.role === "admin" || user?.role === "super_admin";

  const sidebarGroups = [
    { title: "Overview", items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ] },
    { title: "Ecotourism", items: [
      { href: "/ecotourism", label: "Explore Experiences", icon: Compass },
      { href: "/ecotourism/bookings", label: "My Bookings & Ledger", icon: Ticket },
    ] },
    { title: "Management", items: managementItems },
    { title: "Analytics", items: analystItems },
    { title: "System", items: [
      ...(canConfigureHeader ? [{ href: "/dashboard/header-menu", label: "Header Menu", icon: Menu }] : []),
      ...(canConfigureHeader ? [{ href: "/dashboard/frontend-menu", label: "Frontend Menu", icon: ListOrdered }] : []),
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ] },
  ];

  return (
    <TooltipProvider>
      <aside className={cn("flex flex-col h-screen bg-ocean-navy text-white transition-all duration-300", collapsed ? "w-[68px]" : "w-64")}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-ocean-blue" />
              <span className="font-bold text-lg">O3L Admin</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="mx-auto"><Waves className="h-6 w-6 text-ocean-blue" /></Link>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} className={cn("text-white hover:bg-white/10", collapsed && "hidden")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {mounted && user && !collapsed && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-ocean-blue flex items-center justify-center text-white text-sm font-bold">{user.firstName?.charAt(0) || "U"}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{user.role || "Contributor"}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {mounted && sidebarGroups.map((group, gi) => (
            <div key={gi} className="mb-6">
              {!collapsed && <h4 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.title}</h4>}
              <div className="space-y-1">
                {group.items.map(item => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const linkContent = (
                    <Link href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-ocean-blue text-white" : "text-gray-300 hover:bg-white/10 hover:text-white")}>
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                  return collapsed ? (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Separator className="bg-white/10 mb-3" />
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={logout} className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white">
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white w-full">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
