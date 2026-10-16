"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Search, Waves, Headphones, CalendarHeart,
  MapPin, Ticket, SlidersHorizontal, Volume2, VolumeX,
  CheckCircle2, Globe2, Users, GraduationCap, Calendar, ShieldCheck,
  Phone, MessageCircle, ExternalLink, ChevronDown, ChevronUp, Anchor,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { fetchCms, fetchCmsList } from "@/lib/api-helpers";
import { cn } from "@/lib/utils";
import { useRevealAll } from "@/hooks/use-reveal";
import {
  MODEL_META, MODEL_ORDER, EcoBadge, typeMeta,
} from "@/components/eco/shared";
import { ExperienceCard, PackageCard } from "@/components/eco/experience-card";
import { SplitVisualizer } from "@/components/eco/split-visualizer";
import { LeanSeasonBanner } from "@/components/eco/lean-banner";
import { ExperienceMap } from "@/components/eco/experience-map";
import type {
  EcoModel, EcoModelCategory, EcoPackage, EcoReview, FisherFamily, LeanSeasonData, MapPoint,
  SplitRule, TourismOpportunity,
} from "@/types";

const SORTS = [
  { key: "rating", label: "Top rated" },
  { key: "price_min", label: "Price: low" },
  { key: "-price_min", label: "Price: high" },
  { key: "created_at", label: "Newest" },
] as const;

const STATE_PINS = [
  { state: "Tamil Nadu", pinColor: "bg-sky-600 text-white" },
  { state: "Kerala", pinColor: "bg-emerald-600 text-white" },
  { state: "Karnataka", pinColor: "bg-amber-500 text-white" },
  { state: "Andhra Pradesh", pinColor: "bg-purple-600 text-white" },
] as const;

const HOUSEHOLD_ROLES = [
  { emoji: "🚤", member: "Fisherman", role: "Boat guide & traditional navigation" },
  { emoji: "🍤", member: "Fisherwoman", role: "Food / homestay & refreshments" },
  { emoji: "📖", member: "Elder", role: "Traditional sea storyteller" },
  { emoji: "📷", member: "Young adult", role: "Digital guide / photographer" },
  { emoji: "🎓", member: "Student", role: "Marine education assistant" },
  { emoji: "🧺", member: "Craft-skilled member", role: "Souvenirs & handicrafts" },
  { emoji: "🔧", member: "Boat mechanic", role: "Boat-maintenance demonstration" },
  { emoji: "🧶", member: "Net maker", role: "Fishing-gear demonstration" },
];

const DISCOVER_TOPICS = [
  { icon: "🐬", label: "Marine mammals" },
  { icon: "🐟", label: "Fish identification" },
  { icon: "🔊", label: "Underwater sounds" },
  { icon: "🌊", label: "Oceanography" },
  { icon: "🎣", label: "Sustainable fishing" },
  { icon: "🪸", label: "Coral ecosystems" },
  { icon: "🐢", label: "Turtle conservation" },
  { icon: "🌱", label: "Mangroves" },
  { icon: "🦀", label: "Intertidal biodiversity" },
  { icon: "🚢", label: "Shipping & ocean noise" },
];

type SoundKey = "dolphin" | "whale" | "fish" | "shrimp" | "boat" | "waves" | "rain" | "harbour";

const HEARABLES: { key: SoundKey; icon: string; title: string; detail: string; whatHearing: string }[] = [
  {
    key: "dolphin",
    icon: "🐬",
    title: "Dolphin clicks",
    detail: "Rapid echolocation click trains used to hunt & navigate.",
    whatHearing: "High-frequency biosonar clicks (40–130 kHz scaled to human hearing) that Indo-Pacific humpback and spinner dolphins use to 'see' with sound in turbid coastal waters.",
  },
  {
    key: "whale",
    icon: "🐋",
    title: "Whale sounds",
    detail: "Low-frequency contact calls travelling across kilometres.",
    whatHearing: "Frequency-modulated moans and song phrases from baleen whales (such as Bryde's and blue whales in the Indian Ocean) communicating across deep channels.",
  },
  {
    key: "fish",
    icon: "🐟",
    title: "Fish sounds",
    detail: "Drums, grunts & choruses from coastal reef fishes.",
    whatHearing: "Sonic muscle vibrations against the swim bladder made by croakers (Sciaenidae), groupers, and damselfish during dusk spawning choruses.",
  },
  {
    key: "shrimp",
    icon: "🦐",
    title: "Shrimp snaps",
    detail: "Crackling cavitation bubbles on healthy reefs.",
    whatHearing: "Snapping shrimp (Alpheidae) closing their specialized claw at high speed, creating a collapsing cavitation bubble that sounds like frying bacon on healthy reefs.",
  },
  {
    key: "boat",
    icon: "⛵",
    title: "Boat noise",
    detail: "Propeller cavitation & engine hum masking marine calls.",
    whatHearing: "Continuous low-frequency mechanical noise (50–500 Hz) from vessel engines and propellers, demonstrating how shipping can mask fish and whale communication.",
  },
  {
    key: "waves",
    icon: "🌊",
    title: "Waves",
    detail: "Natural surf & breaking swell along the coast.",
    whatHearing: "Ambient surface agitation and entrained air bubbles from breaking waves — the natural baseline soundscape of the littoral zone.",
  },
  {
    key: "rain",
    icon: "🌧️",
    title: "Rain on sea",
    detail: "Monsoon droplets striking the ocean surface.",
    whatHearing: "Broadband acoustic signature (~14 kHz peak) produced by raindrops impacting the sea surface and trapping tiny oscillating micro-bubbles.",
  },
  {
    key: "harbour",
    icon: "🏘",
    title: "Harbour sounds",
    detail: "Boats, gulls & morning fish-landing centre life.",
    whatHearing: "The living cultural soundscape of a Southern Indian fishing harbour at dawn — wooden vallams docking, auction calls, and seabirds.",
  },
];

