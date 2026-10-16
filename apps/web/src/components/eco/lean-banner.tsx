"use client";

import { useState } from "react";
import { Sprout, ChevronDown, AlertTriangle, IndianRupee, Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EcoModelCategory, LeanSeasonData } from "@/types";

const ALTERNATIVE_STREAMS: { icon: string; label: string; category: EcoModelCategory }[] = [
  { icon: "🛶", label: "Boat experiences", category: "fisher_coastal" },
  { icon: "🏠", label: "Fisher homestays", category: "homestay_food" },
  { icon: "🍤", label: "Coastal seafood meals", category: "homestay_food" },
  { icon: "🌿", label: "Mangrove & nature guiding", category: "nature_tours" },
  { icon: "🎣", label: "Traditional fishing demos", category: "fisher_coastal" },
  { icon: "🎧", label: "Ocean & sound education", category: "ocean_learning" },
  { icon: "🧺", label: "Crafts & local products", category: "festival_market" },
  { icon: "🎉", label: "Weekend village festivals", category: "festival_market" },
];

export function LeanSeasonBanner({
  data,
  simulating = false,
  onToggleSimulate,
  onExplore,
  onSelectCategory,
  className,
}: {
  data: LeanSeasonData | null;
  simulating?: boolean;
  onToggleSimulate?: (next: boolean) => void;
  onExplore?: () => void;
  onSelectCategory?: (cat: EcoModelCategory) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!data) return null;

  const active = data.active || simulating;
  const win = data.windows?.[0];

  return (
    <div
      className={cn(
        "reveal visible overflow-hidden rounded-2xl border transition-all duration-300",
        active
          ? "border-emerald-400/60 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white shadow-ocean"
          : "border-ocean-border bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
              active ? "bg-emerald-600" : "bg-ocean-blue"
            )}
          >
            <Sprout className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold uppercase tracking-wider text-ocean-navy">
                🌱 Lean Season Opportunities
              </p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                  active ? "bg-amber-500 text-white" : "bg-ocean-light text-ocean-deep"
                )}
              >
                {active ? "Fishing-Ban Mode Active" : "All Seasons Open"}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-ocean-text-secondary">
              {active
                ? data.message || "Fishing activity is seasonally restricted. Explore alternative income opportunities in your village."
                : "During the 61-day fishing ban, O3L switches to Lean Season Mode so families earn from shore & village tourism."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onToggleSimulate && (
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => onToggleSimulate(!simulating)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all",
                simulating
                  ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                  : "border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {simulating ? "Lean Season Mode: ON" : "Preview Lean Season"}
            </button>
          )}

          {onExplore && active && (
            <button
              suppressHydrationWarning
              type="button"
              onClick={onExplore}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
            >
              View Listings <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle lean season details"
            className="rounded-xl border border-ocean-border bg-ocean-foam p-2 text-ocean-navy hover:bg-ocean-light"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-emerald-200/60 bg-white/80 px-4 py-2.5 sm:px-5">
          <span className="text-[11px] font-bold text-emerald-800 mr-1">Alternative village income:</span>
          {ALTERNATIVE_STREAMS.map((s) => (
            <button
              suppressHydrationWarning
              key={s.label}
              type="button"
              onClick={() => onSelectCategory?.(s.category)}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white"
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="border-t border-ocean-border bg-ocean-foam/60 px-4 py-4 sm:px-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-ocean-border bg-white p-3.5">
              <p className="font-bold text-ocean-navy">🌊 Normal Season</p>
              <p className="mt-1 text-ocean-text-secondary">Fishing is the primary income, with weekend boat rides &amp; homestays as bonus income.</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
              <p className="font-bold text-red-900">⛔ Without O3L in Ban Season</p>
              <p className="mt-1 text-red-800/80">Offshore fishing stops for 61 days (Apr–Jun / Jun–Jul) and household income drops to ₹0.</p>
            </div>
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5">
              <p className="font-bold text-emerald-950">🌱 With O3L Lean Season Mode</p>
              <p className="mt-1 text-emerald-900/85">Families switch to homestays, seafood meals, mangrove tours, ocean learning &amp; crafts.</p>
            </div>
          </div>

          {win && (
            <p className="text-xs text-ocean-text-secondary">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
              <b>{win.state}:</b> {win.typical_period} — {win.main_reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

