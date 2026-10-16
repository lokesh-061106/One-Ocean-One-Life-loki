"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Recycle,
  Sprout,
  DollarSign,
  Landmark,
  Utensils,
  Fish,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Award,
  Layers,
  Users,
  ShoppingCart,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SHG_MODULES = [
  {
    icon: Recycle,
    title: "Circular Economy Architecture",
    tagline: "Waste-to-Wealth Infrastructure",
    description: "Transform discarded catch, fish trimmings, and beach debris into high-value commercial resources for coastal communities.",
    href: "/economy/shg/circular-economy",
    badge: "Foundation",
    color: "bg-emerald-600 text-white",
    tags: ["Waste Valorization", "By-catch Upcycling", "Community Units"],
  },
  {
    icon: Layers,
    title: "Deepening the Model",
    tagline: "Regenerative Scalability",
    description: "Advanced circular business models, lifecycle extension, and community-owned circular processing hubs for long-term viability.",
    href: "/economy/shg/strategies",
    badge: "Strategy",
    color: "bg-teal-600 text-white",
    tags: ["Decentralized Hubs", "Life-Cycle Tracking", "Cooperative Equity"],
  },
  {
    icon: TrendingUp,
    title: "Revenue Opportunities",
    tagline: "High-Margin Marine Products",
    description: "Unlock multiple new revenue streams: organic fish silage, chitin & chitosan from shrimp shells, and liquid marine bio-fertilizers.",
    href: "/economy/shg/revenue",
    badge: "Income Growth",
    color: "bg-amber-500 text-white",
    tags: ["Chitin Extraction", "Fish Bio-Fertilizer", "Animal Feed"],
  },
  {
    icon: Landmark,
    title: "Loans & Financial Schemes",
    tagline: "PMMSY & NABARD Subsidies",
    description: "Direct assistance for women fisher SHGs: accessing 60% PMMSY capital subsidies, MUDRA loans, and zero-collateral micro-credit.",
    href: "/economy/shg/loans",
    badge: "Govt Linked",
    color: "bg-blue-600 text-white",
    tags: ["PMMSY 60% Subsidy", "NABARD Support", "MUDRA Microfinance"],
  },
  {
    icon: Utensils,
    title: "Recipes & Value-Added Food",
    tagline: "Solar Drying & Preservation",
    description: "Hygienic solar tunnel drying, ready-to-eat artisan seafood pickles, marinades, and branded vacuum-sealed retail packaging.",
    href: "/economy/shg/recipes",
    badge: "High Demand",
    color: "bg-orange-500 text-white",
    tags: ["Solar Drying", "Seafood Pickles", "FSSAI Standards"],
  },
  {
    icon: Fish,
    title: "Fresh Fish Cold-Chain Marketing",
    tagline: "Direct-to-Consumer Logistics",
    description: "Bypassing middlemen at the landing quay: digital price discovery, solar-powered cold storage, and direct urban retail supply.",
    href: "/economy/shg/fresh-fish",
    badge: "Zero Middlemen",
    color: "bg-sky-600 text-white",
    tags: ["Landing Quay Direct", "Cold-Chain Logistics", "Fair Price Tracking"],
  },
  {
    icon: Award,
    title: "Sea to Plate to Prosperity",
    tagline: "End-to-End Value Realization",
    description: "Traceable harvest journey: certified origin tagging, QR-code storytelling, and sustainable premium pricing for fishing families.",
    href: "/economy/shg/sea-to-plate",
    badge: "Impact Flagship",
    color: "bg-indigo-600 text-white",
    tags: ["Provenance QR", "Artisanal Premium", "Fair Trade Payout"],
  },
];