const FESTIVAL_SCHEDULE = [
  {
    time: "Morning",
    icon: "🎣",
    items: [
      "🎣 Traditional fishing demonstration",
      "🛶 Boat experience",
      "🐟 Fish identification",
    ],
  },
  {
    time: "Afternoon",
    icon: "🍤",
    items: [
      "🍤 Local seafood stalls",
      "🥥 Coastal food",
      "🧺 Fisherwomen's products",
      "🎨 Local crafts",
    ],
  },
  {
    time: "Evening",
    icon: "🌅",
    items: [
      "🎵 Traditional music",
      "📖 Sea stories",
      "🌅 Sunset experience",
      "🌊 Beach-cleaning activity",
    ],
  },
];

const FESTIVAL_REVENUE_STREAMS = [
  "Entry / activity passes",
  "Food stalls",
  "Handicrafts",
  "Boat trips",
  "Workshops",
  "Cultural programmes",
  "Photography",
  "Local products",
  "Sponsorship",
  "Conservation contributions",
];

const GLOBAL_PRECEDENTS = [
  {
    flag: "🇧🇩",
    place: "Bangladesh",
    tag: "Fishery-Based Ecotourism",
    summary:
      "Research on fishery-based ecotourism demonstrates how connecting small-scale fisheries with tourism creates new income sources and strengthens the resilience of coastal fishing communities.",
  },
  {
    flag: "🇲🇿",
    place: "Mozambique",
    tag: "FAO Co-Management & Hospitality",
    summary:
      "An FAO-supported project combines fisheries co-management with ecotourism and hospitality training, creating alternative career pathways for fishers, women, and youth.",
  },
  {
    flag: "🇵🇭",
    place: "Philippines",
    tag: "FAO Livelihood Diversification",
    summary:
      "FAO experience in coastal communities emphasizes livelihood diversification, fisher organizations, training, business planning, product development, and access to markets.",
  },
  {
    flag: "🇨🇷",
    place: "Costa Rica",
    tag: "FAO Artisanal Fisher Tourism",
    summary:
      "FAO documentation describes traditional fishing communities increasingly participating in responsible recreational fishing, guided tours, and ecotourism as supplementary livelihoods.",
  },
  {
    flag: "🇮🇳",
    place: "Tamil Nadu, India",
    tag: "FAO Village Societies Model",
    summary:
      "FAO documentation from Tamil Nadu highlights community-based agar production, pearl culture, fish pickle production, and community-managed artificial reefs organized through village institutions.",
  },
];

function playOceanSoundSample(key: SoundKey, onEnd: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const duration = 2.8;
  const now = ctx.currentTime;
  let stopped = false;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.22, now);
  master.connect(ctx.destination);

  if (key === "dolphin") {
    for (let i = 0; i < 24; i++) {
      const t = now + i * 0.065;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(4200 + (i % 5) * 600, t);
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.02);
    }
  } else if (key === "whale") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 1.1);
    osc.frequency.exponentialRampToValueAtTime(140, now + 2.6);
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.45, now + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.7);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 2.75);
  } else if (key === "fish") {
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.32;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(165, t);
      osc.frequency.exponentialRampToValueAtTime(85, t + 0.16);
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } else if (key === "shrimp" || key === "waves" || key === "rain") {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      if (key === "shrimp") {
        data[i] = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 1.8 : (Math.random() * 2 - 1) * 0.08;
      } else if (key === "waves") {
        const env = 0.5 + 0.45 * Math.sin((i / ctx.sampleRate) * Math.PI * 0.85);
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.35;
      }
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = key === "waves" ? "lowpass" : "bandpass";
    filter.frequency.setValueAtTime(key === "waves" ? 480 : key === "rain" ? 3200 : 4800, now);
    noise.connect(filter).connect(master);
    noise.start(now);
    noise.stop(now + duration);
  } else {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(key === "boat" ? 95 : 130, now);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(340, now);
    osc.connect(filter).connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }

  const timer = window.setTimeout(() => {
    if (!stopped) {
      stopped = true;
      ctx.close().catch(() => {});
      onEnd();
    }
  }, duration * 1000);

  return () => {
    if (!stopped) {
      stopped = true;
      window.clearTimeout(timer);
      ctx.close().catch(() => {});
    }
  };
}

