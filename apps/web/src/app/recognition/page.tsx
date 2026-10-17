"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  BadgeCheck,
  IndianRupee,
  MapPin,
  Layers,
  Building2,
  Globe2,
  Waves,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Target,
  Award,
  Calculator,
  ListChecks,
  TrendingUp,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassCard, SkeletonList, SectionHeader } from "@/components/ui/ocean-components";
import { fetchCms, fetchCmsList } from "@/lib/api-helpers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Level = "individual" | "village" | "district" | "state" | "region" | "zone";

const LEVELS: { key: Level; label: string; icon: typeof Users }[] = [
  { key: "individual", label: "People", icon: Users },
  { key: "village", label: "Villages", icon: MapPin },
  { key: "district", label: "Districts", icon: Building2 },
  { key: "state", label: "States", icon: Globe2 },
  { key: "region", label: "Coast", icon: Waves },
  { key: "zone", label: "Zones", icon: Layers },
];

/**
 * Per-level "how recognition works" copy. The `board` text mirrors exactly how
 * recognition/views.py:_grouped + _aggregate_rows build each row, so this
 * stays honest about what the numbers actually mean.
 */
const LEVEL_GUIDE: Record<
  Level,
  { blurb: string; board: string; ranks: string; steps: { title: string; body: string }[] }
> = {
  individual: {
    blurb: "Your personal standing across every verified contribution you have ever submitted.",
    board: "One row per contributor, worldwide. Everyone with a scoreboard record is listed and ordered by their personal total.",
    ranks: "Your total is the sum of B × Q × V × I across all of your verified contributions — the more you verify, and the higher the quality, the higher you climb.",
    steps: [
      {
        title: "Submit through the Contribute wizard",
        body: "Sightings, ocean sounds, fish catches, observations, guides, events and clean-ups all earn points. Pick the type that fits what you actually recorded.",
      },
      {
        title: "Only verified entries score",
        body: "Pending or rejected contributions add nothing. Complete your profile and add clear notes, dates and locations so a moderator can verify you first time.",
      },
      {
        title: "Push quality up, not just quantity",
        body: "A High-quality entry scores 1.5× while a Low one scores 0.5× — three times the points for the same effort. Sharp photos and precise species IDs move Q.",
      },
      {
        title: "Clear the 25-verified marketplace gate",
        body: "At 25 verified contributions you unlock the data marketplace and can sell verified records to agencies, which adds ₹ earnings on top of your points.",
      },
    ],
  },
  village: {
    blurb: "How your village ranks against every other coastal village on the platform.",
    board: "One row per village. Every contributor whose profile is linked to that village is pooled, and the village is scored on the combined total of its people.",
    ranks: "Village score = sum of every member's personal total. Because it is a sum, a village with many steady contributors beats a village with one standout.",
    steps: [
      {
        title: "Set your village in your profile",
        body: "If your profile has no village you appear on the People board but contribute to no village at all. This is the single most common reason a village looks empty.",
      },
      {
        title: "Verify as a village, not as individuals",
        body: "The village total only counts verified contributions. A group that reviews each other's entries before submitting lifts everyone at once.",
      },
      {
        title: "Bring neighbours in",
        body: "Members is a real column on this board, and the average score is shown too. Ten fishers submitting one solid catch each will outrank a lone expert.",
      },
      {
        title: "Keep entries tied to the right village",
        body: "Contributions inherit the village from the contributor's profile at scoring time, so an outdated profile silently credits the wrong village.",
      },
    ],
  },
  district: {
    blurb: "Every village inside a district rolled up into a single district score.",
    board: "One row per district. Each contributor is grouped by the district of their village, so a district is only as visible as the villages that have profiled into it.",
    ranks: "District score = sum of all members' totals grouped by district. Districts with more mapped villages appear; districts with no profiled members do not.",
    steps: [
      {
        title: "Make sure your village sits in the right district",
        body: "The roll-up is village → district, so a wrong district on a village record pushes those points into the wrong row.",
      },
      {
        title: "Encourage neighbouring villages to onboard",
        body: "A district only draws from villages with at least one profiled contributor. Onboarding a second village is worth more than doubling one village.",
      },
      {
        title: "Aim for verified, not just submitted",
        body: "District points are the sum of personal totals, and personal totals only count verified work.",
      },
      {
        title: "Watch the average column",
        body: "The board shows avg points per member. A district rising on average is a healthier signal than one carried by a single large village.",
      },
    ],
  },
  state: {
    blurb: "State-level standings, and the board our yearly awards are issued against.",
    board: "One row per state, grouped from the state recorded on each contributor. States are compared on the combined score of everyone registered there.",
    ranks: "State score = sum of every contributor's total in that state. The top 3 contributors in every state receive a yearly award.",
    steps: [
      {
        title: "Register your state correctly",
        body: "State is derived from your village's district where possible, and falls back to your profile metadata. Keep both accurate.",
      },
      {
        title: "Go for the top 3 in your state",
        body: "State awards are issued to the top three contributors per state each year, plus one for anyone clearing the 25-item marketplace gate.",
      },
      {
        title: "Chase the Top Observer badge",
        body: "Being among the top 50 point earners in your state earns the Top Observer badge, which is granted automatically from your contribution history.",
      },
      {
        title: "Sell verified data to add earnings",
        body: "Points and ₹ are tracked separately. State standings show earnings alongside points, so verified sales strengthen your state's profile.",
      },
    ],
  },
  region: {
    blurb: "Coastal regions compared — the broadest geography on the scoreboard.",
    board: "One row per coastal region, grouped from the region recorded on each contributor's village. A region pools every village mapped to it.",
    ranks: "Region score = sum of all contributors mapped to that coastal region. Regions with more mapped villages naturally field more members.",
    steps: [
      {
        title: "Link your village to a coastal region",
        body: "The region roll-up reads the village's region field. Villages with no region set simply never appear on this board.",
      },
      {
        title: "Think across villages, not just yours",
        body: "Because a region spans many villages, onboarding effort pays off at this level even when your own village is already active.",
      },
      {
        title: "Keep contributions verified and region-correct",
        body: "A contribution scored while your profile pointed at a different region will credit that region instead.",
      },
      {
        title: "Use this board for regional campaigns",
        body: "Region totals are the right lens for beach drives and awareness weeks that span more than one district.",
      },
    ],
  },
  zone: {
    blurb: "Awareness zones — the operational geography our field programmes are run against.",
    board: "One row per awareness zone, rolled up through village → district → zone. Only contributors whose village maps to a zone are counted.",
    ranks: "Zone score = sum of every contributor mapped to that zone. Zones are ordered by that combined score, with members and average shown.",
    steps: [
      {
        title: "Confirm your village belongs to a zone",
        body: "The path is village → district → zone. If any link in that chain is missing, your points never reach a zone row.",
      },
      {
        title: "Coordinate with zone volunteers",
        body: "Zones are how field programmes are organised, so coordinating submissions inside a zone lifts the whole row rather than scattering points.",
      },
      {
        title: "Submit the work you do in the field",
        body: "Clean-up drives, sightings and sounds recorded during zone activity all score, and they also refresh the underlying contribution modules.",
      },
      {
        title: "Track movement, not just rank",
        body: "Each row carries an up/down marker against yesterday's snapshot, so a zone climbing steadily is improving even if it is not yet top.",
      },
    ],
  },
};

