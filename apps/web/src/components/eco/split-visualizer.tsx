"use client";

import { useMemo, useState } from "react";
import { HandCoins, Handshake, ShieldCheck, Recycle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./shared";

const DEFAULT_PCTS = { provider: 80, village: 10, platform: 5, conservation: 5 };

const RECIPIENTS = [
  {
    key: "provider" as const,
    title: "Fisher / service provider",
    subtitle: "Family income — the guide, boat owner & crew",
    color: "#087EA4",
    barClass: "from-ocean-blue to-sky-400",
    Icon: HandCoins,
  },
  {
    key: "village" as const,
    title: "Village & community fund",
    subtitle: "Shared by households — homestay, food, crafts, guides",
    color: "#16A085",
    barClass: "from-ocean-green to-emerald-400",
    Icon: Handshake,
  },
  {
    key: "platform" as const,
    title: "O3L platform",
    subtitle: "Runs the app, payments & support",
    color: "#FF7660",
    barClass: "from-ocean-coral to-rose-400",
    Icon: Wallet,
  },
  {
    key: "conservation" as const,
    title: "Safety, environment & insurance",
    subtitle: "Life jackets, permits, conservation reserve",
    color: "#F59E0B",
    barClass: "from-amber-500 to-yellow-400",
    Icon: Recycle,
  },
];

const PRESETS = [1000, 3000, 4999, 10000];

export function SplitVisualizer({
  pcts,
  className,
}: {
  pcts?: Partial<Record<"provider" | "village" | "platform" | "conservation", number>>;
  className?: string;
}) {
  const effective = useMemo(() => ({ ...DEFAULT_PCTS, ...(pcts || {}) }), [pcts]);
  const [amount, setAmount] = useState(3000);
  // Derived "key" — bumps with the amount so bars/numbers re-animate on change
  const animateKey = amount;

  const lines = RECIPIENTS.map((r) => {
    const pct = effective[r.key];
    const raw = (amount * pct) / 100;
    return { ...r, pct, amount: Math.round(raw * 100) / 100 };
  });
  // Absorb rounding into the conservation line so the four re-sum exactly
  const sum = lines.reduce((a, l) => a + l.amount, 0);
  lines[3].amount = Math.round((amount - sum + lines[3].amount) * 100) / 100;

  return (
    <div className={cn("rounded-2xl border border-ocean-border bg-white p-6 shadow-ocean sm:p-8", className)}>
      {/* Amount input */}
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="split-amount" className="text-sm font-semibold text-ocean-navy">
            Tourist pays
          </label>
          <div className="flex items-center rounded-lg border border-ocean-border bg-ocean-foam px-3 py-1.5 focus-within:border-ocean-blue">
            <span className="mr-1 font-bold text-ocean-navy">₹</span>
            <input
              suppressHydrationWarning
              id="split-amount"
              type="number"
              min={100}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Math.min(100000, Number(e.target.value) || 0)))}
              className="w-28 bg-transparent text-lg font-bold text-ocean-navy outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              suppressHydrationWarning
              key={p}
              onClick={() => setAmount(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                amount === p
                  ? "border-ocean-blue bg-ocean-blue text-white shadow-glow"
                  : "border-ocean-border bg-white text-ocean-text-secondary hover:border-ocean-blue hover:text-ocean-blue"
              )}
            >
              ₹{p.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>

      {/* Flow bars */}
      <div className="space-y-4">
        {lines.map((l, i) => (
          <div key={`${l.key}-${animateKey}`} className="reveal visible" style={{ transitionDelay: `${i * 90}ms` }}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: l.color }}
                >
                  <l.Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ocean-navy">{l.title}</p>
                  <p className="hidden truncate text-xs text-ocean-text-secondary sm:block">{l.subtitle}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-extrabold tabular-nums text-ocean-navy">
                  <AnimatedNumber value={l.amount} prefix="₹" key={`${l.key}-${l.amount}`} duration={700} />
                </p>
                <p className="text-[11px] font-semibold text-ocean-text-secondary">{l.pct}%</p>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ocean-light">
              <div
                key={`bar-${animateKey}-${l.key}`}
                className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-1000 ease-out", l.barClass)}
                style={{ width: `${l.pct}%`, transitionDelay: `${i * 120}ms` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ocean-foam px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-medium text-ocean-text-secondary">
          <ShieldCheck className="h-4 w-4 text-ocean-green" />
          Every rupee is accounted for — shown in-app on each booking.
        </p>
        <p className="text-xs font-bold text-ocean-navy">
          Total ₹{amount.toLocaleString("en-IN")} ={" "}
          {lines.reduce((a, l) => a + l.amount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