export default function EcotourismPage() {
  const rootRef = useRevealAll<HTMLDivElement>();

  const [models, setModels] = useState<EcoModel[]>([]);
  const [experiences, setExperiences] = useState<TourismOpportunity[]>([]);
  const [packages, setPackages] = useState<EcoPackage[]>([]);
  const [families, setFamilies] = useState<FisherFamily[]>([]);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [reviews, setReviews] = useState<EcoReview[]>([]);
  const [lean, setLean] = useState<LeanSeasonData | null>(null);
  const [rules, setRules] = useState<SplitRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [simulatingLean, setSimulatingLean] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [showMap, setShowMap] = useState(false);

  const [playingSound, setPlayingSound] = useState<SoundKey | null>(null);
  const [activeSoundInfo, setActiveSoundInfo] = useState<SoundKey>("dolphin");
  const stopAudioRef = useRef<(() => void) | null>(null);

  const marketplaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const [m, e, p, mp, rv, ln, sr, fams] = await Promise.all([
        fetchCmsList<EcoModel>("/ecotourism/models/"),
        fetchCmsList<TourismOpportunity>("/ecotourism/experiences/?page_size=50&ordering=-rating"),
        fetchCmsList<EcoPackage>("/ecotourism/packages/"),
        fetchCms<{ count: number; points: MapPoint[] }>("/ecotourism/map-points/"),
        fetchCmsList<EcoReview>("/ecotourism/reviews/"),
        fetchCms<LeanSeasonData>("/ecotourism/lean-season/"),
        fetchCmsList<SplitRule>("/ecotourism/split-rules/"),
        fetchCmsList<FisherFamily>("/ecotourism/families/"),
      ]);
      setModels(m);
      setExperiences(e);
      setPackages(p);
      setPoints(mp?.points || []);
      setReviews(rv);
      setLean(ln);
      setRules(sr);
      setFamilies(fams);
      setLoading(false);
    })();
  }, []);

  const handleToggleSimulateLean = useCallback(async (next: boolean) => {
    setSimulatingLean(next);
    const ln = await fetchCms<LeanSeasonData>(
      `/ecotourism/lean-season/${next ? "?simulate=1" : ""}`
    );
    if (ln) setLean(ln);
  }, []);

  const handlePlaySound = useCallback((key: SoundKey) => {
    setActiveSoundInfo(key);
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    if (playingSound === key) {
      setPlayingSound(null);
      return;
    }
    setPlayingSound(key);
    stopAudioRef.current = playOceanSoundSample(key, () => {
      setPlayingSound(null);
    });
  }, [playingSound]);

  useEffect(() => {
    return () => {
      if (stopAudioRef.current) stopAudioRef.current();
    };
  }, []);

  const splitPcts = useMemo(() => {
    const def = rules.find((r) => r.is_default) || rules[0];
    if (!def) return undefined;
    return {
      provider: Number(def.provider_pct),
      village: Number(def.village_pct),
      platform: Number(def.platform_pct),
      conservation: Number(def.conservation_pct),
    };
  }, [rules]);

  const leanActive = Boolean(lean?.active || simulatingLean);

  const filtered = useMemo(() => {
    let list = experiences;
    if (activeCat) list = list.filter((x) => x.model_category === activeCat);
    if (selectedState) {
      list = list.filter((x) => (x.state || "").toLowerCase() === selectedState.toLowerCase());
    }
    if (leanActive) {
      list = list.filter((x) => x.blocked_reason == null && (!x.is_offshore || x.lean_season_friendly));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          (x.description || "").toLowerCase().includes(q) ||
          (x.village_name || "").toLowerCase().includes(q) ||
          (x.state || "").toLowerCase().includes(q) ||
          typeMeta(x.opportunity_type).label.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "price_min") return Number(a.price_min || 0) - Number(b.price_min || 0);
      if (sortBy === "-price_min") return Number(b.price_min || 0) - Number(a.price_min || 0);
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
    return sorted;
  }, [experiences, activeCat, selectedState, query, sortBy, leanActive]);

  const scrollToMarketplace = (cat?: string | null, state?: string | null) => {
    if (cat !== undefined) setActiveCat(cat);
    if (state !== undefined) setSelectedState(state);
    setTimeout(() => {
      marketplaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const currentSoundObj = HEARABLES.find((h) => h.key === activeSoundInfo) || HEARABLES[0];

  return (
    <div ref={rootRef} className="min-h-screen w-full bg-[#F3F8FB]">
      <Header />

      <main className="w-full">
        {/* ================= 1. EXECUTIVE FULL-SCREEN HERO BANNER ================= */}
        <section className="relative w-full overflow-hidden bg-[#041c33] text-white">
          {/* Deep Navy Gradient Base Layer */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#021120] via-[#052647] to-[#073a66]" />
          
          {/* Background image with low opacity */}
          <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-luminosity">
            <img
              src="/shg/p1-banner-boats.webp"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          {/* Dark gradient wash to guarantee high contrast */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#021120] via-transparent to-[#021120]/75" />

          {/* Subtle ocean grid pattern overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          <div className="relative mx-auto max-w-[1720px] px-4 py-8 sm:px-6 lg:px-8 xl:px-10 lg:py-11">
            <div className="flex flex-col items-start justify-between gap-8 xl:flex-row xl:items-center">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-950/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 shadow-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    O3L — Coastal Community Livelihood Initiative
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-bold text-emerald-300 shadow-md">
                    <ShieldCheck className="h-3 w-3" /> 100% Escrow &amp; Cooperative Endorsed
                  </span>
                </div>

                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl leading-tight drop-shadow-md">
                  Fisheries-Based Ecotourism —{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                    5 Community Livelihood Models
                  </span>
                </h1>
                
                <p className="mt-2.5 text-xs font-bold tracking-wide text-amber-300 sm:text-sm drop-shadow-sm">
                  Healthy Ocean &nbsp;•&nbsp; Stronger Fishing Communities &nbsp;•&nbsp; Sustainable Livelihoods &nbsp;•&nbsp; Vibrant Coastal Economies
                </p>

                <p className="mt-2.5 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-slate-100 drop-shadow-sm">
                  Transforming the deep generational sea knowledge, artisanal craft vallams, fresh culinary traditions, and coastal ecology of fishing families into reliable year-round income streams — especially safeguarding households during monsoon and 61-day fishing bans.
                </p>

                {/* Live Real-Time Platform Stats Grid */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl border border-sky-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-amber-300">
                      {experiences.length > 0 ? `${experiences.length}+` : "31+"}
                    </p>
                    <p className="text-[11px] font-bold text-white">Verified Experiences</p>
                    <p className="text-[10px] font-medium text-sky-200">Direct booking</p>
                  </div>

                  <div className="rounded-xl border border-emerald-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-emerald-300">
                      {families.length > 0 ? families.length : 8}
                    </p>
                    <p className="text-[11px] font-bold text-white">Registered Host Families</p>
                    <p className="text-[10px] font-medium text-emerald-200">Govt &amp; coop certified</p>
                  </div>

                  <div className="rounded-xl border border-sky-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-sky-300">4</p>
                    <p className="text-[11px] font-bold text-white">Southern States</p>
                    <p className="text-[10px] font-medium text-sky-200">TN • KL • KA • AP</p>
                  </div>

                  <div className="rounded-xl border border-teal-400/30 bg-[#02182d]/90 p-3 shadow-lg">
                    <p className="text-xl sm:text-2xl font-black text-teal-300">80%</p>
                    <p className="text-[11px] font-bold text-white">Direct Family Escrow</p>
                    <p className="text-[10px] font-medium text-teal-200">₹0 middleman cuts</p>
                  </div>
                </div>
              </div>

              {/* Right Hero Badge: "Same Ocean, More Opportunities" */}
              <div className="shrink-0 w-full xl:w-auto xl:max-w-md rounded-2xl border border-amber-300/60 bg-[#042240]/90 p-5 shadow-2xl backdrop-blur-lg">
                <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    <Anchor className="h-3.5 w-3.5" /> O3L Guiding Principle
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/40">
                    Verified Dynamic
                  </span>
                </div>

                <p className="mt-2.5 font-serif text-lg font-extrabold italic text-amber-300 sm:text-xl">
                  &ldquo;Same Ocean, More Opportunities&rdquo;
                </p>
                
                <p className="mt-1 text-xs font-semibold text-sky-100">
                  Fishing Continues &nbsp;·&nbsp; Tourism Adds Value &nbsp;·&nbsp; Stronger Communities
                </p>

                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  All listings are managed by authentic coastal fishing households. Direct phone numbers, exact land coordinates, and 100% escrow protection.
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button
                    size="sm"
                    onClick={() => scrollToMarketplace(null, null)}
                    className="flex-1 bg-amber-400 text-ocean-navy hover:bg-amber-300 font-bold shadow-md transition-all hover:scale-[1.02]"
                  >
                    <Search className="mr-1.5 h-3.5 w-3.5" /> Explore {experiences.length || 31} Experiences
                  </Button>
                  <Link href="/ecotourism/bookings" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold">
                      <Ticket className="mr-1.5 h-3.5 w-3.5" /> Bookings &amp; Ledger
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 4 State Pins Bar + Quick Jump to the 5 Models */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3.5 rounded-xl border border-sky-400/30 bg-[#02182d]/95 px-4 py-3 shadow-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Southern India States:
                </span>
                {STATE_PINS.map((s) => {
                  const isSelected = selectedState === s.state;
                  return (
                    <button
                      suppressHydrationWarning
                      key={s.state}
                      type="button"
                      onClick={() => scrollToMarketplace(undefined, isSelected ? null : s.state)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm transition-all",
                        isSelected
                          ? "border-amber-300 bg-amber-300 text-ocean-navy scale-105"
                          : "border-white/80 bg-white text-ocean-navy hover:bg-amber-50 hover:border-amber-200"
                      )}
                    >
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", s.pinColor)}>
                        📍
                      </span>
                      <span>{s.state}</span>
                    </button>
                  );
                })}
                {selectedState && (
                  <button
                    type="button"
                    onClick={() => setSelectedState(null)}
                    className="text-[11px] font-semibold text-sky-200 underline hover:text-white ml-1"
                  >
                    Clear state
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200 mr-1">
                  Jump to Model:
                </span>
                {MODEL_ORDER.map((k) => {
                  const m = MODEL_META[k];
                  return (
                    <a
                      key={k}
                      href={`#model-${m.number}`}
                      className="rounded-lg border border-sky-400/30 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white hover:text-ocean-navy hover:scale-105"
                    >
                      {m.number}. {m.short}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. LEAN SEASON MODE BANNER ================= */}
        <section className="mx-auto max-w-[1720px] px-4 pt-6 sm:px-6 lg:px-8 xl:px-10">
          <LeanSeasonBanner
            data={lean}
            simulating={simulatingLean}
            onToggleSimulate={handleToggleSimulateLean}
            onExplore={() => scrollToMarketplace(null)}
            onSelectCategory={(cat) => scrollToMarketplace(cat)}
          />
        </section>

        {/* ================= 3. THE 5 COMMUNITY LIVELIHOOD MODELS ================= */}
        <section className="mx-auto max-w-[1720px] px-4 py-9 sm:px-6 lg:px-8 xl:px-10">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ocean-blue">
                5-Model Livelihood Architecture
              </span>
              <h2 className="mt-0.5 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
                The 5 Community Livelihood Models
              </h2>
              <p className="mt-0.5 text-sm text-ocean-text-secondary">
                Each model combines coastal experiences, multi-household participation, and transparent community pricing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { icon: Users, label: "Community-Owned & Partnered", bg: "bg-sky-100 text-sky-900" },
                { icon: GraduationCap, label: "Women & Youth Empowerment", bg: "bg-emerald-100 text-emerald-900" },
                { icon: Calendar, label: "Lean Season Alternative Livelihood", bg: "bg-amber-100 text-amber-900" },
              ].map((pill) => (
                <span
                  key={pill.label}
                  className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold", pill.bg)}
                >
                  <pill.icon className="h-3.5 w-3.5" />
                  {pill.label}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Balanced Full-Width Model Cards */}
          <div className="space-y-6">
            {MODEL_ORDER.map((key) => {
              const meta = MODEL_META[key];
              const live = models.find((m) => m.key === key);

              return (
                <article
                  key={key}
                  id={`model-${meta.number}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-ocean"
                >
                  {/* Colored Header Bar */}
                  <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-white lg:px-7", meta.headerBg)}>
                    <div className="flex items-center gap-3">
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-black shadow", meta.badgeTextColor)}>
                        {meta.number}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold tracking-tight sm:text-xl">
                            {meta.label}
                          </h3>
                          <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] font-semibold">
                            {live?.experience_count || 5} Bookable Listings
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-amber-200">
                          {meta.taglineTop} &nbsp;•&nbsp; {meta.taglineBottom}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => scrollToMarketplace(key)}
                      className="bg-white text-ocean-navy hover:bg-amber-300 font-bold shadow"
                    >
                      Book Model {meta.number} ({meta.short}) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Balanced 3-Column Body */}
                  <div className="grid gap-6 p-5 lg:grid-cols-12 lg:p-6">
                    {/* COLUMN 1 (4 cols): Hero Visual + Highlight Cards */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img
                          src={meta.coverImage}
                          alt={meta.label}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                          <p className="text-xs font-medium leading-snug">{meta.subtitle}</p>
                        </div>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {meta.infographicHighlights.map((h) => (
                          <div
                            key={h.title}
                            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-ocean-foam p-2.5"
                          >
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-ocean-blue/40 bg-white">
                              <img
                                src={h.img}
                                alt={h.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-tight text-ocean-navy">
                                {h.title}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-snug text-ocean-text-secondary line-clamp-2">
                                {h.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* COLUMN 2 (4 cols): All 10 Activities + Who Earns in the Village */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-4 border-y border-slate-200 py-4 lg:border-x lg:border-y-0 lg:px-6 lg:py-0">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-ocean-blue">
                          What the Tourist Sees &amp; Experiences
                        </p>
                        {meta.keyDifference && (
                          <div className="mt-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-950">
                            ★ {meta.keyDifference}
                          </div>
                        )}
                        <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {meta.fullActivities.map((act) => (
                            <li
                              key={act}
                              className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-ocean-navy"
                            >
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ocean-green" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-ocean-muted">
                          Who Earns in the Fishing Community
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {meta.earners.map((e) => (
                            <div
                              key={e.who}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ocean-light text-base">
                                {e.emoji}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-ocean-navy">{e.who}</p>
                                <p className="truncate text-[11px] text-ocean-text-secondary">{e.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 3 (4 cols): Live Database Experiences (PostgreSQL) + Reference Guide */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                      <div>
                        <div className={cn("rounded-lg border px-3 py-1.5 text-xs font-extrabold flex items-center justify-between", meta.samplePillClass)}>
                          <span className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live Listings ({experiences.filter((x) => x.model_category === key).length || live?.experience_count || 5})
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white/70 px-1.5 py-0.5 rounded">
                            PostgreSQL DB
                          </span>
                        </div>

                        {/* Real database listings */}
                        <div className="mt-2.5 space-y-2">
                          {(experiences.filter((x) => x.model_category === key).length > 0
                            ? experiences.filter((x) => x.model_category === key).slice(0, 3)
                            : experiences.slice(0, 3)
                          ).map((exp) => (
                            <div
                              key={exp.id}
                              className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs hover:border-ocean-blue transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <Link
                                  href={`/ecotourism/${exp.slug || exp.id}`}
                                  className="font-bold text-xs text-ocean-navy hover:text-ocean-blue line-clamp-1"
                                >
                                  {exp.name}
                                </Link>
                                <span className="shrink-0 text-xs font-black text-ocean-green tabular-nums">
                                  {exp.display_price || (exp.price_min ? `₹${exp.price_min}` : "₹500")}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center justify-between text-[11px] text-ocean-text-secondary">
                                <span className="inline-flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 text-ocean-green shrink-0" />
                                  <span className="truncate">{exp.village_name || exp.district_name || exp.state || "Coastal Village"}</span>
                                </span>
                                {exp.family_name && (
                                  <span className="text-[10px] font-semibold text-ocean-coral truncate max-w-[130px]">
                                    ✓ {exp.family_name}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
                                {exp.contact_phone ? (
                                  <a
                                    href={`tel:${exp.contact_phone}`}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-ocean-blue hover:underline"
                                  >
                                    <Phone className="h-3 w-3" /> {exp.contact_phone}
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Verified Host</span>
                                )}
                                <Link
                                  href={`/ecotourism/${exp.slug || exp.id}`}
                                  className="inline-flex items-center gap-1 rounded bg-ocean-foam px-2 py-0.5 text-[10px] font-bold text-ocean-blue hover:bg-ocean-blue hover:text-white transition"
                                >
                                  Book Now <ArrowRight className="h-2.5 w-2.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Collapsible / Reference Planning Table */}
                        <details className="mt-3 group rounded-xl border border-slate-200 bg-slate-50/60 p-2 text-xs">
                          <summary className="cursor-pointer font-bold text-ocean-text-secondary flex items-center justify-between select-none">
                            <span>📊 Reference Economics Guide ({meta.sampleRevenue.length} services)</span>
                            <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <tbody className="divide-y divide-slate-100">
                                {meta.sampleRevenue.map((row) => (
                                  <tr key={row.experience} className="hover:bg-ocean-foam/40">
                                    <td className="px-2.5 py-1.5 font-medium text-ocean-navy text-[11px]">
                                      <span className="mr-1">{row.icon}</span>
                                      {row.experience}
                                    </td>
                                    <td className="px-2.5 py-1.5 text-right text-[11px]">
                                      <span className="font-bold text-ocean-green">{row.price}</span>{" "}
                                      <span className="text-[9px] text-slate-400">{row.unit}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </div>

                      <div className="rounded-lg bg-emerald-50/70 p-2.5 text-[11px] text-emerald-950 font-medium border border-emerald-100 flex items-start gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>All listings are backed by registered coastal fisher families with 100% escrow protection.</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ================= 4. FAMILY LIVELIHOOD ECOSYSTEM & MULTI-FAMILY PACKAGING ================= */}
        <section className="w-full border-y border-ocean-border bg-white py-10">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                💰 Don&apos;t Create Only One Income Source
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
                A Complete Family &amp; Village Livelihood Ecosystem
              </h2>
              <p className="mx-auto mt-1 max-w-2xl text-sm text-ocean-text-secondary">
                During the fishing-ban or lean season, instead of household income dropping to <b>₹0</b>,
                every member of a fishing family and multiple households (Family A to Family F) earn together.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              {/* Left: 8 Household Members Grid */}
              <div className="xl:col-span-6 rounded-2xl border border-ocean-border bg-ocean-foam p-5">
                <h3 className="text-lg font-extrabold text-ocean-navy">
                  👨‍👩‍👧‍👦 8 Household Member Roles in O3L
                </h3>
                <p className="mt-0.5 text-xs text-ocean-text-secondary">
                  Every family member contributes their skill — boat handling, cooking, storytelling, guiding, marine education, crafts, mechanics, and net making:
                </p>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {HOUSEHOLD_ROLES.map((r) => (
                    <div
                      key={r.member}
                      className="flex items-center gap-3 rounded-xl border border-ocean-border bg-white p-3 shadow-sm"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-light text-xl">
                        {r.emoji}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ocean-navy">{r.member}</p>
                        <p className="text-xs text-ocean-text-secondary">{r.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: 6-Family Package ("2 Days – Experience a Real Fishing Village" — ₹4,999/person) */}
              <div className="xl:col-span-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-extrabold uppercase text-white">
                    Multi-Family Village Package Example
                  </span>
                  <span className="text-2xl font-black text-ocean-navy">₹4,999 / person</span>
                </div>

                <h3 className="mt-2 text-lg font-extrabold text-ocean-navy">
                  &ldquo;2 Days – Experience a Real Fishing Village&rdquo;
                </h3>
                <p className="mt-0.5 text-xs text-ocean-text-secondary">
                  Don&apos;t make only the boat owner earn — O3L packages <b>6 families</b> together and automatically divides the payment among participating households:
                </p>

                <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {[
                    { fam: "Family A", role: "Homestay guest room", icon: "🏠" },
                    { fam: "Family B", role: "Boat trip", icon: "🛶" },
                    { fam: "Family C", role: "Seafood meal", icon: "🍛" },
                    { fam: "Family D", role: "Handicrafts", icon: "🧺" },
                    { fam: "Family E", role: "Local guide", icon: "🧭" },
                    { fam: "Family F", role: "Cultural performance", icon: "🥁" },
                  ].map((f) => (
                    <div key={f.fam} className="rounded-xl border border-amber-200 bg-white p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{f.icon}</span>
                        <span className="text-xs font-extrabold text-amber-800">{f.fam}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-ocean-navy">{f.role}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3.5 rounded-xl border border-ocean-border bg-white p-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-ocean-muted">
                    Includes All 7 Village Experiences:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      "✓ Homestay",
                      "✓ Local Breakfast",
                      "✓ Fishing-Village Walk",
                      "✓ Boat Experience",
                      "✓ Seafood Lunch",
                      "✓ Traditional Fishing Demonstration",
                      "✓ Sunset Experience",
                    ].map((inc) => (
                      <span key={inc} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                        {inc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {packages.length > 0 && (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {packages.map((p, i) => (
                  <PackageCard key={p.id} pkg={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================= 5. BOOKABLE MARKETPLACE ================= */}
        <section ref={marketplaceRef} className="mx-auto max-w-[1720px] px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ocean-coral">
                <Ticket className="h-3.5 w-3.5" /> Bookable Community Marketplace
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
                Book Directly with Fishing Families
              </h2>
              <p className="mt-0.5 text-sm text-ocean-text-secondary">
                Showing {filtered.length} of {experiences.length} verified experiences
                {selectedState ? ` in ${selectedState}` : " across Tamil Nadu, Kerala, Karnataka & Andhra Pradesh"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-ocean-border bg-white px-3 py-2 shadow-sm focus-within:border-ocean-blue">
                <Search className="mr-2 h-4 w-4 text-ocean-muted" />
                <input
                  suppressHydrationWarning
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search boats, homestay, village…"
                  className="w-52 bg-transparent text-sm outline-none placeholder:text-ocean-muted"
                  aria-label="Search experiences"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-ocean-border bg-white px-3 py-2 shadow-sm">
                <SlidersHorizontal className="h-4 w-4 text-ocean-muted" />
                <select
                  suppressHydrationWarning
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm font-semibold outline-none"
                  aria-label="Sort experiences"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ocean-border bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              <button
                suppressHydrationWarning
                onClick={() => setActiveCat(null)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
                  !activeCat
                    ? "border-ocean-deep bg-ocean-deep text-white shadow"
                    : "border-ocean-border bg-white text-ocean-text-secondary hover:border-ocean-blue"
                )}
              >
                🌊 All 5 Models ({experiences.length})
              </button>
              {MODEL_ORDER.map((key) => {
                const meta = MODEL_META[key];
                return (
                  <button
                    suppressHydrationWarning
                    key={key}
                    onClick={() => setActiveCat(activeCat === key ? null : key)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
                      activeCat === key
                        ? "border-ocean-blue bg-ocean-blue text-white shadow-sm"
                        : "border-ocean-border bg-white text-ocean-text-secondary hover:border-ocean-blue"
                    )}
                  >
                    {meta.number}. {meta.short}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {STATE_PINS.map((st) => (
                <button
                  suppressHydrationWarning
                  key={st.state}
                  type="button"
                  onClick={() => setSelectedState(selectedState === st.state ? null : st.state)}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-xs font-bold transition-all",
                    selectedState === st.state
                      ? "border-ocean-green bg-ocean-green text-white"
                      : "border-ocean-border bg-ocean-foam text-ocean-text-secondary hover:border-ocean-blue"
                  )}
                >
                  📍 {st.state}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-ocean-border bg-white overflow-hidden">
                  <div className="skeleton h-44 rounded-none" />
                  <div className="p-4 space-y-2.5">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3.5 w-1/2" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item, i) => (
                <ExperienceCard key={item.id} item={item} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-ocean-border bg-white py-12 text-center">
              <Waves className="mx-auto h-10 w-10 text-ocean-muted" />
              <p className="mt-2 font-semibold text-ocean-navy">No experiences match your current filters</p>
              <Button
                size="sm"
                className="mt-3"
                variant="outline"
                onClick={() => {
                  setActiveCat(null);
                  setSelectedState(null);
                  setSimulatingLean(false);
                  setQuery("");
                }}
              >
                Reset all filters
              </Button>
            </div>
          )}
        </section>

        {/* ================= 6. SOUTHERN INDIA COASTAL EXPERIENCE POINTS (VILLAGE A–E + MAP) ================= */}
        <section className="w-full border-y border-ocean-border bg-white py-11">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ocean-green">
                  <MapPin className="h-3.5 w-3.5" /> Southern India Implementation: Andhra Pradesh → Karnataka → Kerala → Tamil Nadu
                </span>
                <h2 className="mt-1 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
                  Every Coastal Village as an O3L Experience Point
                </h2>
                <p className="mt-0.5 text-sm text-ocean-text-secondary">
                  PostgreSQL Real-Time: {families.length || 8} registered coastal fishing families with land-calibrated harbour coordinates, official registration IDs, and direct contact.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowMap((s) => !s)}
                className="bg-ocean-blue text-white hover:bg-ocean-deep font-bold shadow transition hover:scale-[1.02]"
              >
                <MapPin className="mr-1.5 h-4 w-4" />
                {showMap ? "Hide Interactive Map" : `Open Interactive Map (${points.length || 24} Coastal Points)`}
              </Button>
            </div>

            {/* Dynamic Coastal Experience Village Points (PostgreSQL) */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(families.length > 0 ? families : []).map((fam) => (
                <div
                  key={fam.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ocean-blue hover:shadow-ocean flex flex-col justify-between space-y-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase text-ocean-blue truncate">
                        <MapPin className="h-3.5 w-3.5 text-ocean-green shrink-0" />
                        <span className="truncate">{fam.village_name || "Coastal Village"}, {fam.state}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        ✓ Verified Host
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-extrabold text-ocean-navy leading-snug">{fam.name}</h3>
                    <p className="mt-0.5 text-[11px] font-mono font-medium text-slate-500">
                      Reg: {fam.verification_id || `O3L-FWS-${fam.id.slice(0, 8).toUpperCase()}`}
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-ocean-text-secondary line-clamp-2">
                      {fam.description || `${fam.members_count || 5} member household specializing in ${fam.skills?.join(", ") || "coastal tourism"}.`}
                    </p>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {(fam.skills || ["boat guiding", "cooking"]).slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-md bg-ocean-foam border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-ocean-navy">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      {fam.phone ? (
                        <a
                          href={`tel:${fam.phone}`}
                          className="inline-flex items-center gap-1 font-bold text-ocean-blue hover:underline text-xs"
                          title="Call host directly"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" /> {fam.phone}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">Direct Contact Verified</span>
                      )}
                      {(fam.latitude && fam.longitude) && (
                        <a
                          href={fam.google_maps_url || `https://www.google.com/maps?q=${fam.latitude},${fam.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-ocean-green hover:underline"
                          title="Opens verified onshore landmark on Google Maps"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" /> Exact Harbour Pin
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (fam.village_name) {
                          setQuery(fam.village_name);
                          marketplaceRef.current?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="w-full rounded-xl bg-ocean-foam hover:bg-ocean-blue hover:text-white py-2 text-center text-xs font-bold text-ocean-navy transition shadow-xs"
                    >
                      View Village Experiences ({fam.village_name || fam.name}) →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showMap && points.length > 0 && (
              <div className="mt-7 rounded-2xl overflow-hidden border border-slate-200 shadow-ocean">
                <ExperienceMap points={points} />
              </div>
            )}
          </div>
        </section>

        {/* ================= 7. TRANSPARENT O3L REVENUE MODEL (80 / 10 / 5 / 5) ================= */}
        <section id="revenue-split" className="mx-auto max-w-[1720px] px-4 py-11 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-deep/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-ocean-deep">
                <ShieldCheck className="h-3.5 w-3.5" /> Transparent Revenue Rule
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-ocean-navy sm:text-3xl leading-tight">
                &ldquo;Tourism <span className="text-ocean-green">for</span> the Fishing Community, Not Tourism{" "}
                <span className="underline decoration-ocean-coral">Instead</span> of the Fishing Community&rdquo;
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ocean-text-secondary">
                O3L is designed so outsiders never take most of the money. Every booking shows the transparent flow:
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { pct: "80%", label: "Fisher / Service Provider (Family Income)", ex: "₹2,400 from a ₹3,000 booking" },
                  { pct: "10%", label: "Village & Community Fund", ex: "₹300 shared community pool" },
                  { pct: "5%", label: "O3L Platform Operations", ex: "₹150 app, payments & support" },
                  { pct: "5%", label: "Safety, Environment & Insurance Reserve", ex: "₹150 life jackets, permits & conservation" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-ocean-border bg-white px-3.5 py-2.5 shadow-sm">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-ocean-navy">{item.label}</p>
                      <p className="text-[11px] text-ocean-text-secondary">{item.ex}</p>
                    </div>
                    <span className="text-base font-black text-ocean-blue">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <SplitVisualizer pcts={splitPcts} />
            </div>
          </div>
        </section>

        {/* ================= 8. MODEL 4 DEEP DIVE: DISCOVER & LISTEN TO THE OCEAN ================= */}
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-ocean-navy via-ocean-deep to-ocean-blue py-11 text-white">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300">
                <Headphones className="h-3.5 w-3.5" /> Model 4 · Marine Bioacoustics (PAM) &amp; Citizen Science
              </span>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                &ldquo;Discover the Ocean&rdquo; &amp; &ldquo;Listen to the Ocean&rdquo;
              </h2>
              <p className="mx-auto mt-1 max-w-2xl text-sm text-ocean-sand">
                Students and visitors explore 10 marine science themes and put on headphones to experience real underwater bioacoustics — creating skilled jobs for educated youth from fishing families.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {DISCOVER_TOPICS.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm"
                >
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {HEARABLES.map((h) => {
                const isPlaying = playingSound === h.key;
                const isFocused = activeSoundInfo === h.key;
                return (
                  <button
                    suppressHydrationWarning
                    key={h.key}
                    type="button"
                    onClick={() => handlePlaySound(h.key)}
                    className={cn(
                      "text-left rounded-xl p-3.5 transition-all border backdrop-blur-sm",
                      isPlaying
                        ? "border-amber-300 bg-white/25 shadow-glow -translate-y-0.5"
                        : isFocused
                          ? "border-sky-300/60 bg-white/15"
                          : "border-white/15 bg-white/10 hover:-translate-y-0.5 hover:bg-white/15"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg">
                          {h.icon}
                        </span>
                        <p className="text-sm font-bold text-white">{h.title}</p>
                      </div>
                      <span className={cn("rounded-full p-1.5", isPlaying ? "bg-amber-300 text-ocean-navy" : "bg-white/10 text-white/80")}>
                        {isPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ocean-sand">{h.detail}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl border border-amber-300/40 bg-black/25 p-4 backdrop-blur-md sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  🔊 What am I hearing? — {currentSoundObj.icon} {currentSoundObj.title}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-white/95">{currentSoundObj.whatHearing}</p>
              </div>
              <Link href="/sounds" className="shrink-0">
                <Button size="sm" className="bg-amber-400 text-ocean-navy hover:bg-amber-300 font-bold">
                  <Headphones className="mr-1.5 h-3.5 w-3.5" /> Full Ocean Sound Library
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= 9. MODEL 5 DEEP DIVE: SATURDAY VILLAGE FESTIVAL ================= */}
        <section className="mx-auto max-w-[1720px] px-4 py-11 sm:px-6 lg:px-8 xl:px-10">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-rose-600">
              <CalendarHeart className="h-3.5 w-3.5" /> Model 5 · Weekend Coastal Community Festival &amp; Marketplace
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
              &ldquo;Saturday – Life of the Fishing Village&rdquo;
            </h2>
            <p className="mx-auto mt-1 max-w-2xl text-sm text-ocean-text-secondary">
              Instead of waiting for tourists to come every day, a weekly or monthly village festival brings the whole community together to earn.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FESTIVAL_SCHEDULE.map((block) => (
              <div
                key={block.time}
                className="rounded-xl border border-ocean-border bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean-coral/15 text-xl">
                    {block.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ocean-coral">{block.time}</p>
                    <p className="text-sm font-extrabold text-ocean-navy">Saturday Festival Program</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="rounded-lg bg-ocean-foam px-3 py-2 text-xs sm:text-sm font-semibold text-ocean-navy">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-xl border border-ocean-border bg-white p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-ocean-muted">
                10 Community Festival Revenue Streams
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {FESTIVAL_REVENUE_STREAMS.map((stream) => (
                  <span
                    key={stream}
                    className="rounded-full border border-ocean-border bg-ocean-foam px-3 py-1 text-xs font-bold text-ocean-navy"
                  >
                    ✓ {stream}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
                <p className="text-[11px] font-bold uppercase text-emerald-800">Scenario A (100 Visitors)</p>
                <p className="mt-0.5 text-[11px] text-emerald-700">100 visitors × ₹300 avg spend</p>
                <p className="mt-1 text-xl font-black text-emerald-950">₹30,000</p>
                <p className="text-[10px] text-emerald-800">per Saturday event</p>
              </div>
              <div className="rounded-xl border border-ocean-blue/30 bg-sky-50/80 p-3.5 text-center">
                <p className="text-[11px] font-bold uppercase text-ocean-blue">Scenario B (300 Visitors)</p>
                <p className="mt-0.5 text-[11px] text-slate-600">300 visitors × ₹300 avg spend</p>
                <p className="mt-1 text-xl font-black text-ocean-navy">₹90,000</p>
                <p className="text-[10px] text-slate-600">per Saturday event</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 10. GLOBAL & INDIAN FAO PRECEDENTS ================= */}
        <section className="w-full border-t border-ocean-border bg-white py-11">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-light px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-ocean-blue">
                <Globe2 className="h-3.5 w-3.5" /> Proven Global &amp; Indian Evidence (FAO &amp; Govt. of India)
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-ocean-navy sm:text-3xl">
                What We Learn from Other Countries &amp; Tamil Nadu
              </h2>
              <p className="mx-auto mt-1 max-w-2xl text-sm text-ocean-text-secondary">
                &ldquo;Take proven community-livelihood principles and build a Southern Indian coastal model around our own fishing culture.&rdquo;
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {GLOBAL_PRECEDENTS.map((g) => (
                <div
                  key={g.place}
                  className="flex flex-col justify-between rounded-xl border border-ocean-border bg-ocean-foam p-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{g.flag}</span>
                      <div>
                        <h3 className="text-sm font-extrabold text-ocean-navy">{g.place}</h3>
                        <p className="text-[11px] font-bold text-ocean-blue">{g.tag}</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-ocean-text-secondary">
                      {g.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= 11. REVIEWS ================= */}
        {reviews.length > 0 && (
          <section className="w-full border-t border-ocean-border bg-ocean-foam py-11">
            <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
              <div className="mb-6 text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ocean-blue">Verified Stays</span>
                <h2 className="mt-1 text-2xl font-extrabold text-ocean-navy">What Travellers Say</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.slice(0, 6).map((r) => (
                  <figure
                    key={r.id}
                    className="rounded-xl border border-ocean-border bg-white p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <span key={s} className={s < r.rating ? "" : "text-ocean-border"}>★</span>
                      ))}
                    </div>
                    {r.title && <figcaption className="text-sm font-bold text-ocean-navy">{r.title}</figcaption>}
                    <blockquote className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ocean-text-secondary">
                      &ldquo;{r.comment}&rdquo;
                    </blockquote>
                    <p className="mt-3 flex items-center gap-2 text-xs text-ocean-muted">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ocean-blue/15 font-bold text-ocean-blue">
                        {(r.user_name || "T")[0]}
                      </span>
                      {r.user_name || "Traveller"}
                      {r.is_verified_stay && <EcoBadge tone="green">✓ Verified booking</EcoBadge>}
                    </p>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