interface Summary {
  contributors: number;
  total_points: number;
  verified_contributions: number;
  data_items_sold: number;
  gross_sales_inr: number;
  total_earnings_inr: number;
  marketplace_eligible: number;
  marketplace_threshold: number;
  states?: { state: string; members: number; points: number; earnings: number; verified: number }[];
}

interface Tier {
  key: string;
  name: string;
  min_verified: number;
  min_points: number;
  color: string;
  icon: string;
  unlocks: string;
  order: number;
}

interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
}

interface MyScore {
  total_score: number;
  verified_contributions: number;
  total_contributions: number;
  quality_average: number;
  state: string;
  coastal_region: string | null;
  tier: string;
  tier_info: Tier;
  next_tier: Tier | null;
  next_tier_progress: number;
  marketplace_progress: number;
  marketplace_eligible: boolean;
  marketplace_threshold: number;
  badges: string[];
  data_items_sold: number;
  gross_sales_inr: number;
  earnings_inr: number;
  agency_referrals: number;
  rank: number | null;
  formula: string;
}

interface PersonRow {
  rank: number;
  rank_movement: number;
  user: string;
  slug: string;
  display_name: string;
  user_name: string;
  occupation: string | null;
  village_name: string | null;
  district_name: string | null;
  state: string;
  region_name: string | null;
  total_score: number;
  verified_contributions: number;
  data_items_sold: number;
  earnings_inr: number;
  marketplace_eligible: boolean;
  tier: string;
  tier_display: string;
  badges: string[];
}