export default function EconomyPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="min-h-screen bg-[#F3F8FB]">
      <Header />

      <main className="w-full">
        {/* ================= 1. EXECUTIVE FULL-SCREEN HERO BANNER ================= */}
        <section className="relative w-full overflow-hidden bg-[#031d2e] text-white">
          {/* Deep Teal-Navy Gradient Base */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#011422] via-[#032a3f] to-[#064e6b]" />
          
          <div className="pointer-events-none absolute inset-0 opacity-15 mix-blend-luminosity">
            <img
              src="/shg/p1-banner-boats.webp"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#011422] via-transparent to-[#011422]/75" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          <div className="relative mx-auto max-w-[1720px] px-4 py-10 sm:px-6 lg:px-8 xl:px-10 lg:py-12">
            <div className="flex flex-col items-start justify-between gap-8 xl:flex-row xl:items-center">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300 shadow-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    O3L — Coastal Circular Economy
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-950/80 px-2.5 py-1 text-[11px] font-bold text-sky-300 shadow-md">
                    <ShieldCheck className="h-3 w-3" /> Women SHG &amp; Fisherfolk Cooperative Powered
                  </span>
                </div>

                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl leading-tight drop-shadow-md">
                  Coastal Circular Economy —{" "}
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                    Waste-to-Wealth Livelihoods
                  </span>
                </h1>

                <p className="mt-2.5 text-xs font-bold tracking-wide text-amber-300 sm:text-sm drop-shadow-sm">
                  Zero Marine Waste &nbsp;•&nbsp; High-Value Seafood Processing &nbsp;•&nbsp; Women SHG Empowerment &nbsp;•&nbsp; Govt Subsidies
                </p>

                <p className="mt-2.5 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-slate-100 drop-shadow-sm">
                  Turning discarded fish trimmings, crab shells, and seasonal glut into premium organic fertilizers, chitin products, hygienic solar-dried seafood, and direct cold-chain supply — guaranteeing resilient year-round income for coastal households.
                </p>

                {/* Live Real-Time Platform Stats Grid */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl border border-emerald-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-emerald-300">7</p>
                    <p className="text-[11px] font-bold text-white">Value Streams</p>
                    <p className="text-[10px] font-medium text-emerald-200">Waste-to-wealth</p>
                  </div>

                  <div className="rounded-xl border border-sky-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-sky-300">12+</p>
                    <p className="text-[11px] font-bold text-white">Coastal SHGs</p>
                    <p className="text-[10px] font-medium text-sky-200">Women-led groups</p>
                  </div>

                  <div className="rounded-xl border border-amber-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-amber-300">₹2.4L</p>
                    <p className="text-[11px] font-bold text-white">Avg Added Income</p>
                    <p className="text-[10px] font-medium text-amber-200">Per cluster / year</p>
                  </div>

                  <div className="rounded-xl border border-teal-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-teal-300">60%</p>
                    <p className="text-[11px] font-bold text-white">Govt Subsidies</p>
                    <p className="text-[10px] font-medium text-teal-200">PMMSY eligible</p>
                  </div>
                </div>
              </div>

              {/* Right Hero Badge */}
              <div className="shrink-0 w-full xl:w-auto xl:max-w-md rounded-2xl border border-emerald-300/60 bg-[#021927]/95 p-5 shadow-2xl backdrop-blur-lg">
                <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <Recycle className="h-3.5 w-3.5" /> SHG Circular Mandate
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/40">
                    Live Framework
                  </span>
                </div>

                <p className="mt-2.5 font-serif text-lg font-extrabold italic text-emerald-300 sm:text-xl">
                  &ldquo;Every Kilogram of Catch Has Value&rdquo;
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-200">
                  Zero Waste &nbsp;·&nbsp; Clean Coastal Quays &nbsp;·&nbsp; Dignified Family Livelihoods
                </p>

                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Comprehensive blueprints, equipment financing, FSSAI compliance guides, and direct market linkage for coastal Self-Help Groups.
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-400 text-slate-950 hover:bg-emerald-300 font-bold shadow-md transition-all hover:scale-[1.02]"
                    asChild
                  >
                    <Link href="/economy/shg/circular-economy">
                      <Recycle className="mr-1.5 h-3.5 w-3.5" /> Explore 7 SHG Models
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold"
                    asChild
                  >
                    <Link href="/economy/shg/loans">
                      <Landmark className="mr-1.5 h-3.5 w-3.5" /> Govt Loans &amp; Subsidies
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. ALL 7 SHG CIRCULAR MODULES GRID ================= */}
        <section className="mx-auto max-w-[1720px] px-4 py-11 sm:px-6 lg:px-8 xl:px-10">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ocean-blue">
                Coastal SHG Business Architecture
              </span>
              <h2 className="mt-0.5 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
                7 Women SHG Circular Enterprise Modules
              </h2>
              <p className="mt-0.5 text-sm text-ocean-text-secondary">
                Turn-key community enterprise frameworks designed for coastal fishing villages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                className="rounded-full text-xs font-bold"
              >
                All 7 Modules
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SHG_MODULES.map((mod, index) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-ocean-blue hover:shadow-ocean-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mod.color} shadow-sm`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                        {mod.badge}
                      </span>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-ocean-blue">{mod.tagline}</p>
                    <h3 className="mt-1 text-lg font-extrabold text-ocean-navy leading-snug">{mod.title}</h3>

                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-ocean-text-secondary">
                      {mod.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {mod.tags.map((t) => (
                        <span key={t} className="rounded-md bg-ocean-foam border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-ocean-navy">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-3">
                    <Link
                      href={mod.href}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ocean-foam py-2 text-xs font-bold text-ocean-navy transition hover:bg-ocean-blue hover:text-white"
                    >
                      Explore Implementation Plan <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 3. FEATURED INITIATIVES & SUBSIDY ROADMAP ================= */}
        <section className="w-full border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="mb-8 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Ready To Execute</span>
              <h2 className="mt-1 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
                How O3L Supports Coastal Self-Help Groups
              </h2>
              <p className="mt-1 text-sm text-ocean-text-secondary max-w-2xl mx-auto">
                From project report drafting and bank subsidy clearance to hygienic packaging and retail distribution.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-ocean-foam p-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
                  <Sprout className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-base font-extrabold text-ocean-navy">Project DPR &amp; Technology</h3>
                <p className="mt-2 text-xs sm:text-sm text-ocean-text-secondary leading-relaxed">
                  Ready-to-submit Detailed Project Reports (DPR) for solar tunnel dryers, fish silage units, and cold storage boxes tailored for NABARD approvals.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-ocean-foam p-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
                  <Landmark className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-base font-extrabold text-ocean-navy">Government Scheme Linkage</h3>
                <p className="mt-2 text-xs sm:text-sm text-ocean-text-secondary leading-relaxed">
                  Direct clearance for PMMSY (60% subsidy for women SHGs), PMFME micro-food processing incentives, and Mudra credit lines.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-ocean-foam p-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
                  <ShoppingCart className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="text-base font-extrabold text-ocean-navy">Guaranteed Market Buy-Back</h3>
                <p className="mt-2 text-xs sm:text-sm text-ocean-text-secondary leading-relaxed">
                  Direct listing on the O3L Marketplace and partnership with coastal restaurants, organic farms, and conscious consumers.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}