interface GroupRow {
  rank: number;
  rank_movement: number;
  level: Level;
  scope_key: string;
  label: string;
  state?: string;
  total_score: number;
  members: number;
  verified_contributions: number;
  data_items_sold: number;
  earnings_inr: number;
  marketplace_eligible_members: number;
  avg_score: number;
}

type BoardRow = PersonRow | GroupRow;

interface Award {
  id: string;
  category: string;
  category_display: string;
  year: number;
  title: string;
  description: string;
  score: number;
  rank: number | null;
  user_name: string;
  village_name: string | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("o3l_access_token");
}

function isGroup(row: BoardRow): row is GroupRow {
  return typeof (row as GroupRow).members === "number";
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
}

/* ------------------------------------------------------------------ */
/* animated counter                                                     */
/* ------------------------------------------------------------------ */
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const from = shown;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {prefix}
      {fmt(shown)}
      {suffix}
    </span>
  );
}

function RankMark({ rank }: { rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  if (medal) {
    return (
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-xl ring-2 ring-amber-200 animate-scale-in">
        {medal}
      </span>
    );
  }
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-light text-sm font-bold text-ocean-navy">
      #{rank}
    </span>
  );
}

function MovementArrow({ delta }: { delta?: number }) {
  if (!delta) return <span className="text-xs text-ocean-text-secondary/60">—</span>;
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUp className="h-3 w-3" />
        {delta}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500">
      <ArrowDown className="h-3 w-3" />
      {Math.abs(delta)}
    </span>
  );
}

function TierChip({ tier, label, color }: { tier?: string; label?: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${color || "#087EA4"}1a`, color: color || "#087EA4" }}
    >
      {label || tier}
    </span>
  );
}

function Progress({ value, color = "#087EA4", delay = 0 }: { value: number; color?: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(0, Math.min(100, value))), 120 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ocean-light">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* scoring formula — mirrors contributions/scoring.py                   */
/* ------------------------------------------------------------------ */
const MULTIPLIERS = [
  { key: "B", name: "Base points", color: "#087EA4", rows: ["Set by the contribution catalogue for each contribution type"], note: "The starting value before any multiplier." },
  { key: "Q", name: "Quality", color: "#8B5CF6", rows: ["0.50 Low", "1.00 Standard", "1.20 Good", "1.50 High"], note: "How complete, accurate and well-evidenced the entry is." },
  { key: "V", name: "Verification", color: "#10B981", rows: ["0.50 Unverified", "1.00 Community", "1.50 Expert", "2.00 High-value"], note: "Who confirmed the record, and how strongly." },
  { key: "I", name: "Impact", color: "#F59E0B", rows: ["1.00 Normal", "1.50 Important", "2.00 Very high"], note: "How much the record matters to conservation and research." },
];

function FormulaCard() {
  return (
    <div className="rounded-xl border border-ocean-blue/25 bg-gradient-to-br from-white to-ocean-blue/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-ocean-blue" />
        <p className="font-bold text-ocean-navy">Final Score = B × Q × V × I</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {MULTIPLIERS.map((m) => (
          <div key={m.key} className="rounded-lg bg-white/80 p-3 ring-1 ring-ocean-light">
            <div className="mb-1 flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold" style={{ color: m.color }}>{m.key}</span>
              <span className="text-xs font-semibold text-ocean-navy">{m.name}</span>
            </div>
            <ul className="space-y-0.5">
              {m.rows.map((r) => (
                <li key={r} className="text-[11px] leading-tight text-ocean-text-secondary">{r}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-[10px] leading-tight text-ocean-text-secondary/80">{m.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-ocean-light/60 px-3 py-2 text-[11px] text-ocean-text-secondary">
        <b className="text-ocean-navy">R (relevance)</b> is a publication gate only — it decides whether an entry
        is published or sent to review, and is never multiplied into the score.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* per-level "how recognition works" panel                              */
/* ------------------------------------------------------------------ */
function LevelGuide({
  level,
  label,
  rows,
  tiers,
  badges,
  summaryThreshold,
}: {
  level: Level;
  label: string;
  rows: BoardRow[];
  tiers: Tier[];
  badges: BadgeDef[];
  summaryThreshold: number;
}) {
  const guide = LEVEL_GUIDE[level];
  const [open, setOpen] = useState(true);

  const boardsOnLevel = rows.length;
  const topScore = rows[0]?.total_score ?? 0;
  const combinedPoints = rows.reduce((s, r) => s + (r.total_score || 0), 0);
  const combinedVerified = rows.reduce((s, r) => s + (r.verified_contributions || 0), 0);
  const combinedMembers = rows.reduce((s, r) => s + (isGroup(r) ? r.members : 1), 0);
  const combinedEarnings = rows.reduce((s, r) => s + (r.earnings_inr || 0), 0);

  const stats = [
    { label: level === "individual" ? "Contributors ranked" : "Boards ranked", value: fmt(boardsOnLevel) },
    { label: level === "individual" ? "People counted" : "Members pooled", value: fmt(combinedMembers) },
    { label: "Verified entries", value: fmt(combinedVerified) },
    { label: "Points on this board", value: fmt(combinedPoints) },
  ];

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-ocean-blue/25 bg-white shadow-ocean">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-gradient-to-r from-ocean-blue/10 to-transparent px-4 py-3 text-left transition-colors hover:from-ocean-blue/15"
      >
        <Compass className="h-4 w-4 shrink-0 text-ocean-blue" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ocean-navy">How recognition works on the {label} board</p>
          <p className="truncate text-xs text-ocean-text-secondary">{guide.blurb}</p>
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-ocean-text-secondary transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-4 p-4">
          {/* live figures for this board */}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-ocean-light/60 px-3 py-2">
                  <p className="text-lg font-extrabold text-ocean-navy">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-ocean-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* how the board is built + how ranking works */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-ocean-light/40 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ocean-navy">
                <Layers className="h-3.5 w-3.5" /> How this board is built
              </p>
              <p className="text-xs leading-relaxed text-ocean-text-secondary">{guide.board}</p>
              {rows.length > 0 && (
                <p className="mt-2 text-[11px] text-ocean-text-secondary">
                  Top score here is <b className="text-ocean-navy">{fmt(topScore)} pts</b>
                  {combinedEarnings > 0 && <> · <b className="text-ocean-navy">₹{fmt(combinedEarnings)}</b> earned in total</>}.
                </p>
              )}
            </div>
            <div className="rounded-lg bg-ocean-light/40 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ocean-navy">
                <TrendingUp className="h-3.5 w-3.5" /> How ranking is decided
              </p>
              <p className="text-xs leading-relaxed text-ocean-text-secondary">{guide.ranks}</p>
              <p className="mt-2 text-[11px] text-ocean-text-secondary">
                The up/down marker on each row compares today&apos;s rank with yesterday&apos;s snapshot.
              </p>
            </div>
          </div>

          {/* actionable steps */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ocean-navy">
              <ListChecks className="h-3.5 w-3.5" /> How to earn recognition here
            </p>
            <ol className="grid gap-2 sm:grid-cols-2">
              {guide.steps.map((s, i) => (
                <li key={s.title} className="flex gap-2.5 rounded-lg border border-ocean-light bg-white p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ocean-blue text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ocean-navy">{s.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ocean-text-secondary">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <FormulaCard />

          {/* tiers + badges */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-ocean-light p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ocean-navy">
                <Award className="h-3.5 w-3.5" /> Tiers — earned on verified count
              </p>
              <ul className="space-y-1.5">
                {tiers.map((t) => (
                  <li key={t.key} className="flex items-center gap-2 text-xs">
                    <span className="text-base leading-none">{t.icon}</span>
                    <span className="font-semibold text-ocean-navy">{t.name}</span>
                    <span className="ml-auto shrink-0 font-semibold" style={{ color: t.color }}>
                      {t.min_verified}+ verified
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-ocean-text-secondary">
                Tiers are individual. On a group board they show up through each member&apos;s contribution.
              </p>
            </div>

            <div className="rounded-lg border border-ocean-light p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ocean-navy">
                <CheckCircle2 className="h-3.5 w-3.5" /> Badges — granted automatically
              </p>
              <ul className="space-y-1.5">
                {badges.map((b) => (
                  <li key={b.key} className="flex gap-2 text-xs">
                    <span className="text-base leading-none">{b.icon}</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-ocean-navy">{b.name}</span>
                      <p className="text-[11px] leading-tight text-ocean-text-secondary">{b.criteria}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-ocean-blue/30 bg-ocean-blue/5 p-3 text-xs text-ocean-text-secondary">
            <b className="text-ocean-navy">Marketplace gate:</b> {summaryThreshold} verified contributions before any
            listing goes live. Once cleared you can sell verified data, and each paid sale adds both the{" "}
            <b className="text-ocean-navy">Trusted Data Seller</b> badge and ₹ earnings shown on this board.
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                                 */
/* ------------------------------------------------------------------ */
export default function RecognitionPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [myScore, setMyScore] = useState<MyScore | null>(null);
  const [boards, setBoards] = useState<Partial<Record<Level, BoardRow[]>>>({});
  const [level, setLevel] = useState<Level>("individual");
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingMine, setLoadingMine] = useState(true);

  /* public data ---------------------------------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const [sum, tierList, badgeList, awardList] = await Promise.all([
        fetchCms<Summary>("/recognition/summary/"),
        fetchCmsList<Tier>("/recognition/tiers/"),
        fetchCmsList<BadgeDef>("/recognition/badges/"),
        fetchCmsList<Award>("/recognition/awards/"),
      ]);
      if (!alive) return;
      setSummary(sum);
      setTiers(tierList || []);
      setBadges(badgeList || []);
      setAwards((awardList || []).slice(0, 6));
      setLoadingPublic(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* my score ------------------------------------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const token = getToken();
      if (!token) {
        setLoadingMine(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/recognition/scores/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && alive) setMyScore(await res.json());
      } catch {
        /* not signed in — panel falls back to a CTA */
      } finally {
        if (alive) setLoadingMine(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* board by level ------------------------------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingBoard(true);
      const cached = boards[level];
      if (!cached) {
        const data = await fetchCmsList<BoardRow>(`/recognition/leaderboard/?level=${level}&limit=50`);
        if (alive) setBoards((prev) => ({ ...prev, [level]: data || [] }));
      }
      if (alive) setLoadingBoard(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const rows = boards[level] || [];
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const currentTier = myScore?.tier_info;
  const nextTier = myScore?.next_tier;

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />

      <main>
        {/* ---------------- hero ---------------- */}
        <PageHero bare className="pt-16 pb-28">
          <div className="relative mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-400/15 text-sky-200 border border-sky-400/30 mb-5 tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Recognition &amp; Scoreboard
            </span>
            <h1 className="mb-4 text-3xl sm:text-5xl font-black tracking-tight text-white">
              Every verified drop builds the ocean
              <span className="relative ml-2 inline-block text-amber-300">
                ledger
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-base text-slate-300 md:text-lg">
              Final Score = B × Q × V × I — base points × quality × verification × impact.
              Reach 25 verified contributions to unlock the verified marketplace.
            </p>

            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {[
                { label: "Contributors", value: summary?.contributors ?? 0, icon: Users, delay: 120 },
                { label: "Score points", value: summary?.total_points ?? 0, icon: Star, delay: 180 },
                { label: "Verified items", value: summary?.verified_contributions ?? 0, icon: BadgeCheck, delay: 240 },
                { label: "Paid out (₹)", value: summary?.total_earnings_inr ?? 0, icon: IndianRupee, delay: 300 },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-sky-400/25 bg-[#02182d]/80 px-4 py-4 backdrop-blur-sm hover:border-sky-400/50 transition-colors shadow-lg"
                  style={{ animationDelay: `${s.delay}ms` }}
                >
                  <s.icon className="mx-auto mb-1.5 h-5 w-5 text-sky-400" />
                  <p className="text-2xl font-black text-white">
                    {loadingPublic ? "—" : <AnimatedNumber value={s.value} prefix={s.label === "Paid out (₹)" ? "₹" : ""} />}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* wave */}
          <svg className="absolute -bottom-px left-0 h-16 w-full text-ocean-foam" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
            <path
              fill="currentColor"
              d="M0,64 C240,120 480,0 720,32 C960,64 1200,128 1440,72 L1440,120 L0,120 Z"
            />
          </svg>
        </PageHero>

        {/* ---------------- marketplace gate + my score ---------------- */}
        <section className="relative z-10 mx-auto -mt-12 max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10 pb-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* my score */}
            <GlassCard className="lg:col-span-2 animate-fade-in-up">
              {loadingMine ? (
                <div className="space-y-3">
                  <div className="skeleton h-5 w-40" />
                  <div className="skeleton h-24 w-full" />
                </div>
              ) : myScore ? (
                <>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ocean-text-secondary">My scoreboard card</p>
                      <h2 className="text-xl font-bold text-ocean-navy">
                        {currentTier?.icon} {currentTier?.name} tier · {myScore.state || "Coastal India"}
                      </h2>
                      <p className="text-sm text-ocean-text-secondary">
                        {myScore.coastal_region ? `${myScore.coastal_region} · ` : ""}
                        {myScore.verified_contributions} verified of {myScore.total_contributions} contributions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold text-ocean-blue">
                        <AnimatedNumber value={myScore.total_score} />
                      </p>
                      <p className="text-xs text-ocean-text-secondary">
                        ₹{fmt(myScore.earnings_inr)} earned · {myScore.data_items_sold} items sold
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Quality (Q avg)", value: (myScore.quality_average || 0).toFixed(2), hint: "0.50 – 1.50" },
                      { label: "Agency referrals", value: myScore.agency_referrals, hint: "CT09 surveillance" },
                      { label: "Your state rank", value: myScore.rank ? `#${myScore.rank}` : "—", hint: myScore.state || "" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-ocean-light/70 px-3 py-2.5">
                        <p className="text-lg font-bold text-ocean-navy">{m.value}</p>
                        <p className="text-[11px] uppercase tracking-wide text-ocean-text-secondary">{m.label}</p>
                        <p className="text-[11px] text-ocean-text-secondary/70">{m.hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-medium text-ocean-text-secondary">
                        <span>
                          {nextTier ? `${nextTier.icon} ${nextTier.name}` : "Top tier reached"}
                        </span>
                        <span>{myScore.next_tier_progress}%</span>
                      </div>
                      <Progress value={myScore.next_tier_progress} color={nextTier?.color || "#087EA4"} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-medium text-ocean-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Marketplace gate · {myScore.marketplace_threshold} verified
                        </span>
                        <span>{myScore.marketplace_progress}%</span>
                      </div>
                      <Progress value={myScore.marketplace_progress} color="#10B981" delay={160} />
                    </div>
                  </div>

                  {myScore.badges?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {myScore.badges.map((b) => (
                        <span key={b} className="rounded-full bg-ocean-blue/10 px-3 py-1 text-xs font-semibold text-ocean-blue">
                          {b.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col justify-center py-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ocean-text-secondary">Your score</p>
                  <h2 className="mb-2 text-xl font-bold text-ocean-navy">See your B × Q × V × I breakdown</h2>
                  <p className="mb-5 max-w-md text-sm text-ocean-text-secondary">
                    Sign in to track your tier, state rank, marketplace eligibility and ₹ earnings on the live scoreboard.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/register">Create account</Link>
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* marketplace gate */}
            <GlassCard variant="tinted" className="animate-fade-in-up" >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ocean-text-secondary">Data marketplace</p>
              <h3 className="mb-3 text-lg font-bold text-ocean-navy">₹ {fmt(summary?.total_earnings_inr ?? 0)} paid to contributors</h3>
              <div className="mb-4 space-y-2 text-sm text-ocean-text-secondary">
                <p className="flex items-center justify-between">
                  <span>Data items sold</span>
                  <b className="text-ocean-navy">{fmt(summary?.data_items_sold ?? 0)}</b>
                </p>
                <p className="flex items-center justify-between">
                  <span>Gross sales</span>
                  <b className="text-ocean-navy">₹{fmt(summary?.gross_sales_inr ?? 0)}</b>
                </p>
                <p className="flex items-center justify-between">
                  <span>Marketplace eligible</span>
                  <b className="text-emerald-600">{summary?.marketplace_eligible ?? 0}</b>
                </p>
              </div>
              <div className="rounded-lg bg-white/70 p-3 text-xs text-ocean-text-secondary">
                <b className="text-ocean-navy">Gate:</b> {summary?.marketplace_threshold ?? 25} verified contributions before any
                listing goes live. Surveillance data is never publicly priced — it goes through an agency referral.
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href="/marketplace">
                  Open marketplace <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </GlassCard>
          </div>
        </section>

        {/* ---------------- scoreboard ---------------- */}
        <section className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
          <SectionHeader
            title="Scoreboard"
            subtitle="Individuals, villages, districts, states, coastal regions and awareness zones"
          />

          <Tabs value={level} onValueChange={(v) => setLevel(v as Level)}>
            <div className="mb-6 overflow-x-auto pb-1">
              <TabsList className="h-auto flex-wrap justify-start bg-white p-1.5 shadow-sm">
                {LEVELS.map((l) => (
                  <TabsTrigger key={l.key} value={l.key} className="gap-1.5 px-3 py-2">
                    <l.icon className="h-3.5 w-3.5" />
                    {l.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={level}>
              <LevelGuide
                level={level}
                label={LEVELS.find((l) => l.key === level)?.label ?? level}
                rows={rows}
                tiers={tiers}
                badges={badges}
                summaryThreshold={summary?.marketplace_threshold ?? 25}
              />

              {loadingBoard ? (
                <SkeletonList count={5} />
              ) : rows.length === 0 ? (
                <Card className="p-10 text-center text-ocean-text-secondary">
                  No scoreboard data for this level yet.
                </Card>
              ) : (
                <>
                  {/* podium */}
                  <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    {podium.map((row, i) => {
                      const label = isGroup(row) ? row.label : row.display_name;
                      const sub = isGroup(row)
                        ? `${row.members} members · ${row.verified_contributions} verified`
                        : `${row.village_name || row.state || ""} · ${row.verified_contributions} verified`;
                      const score = isGroup(row) ? row.total_score : row.total_score;
                      const offset = ["sm:mt-0", "sm:mt-6", "sm:mt-10"][i];
                      return (
                        <div
                          key={row.rank + label}
                          className={`animate-scale-in ${offset} ${i === 0 ? "sm:order-2" : i === 1 ? "sm:order-1" : "sm:order-3"}`}
                          style={{ animationDelay: `${i * 90}ms` }}
                        >
                          <Card className="hover-lift h-full border-0 bg-gradient-to-b from-white to-ocean-light/60 p-5 text-center shadow-ocean">
                            <div className="mb-3 flex justify-center">
                              <RankMark rank={row.rank} />
                            </div>
                            <p className="truncate font-bold text-ocean-navy">
                              {isGroup(row) ? (
                                label
                              ) : (
                                <Link
                                  href={`/recognition/contributors/${row.slug}`}
                                  className="hover:text-ocean-blue hover:underline underline-offset-2 transition-colors"
                                >
                                  {label}
                                </Link>
                              )}
                            </p>
                            <p className="mb-3 truncate text-xs text-ocean-text-secondary">{sub}</p>
                            <p className="text-2xl font-extrabold text-ocean-blue">
                              <AnimatedNumber value={score} />
                            </p>
                            <p className="text-[11px] uppercase tracking-wide text-ocean-text-secondary">points</p>
                            {!isGroup(row) && (
                              <div className="mt-3 flex justify-center">
                                <TierChip tier={row.tier} label={row.tier_display} color={tiers.find((t) => t.key === row.tier)?.color} />
                              </div>
                            )}
                            {isGroup(row) && (
                              <p className="mt-3 text-xs font-semibold text-emerald-600">
                                ₹{fmt(row.earnings_inr)} earned · {row.marketplace_eligible_members} eligible
                              </p>
                            )}
                          </Card>
                        </div>
                      );
                    })}
                  </div>

                  {/* rest of the board */}
                  <div className="space-y-2.5">
                    {rest.map((row, i) => (
                      <Card
                        key={`${row.rank}-${isGroup(row) ? row.scope_key : row.user_name}`}
                        className="hover-lift animate-fade-in-up border-ocean-light bg-white/90"
                        style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                      >
                        <CardContent className="flex items-center gap-4 px-4 py-3">
                          <RankMark rank={row.rank} />
                          <div className="min-w-0 flex-1">
                            {isGroup(row) ? (
                              <>
                                <p className="truncate font-semibold text-ocean-navy">
                                  {row.label}
                                  {row.state && row.level !== "state" ? (
                                    <span className="ml-1.5 text-xs font-normal text-ocean-text-secondary">· {row.state}</span>
                                  ) : null}
                                </p>
                                <p className="truncate text-xs text-ocean-text-secondary">
                                  {row.members} members · {row.verified_contributions} verified · avg {row.avg_score} pts
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="truncate font-semibold text-ocean-navy">
                                  <Link
                                    href={`/recognition/contributors/${row.slug}`}
                                    className="hover:text-ocean-blue hover:underline underline-offset-2 transition-colors"
                                  >
                                    {row.display_name}
                                  </Link>
                                  <span className="ml-2 text-xs font-normal text-ocean-text-secondary">
                                    {row.village_name || row.state}
                                  </span>
                                </p>
                                <p className="truncate text-xs text-ocean-text-secondary">
                                  {row.occupation ? `${row.occupation} · ` : ""}
                                  {row.verified_contributions} verified
                                  {row.data_items_sold > 0 ? ` · ${row.data_items_sold} items sold` : ""}
                                </p>
                              </>
                            )}
                          </div>

                          {!isGroup(row) && (
                            <div className="hidden sm:block">
                              <TierChip
                                tier={row.tier}
                                label={row.tier_display}
                                color={tiers.find((t) => t.key === row.tier)?.color}
                              />
                            </div>
                          )}

                          <div className="hidden text-right md:block">
                            <p className="text-sm font-semibold text-ocean-navy">₹{fmt(isGroup(row) ? row.earnings_inr : row.earnings_inr)}</p>
                            <p className="text-[11px] text-ocean-text-secondary">earnings</p>
                          </div>

                          <MovementArrow delta={row.rank_movement} />

                          <div className="w-20 text-right">
                            <p className="text-lg font-extrabold text-ocean-blue">{fmt(row.total_score)}</p>
                            <p className="text-[11px] uppercase tracking-wide text-ocean-text-secondary">pts</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* ---------------- tier ladder ---------------- */}
        <section className="bg-white/60 py-12">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <SectionHeader title="Tier ladder" subtitle="Ranks unlocked by verified contributions" />
            {loadingPublic ? (
              <SkeletonList count={2} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {tiers.map((t, i) => {
                  const reached = myScore ? tiers.findIndex((x) => x.key === myScore.tier) >= i : false;
                  return (
                    <div
                      key={t.key}
                      className={`animate-fade-in-up rounded-xl border p-4 transition-all ${
                        reached ? "border-ocean-blue/40 bg-white shadow-ocean" : "border-ocean-light bg-ocean-light/40"
                      } hover-lift`}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-2xl">{t.icon}</span>
                        <span className="text-[11px] font-semibold" style={{ color: t.color }}>
                          {t.min_verified}+
                        </span>
                      </div>
                      <p className="font-bold text-ocean-navy">{t.name}</p>
                      <p className="mt-1 text-xs text-ocean-text-secondary">{t.unlocks}</p>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ocean-light">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: reached ? "100%" : "0%",
                            background: t.color,
                            transition: "width 700ms ease-out",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ---------------- badges + awards ---------------- */}
        <section className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeader title="Badges" subtitle="Earned automatically from your contribution history" />
              <div className="grid gap-3 sm:grid-cols-2">
                {badges.map((b, i) => (
                  <div
                    key={b.key}
                    className="animate-fade-in-up rounded-xl border border-ocean-light bg-white p-4 hover-lift"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-xl">{b.icon}</span>
                      <p className="font-semibold text-ocean-navy">{b.name}</p>
                    </div>
                    <p className="text-xs text-ocean-text-secondary">{b.description}</p>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ocean-blue">{b.criteria}</p>
                  </div>
                ))}
                {badges.length === 0 && !loadingPublic && (
                  <p className="text-sm text-ocean-text-secondary">No badges defined yet.</p>
                )}
              </div>
            </div>

            <div>
              <SectionHeader title="Awards" subtitle="Recognition issued on the public leaderboard" />
              <div className="space-y-3">
                {awards.map((a, i) => (
                  <Card
                    key={a.id}
                    className="hover-lift animate-fade-in-up border-ocean-light bg-white"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        {a.rank === 1 ? <Trophy className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ocean-navy">{a.title}</p>
                        <p className="line-clamp-2 text-xs text-ocean-text-secondary">{a.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <Badge variant="secondary" className="bg-ocean-light text-ocean-navy">{a.category_display}</Badge>
                          <span className="text-ocean-text-secondary">{a.village_name || a.user_name}</span>
                          <span className="font-semibold text-ocean-blue">{fmt(a.score)} pts</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {awards.length === 0 && !loadingPublic && (
                  <p className="text-sm text-ocean-text-secondary">No awards issued yet.</p>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-ocean-blue/30 bg-ocean-blue/5 p-4 text-sm text-ocean-text-secondary">
                <Target className="mb-1 h-4 w-4 text-ocean-blue" />
                Top 3 contributors in every state receive a yearly award, plus one for clearing the 25-item marketplace gate.
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- state strip ---------------- */}
        {summary?.states && summary.states.length > 0 && (
          <section className="bg-ocean-navy py-12 text-white">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-6 flex items-center gap-2">
                <Waves className="h-5 w-5 text-cyan-300" />
                <h2 className="text-xl font-bold">State standings</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {summary.states.map((s, i) => (
                  <div
                    key={s.state}
                    className="animate-fade-in-up rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover-lift"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-cyan-100">{s.state}</p>
                      <span className="text-lg">{["🥇", "🥈", "🥉", ""][i] || <Minus className="h-4 w-4 text-white/40" />}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-white">
                      <AnimatedNumber value={s.points} />
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-cyan-100/70">score points</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-cyan-100/80">
                      <span>{s.members} contributors</span>
                      <span className="font-semibold text-emerald-300">₹{fmt(s.earnings)}</span>
                    </div>
                  </div>
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
