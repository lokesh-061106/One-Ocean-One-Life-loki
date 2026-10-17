"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  Users,
  MapPin,
  Building2,
  Globe2,
  Waves,
  Star,
  BadgeCheck,
  IndianRupee,
  ShieldCheck,
  Award,
  Calculator,
  ListChecks,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonList } from "@/components/ui/ocean-components";
import { fetchCms } from "@/lib/api-helpers";

interface TierInfo {
  key: string;
  name: string;
  min_verified: number;
  min_points: number;
  color: string;
  icon: string;
  unlocks: string;
  order: number;
}

interface BadgeInfo {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
}

interface AwardRow {
  id: string;
  category: string;
  category_display: string;
  year: number;
  title: string;
  description: string;
  score: number;
  rank: number | null;
  village_name: string | null;
  zone_name: string | null;
}

interface ContributionRow {
  id: string;
  type: string;
  type_display: string;
  catalogue_id: string | null;
  title: string;
  base_points: number;
  q_quality: number;
  v_verification: number;
  i_impact: number;
  final_score_points: number;
  verified_at: string | null;
  created_at: string;
}

interface ContributorDetail {
  user: string;
  slug: string;
  user_name: string;
  display_name: string;
  occupation: string | null;
  village_name: string | null;
  district_name: string | null;
  state: string;
  region_name: string | null;
  global_rank: number;
  state_rank: number | null;
  state_members: number | null;
  total_score: number;
  profile_score: number;
  verified_contributions: number;
  total_contributions: number;
  quality_average: number;
  data_items_sold: number;
  gross_sales_inr: number;
  earnings_inr: number;
  marketplace_eligible: boolean;
  agency_referrals: number;
  tier: string;
  tier_display: string;
  tier_info: TierInfo | null;
  next_tier: TierInfo | null;
  next_tier_progress: number;
  marketplace_threshold: number;
  marketplace_progress: number;
  badges: string[];
  badge_info: BadgeInfo[];
  awards: AwardRow[];
  contributions: ContributionRow[];
  contributions_shown: number;
  formula: string;
  last_calculated: string | null;
}

const MULTIPLIERS = [
  { key: "B", name: "Base points", color: "#087EA4", rows: ["Set by the contribution catalogue for each type"] },
  { key: "Q", name: "Quality", color: "#8B5CF6", rows: ["0.50 Low", "1.00 Standard", "1.20 Good", "1.50 High"] },
  { key: "V", name: "Verification", color: "#10B981", rows: ["0.50 Unverified", "1.00 Community", "1.50 Expert", "2.00 High-value"] },
  { key: "I", name: "Impact", color: "#F59E0B", rows: ["1.00 Normal", "1.50 Important", "2.00 Very high"] },
];

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
}

function Progress({ value, color = "#087EA4" }: { value: number; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(0, Math.min(100, value))), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ocean-light">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
      />
    </div>
  );
}

function RankTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-ocean-light bg-white p-4 text-center">
      <div className="mb-1.5 flex justify-center text-ocean-blue">{icon}</div>
      <p className="text-2xl font-extrabold text-ocean-navy">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-ocean-text-secondary">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ocean-text-secondary/70">{sub}</p>}
    </div>
  );
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}

export default function ContributorRecognitionPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<ContributorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const slug = params?.slug;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchCms<ContributorDetail>(`/recognition/contributors/${slug}/`).then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-20">
          <SkeletonList count={4} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="mb-3 text-2xl font-bold text-ocean-navy">Contributor Not Found</h1>
          <p className="mb-4 text-ocean-text-secondary">
            This contributor does not have a scoreboard record yet.
          </p>
          <Link href="/recognition" className="text-ocean-blue hover:underline">
            Back to the scoreboard
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const tier = data.tier_info;
  const next = data.next_tier;
  const heldKeys = new Set(data.badges || []);
  const heldBadges = (data.badge_info || []).filter((b) => heldKeys.has(b.key));
  const earnedPoints = (data.contributions || []).reduce((s, c) => s + (c.final_score_points || 0), 0);
  const listComplete = earnedPoints + 0.5 >= (data.total_score || 0);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />

      <main>
        <PageHero bare className="pb-28 pt-14">
          <div className="relative mx-auto max-w-6xl px-4">
            <Link
              href="/recognition"
              className="mb-8 inline-flex items-center gap-2 text-cyan-100 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to scoreboard
            </Link>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <Badge className="mb-3 border-white/30 bg-white/15 text-white">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Contributor recognition
                </Badge>
                <h1 className="mb-3 break-words text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  {data.display_name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-cyan-100/90">
                  {data.occupation && <span>{data.occupation}</span>}
                  {data.village_name && <MetaItem icon={<MapPin className="h-3.5 w-3.5" />}>{data.village_name}</MetaItem>}
                  {data.district_name && <MetaItem icon={<Building2 className="h-3.5 w-3.5" />}>{data.district_name}</MetaItem>}
                  {data.state && <MetaItem icon={<Globe2 className="h-3.5 w-3.5" />}>{data.state}</MetaItem>}
                  {data.region_name && <MetaItem icon={<Waves className="h-3.5 w-3.5" />}>{data.region_name}</MetaItem>}
                </div>
              </div>

              <div className="shrink-0 md:text-right">
                <p className="text-4xl font-extrabold text-white md:text-5xl">{fmt(data.total_score)}</p>
                <p className="text-[11px] uppercase tracking-widest text-cyan-100/80">score points</p>
                {tier && (
                  <span
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: `${tier.color}33`, color: "#fff" }}
                  >
                    {tier.icon} {tier.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </PageHero>

        <div className="relative z-10 mx-auto -mt-14 max-w-6xl space-y-6 px-4 pb-16">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <RankTile icon={<Trophy className="h-5 w-5" />} label="Global rank" value={`#${fmt(data.global_rank)}`} sub="across all contributors" />
            <RankTile
              icon={<Users className="h-5 w-5" />}
              label={`${data.state || "State"} rank`}
              value={data.state_rank ? `#${fmt(data.state_rank)}` : "—"}
              sub={data.state_members ? `of ${fmt(data.state_members)} in state` : undefined}
            />
            <RankTile
              icon={<BadgeCheck className="h-5 w-5" />}
              label="Verified"
              value={`${fmt(data.verified_contributions)}`}
              sub={`of ${fmt(data.total_contributions)} contributions`}
            />
            <RankTile icon={<Star className="h-5 w-5" />} label="Quality avg (Q)" value={(data.quality_average || 0).toFixed(2)} sub="0.50 – 1.50" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-ocean-blue" />
                    How this recognition was earned
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {tier ? (
                    <div className="rounded-xl border-2 p-4" style={{ borderColor: `${tier.color}55`, backgroundColor: `${tier.color}0d` }}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-2xl leading-none">{tier.icon}</span>
                        <p className="text-lg font-bold text-ocean-navy">{tier.name} tier</p>
                        <span className="ml-auto text-xs font-semibold" style={{ color: tier.color }}>
                          {fmt(data.verified_contributions)} / {tier.min_verified}+ verified
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ocean-text-secondary">Unlocked: {tier.unlocks}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-ocean-light/60 p-4 text-sm text-ocean-text-secondary">
                      New Explorer — no tier threshold crossed yet. Every verified contribution moves this
                      contributor toward the first tier.
                    </div>
                  )}

                  {next ? (
                    <div>
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5 text-xs font-medium text-ocean-text-secondary">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{next.icon}</span>
                          Next: <b className="text-ocean-navy">{next.name}</b> at {next.min_verified} verified
                        </span>
                        <span className="font-semibold text-ocean-navy">{data.next_tier_progress}%</span>
                      </div>
                      <Progress value={data.next_tier_progress} color={next.color} />
                      <p className="mt-1.5 text-[11px] text-ocean-text-secondary">{next.unlocks}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-ocean-blue/5 p-3 text-sm text-ocean-text-secondary">
                      <b className="text-ocean-navy">Top tier reached.</b> Ocean Guardian is the highest tier on
                      the platform and carries annual award eligibility.
                    </div>
                  )}

                  <div className="rounded-xl border border-ocean-light p-4">
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5 text-xs font-medium text-ocean-text-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Marketplace gate · {data.marketplace_threshold} verified
                      </span>
                      <span className="font-semibold text-ocean-navy">{data.marketplace_progress}%</span>
                    </div>
                    <Progress value={data.marketplace_progress} color="#10B981" />
                    <p className="mt-2 text-[11px] text-ocean-text-secondary">
                      {data.marketplace_eligible
                        ? "Eligible — this contributor can list and sell verified data on the marketplace."
                        : `${fmt(Math.max(0, data.marketplace_threshold - data.verified_contributions))} more verified contributions needed to unlock the marketplace.`}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ocean-navy">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Badges held
                    </p>
                    {heldBadges.length > 0 ? (
                      <ul className="space-y-2">
                        {heldBadges.map((b) => (
                          <li key={b.key} className="flex gap-2.5 rounded-lg border border-ocean-light bg-white p-3">
                            <span className="text-xl leading-none">{b.icon}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ocean-navy">{b.name}</p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-ocean-text-secondary">{b.criteria}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-lg bg-ocean-light/50 p-3 text-xs text-ocean-text-secondary">
                        No badges yet. Badges are granted automatically once their criteria are met — the first
                        is <b className="text-ocean-navy">Community Contributor</b> at 10 verified contributions.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-ocean-blue" />
                    Verified contribution records
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.contributions || []).length > 0 ? (
                    <>
                      <p className="text-xs text-ocean-text-secondary">
                        Each verified record scores <b className="text-ocean-navy">B × Q × V × I</b>. Sorted by points
                        contributed — {listComplete
                          ? 'these are the verified entries that produced the total.'
                          : 'below is the imported sample of their records, and their full verified history makes up the lifetime total.'}
                      </p>
                      <div className="space-y-2">
                        {data.contributions.map((c) => (
                          <div key={c.id} className="rounded-lg border border-ocean-light bg-white p-3">
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-semibold leading-snug text-ocean-navy">
                                  {c.title || c.type_display}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                  <Badge variant="secondary" className="bg-ocean-light text-ocean-navy">
                                    {c.type_display}
                                  </Badge>
                                  {c.verified_at && (
                                    <span className="text-ocean-text-secondary">
                                      verified {new Date(c.verified_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-lg font-extrabold leading-none text-ocean-blue">
                                  +{fmt(c.final_score_points)}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-wide text-ocean-text-secondary">points</p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="rounded bg-ocean-blue/10 px-1.5 py-0.5 font-semibold text-ocean-blue">
                                B {c.base_points}
                              </span>
                              <span className="text-ocean-text-secondary/50">×</span>
                              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 font-semibold text-violet-600">
                                Q {c.q_quality}
                              </span>
                              <span className="text-ocean-text-secondary/50">×</span>
                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-600">
                                V {c.v_verification}
                              </span>
                              <span className="text-ocean-text-secondary/50">×</span>
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-semibold text-amber-600">
                                I {c.i_impact}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ocean-light/60 px-3 py-2 text-xs">
                        <span className="text-ocean-text-secondary">
                          {listComplete
                            ? 'All verified records listed'
                            : `${data.contributions_shown} of ${fmt(data.verified_contributions)} verified records listed`}
                        </span>
                        <span className="font-bold text-ocean-navy">
                          {listComplete
                            ? `${fmt(data.total_score)} lifetime total`
                            : `${fmt(earnedPoints)} pts from listed records · ${fmt(data.total_score)} lifetime total`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-ocean-border p-6 text-center">
                      <p className="text-sm font-medium text-ocean-navy">No individual records to list</p>
                      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ocean-text-secondary">
                        This contributor&apos;s verified total was imported from the community workbook rather than
                        submitted entry by entry, so the per-record B × Q × V × I breakdown is not available. Their
                        verified count and points still count in full on every scoreboard.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-ocean-blue/25 bg-gradient-to-br from-white to-ocean-blue/5 p-4">
                    <p className="mb-3 font-bold text-ocean-navy">{data.formula}</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {MULTIPLIERS.map((m) => (
                        <div key={m.key} className="rounded-lg bg-white/80 p-2.5 ring-1 ring-ocean-light">
                          <div className="mb-1 flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold" style={{ color: m.color }}>{m.key}</span>
                            <span className="text-[11px] font-semibold text-ocean-navy">{m.name}</span>
                          </div>
                          <ul className="space-y-0.5">
                            {m.rows.map((r) => (
                              <li key={r} className="text-[10px] leading-tight text-ocean-text-secondary">{r}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 rounded-lg bg-ocean-light/60 px-3 py-2 text-[11px] text-ocean-text-secondary">
                      R (relevance) is a publication gate only — it decides whether an entry is published or sent to
                      review, and is never multiplied into the score.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-emerald-600" />
                    Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    { label: "Contributor earnings", value: `₹${fmt(data.earnings_inr)}`, hint: "after platform fee" },
                    { label: "Gross sales", value: `₹${fmt(data.gross_sales_inr)}` },
                    { label: "Data items sold", value: fmt(data.data_items_sold) },
                    { label: "Agency referrals", value: fmt(data.agency_referrals), hint: "CT09 surveillance" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-ocean-text-secondary">
                        {row.label}
                        {row.hint && <span className="ml-1 text-[11px] text-ocean-text-secondary/70">({row.hint})</span>}
                      </span>
                      <b className="shrink-0 text-ocean-navy">{row.value}</b>
                    </div>
                  ))}
                  <p className="rounded-lg bg-ocean-light/60 p-2.5 text-[11px] text-ocean-text-secondary">
                    Points and earnings are tracked separately. A contributor can rank highly on points alone, and
                    earn separately once past the marketplace gate.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Awards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.awards || []).length > 0 ? (
                    data.awards.map((a) => (
                      <div key={a.id} className="rounded-lg border border-ocean-light bg-white p-3">
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            {a.rank === 1 ? <Trophy className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold leading-snug text-ocean-navy">{a.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-ocean-text-secondary">{a.description}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <Badge variant="secondary" className="bg-ocean-light text-ocean-navy">
                                {a.category_display}
                              </Badge>
                              <span className="text-ocean-text-secondary">{a.year}</span>
                              <span className="font-semibold text-ocean-blue">{fmt(a.score)} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg bg-ocean-light/50 p-3 text-xs text-ocean-text-secondary">
                      No awards issued yet. The top 3 contributors in every state receive a yearly award, plus one
                      for clearing the marketplace gate.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-ocean-blue/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-ocean-blue" />
                    How to climb further
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-ocean-text-secondary">
                  <p>
                    <b className="text-ocean-navy">1. Verify more entries.</b> Only verified contributions add points,
                    and tier thresholds are counted in verified contributions.
                  </p>
                  <p>
                    <b className="text-ocean-navy">2. Raise quality.</b> A High (1.5×) entry is worth three times a
                    Low (0.5×) one — sharp evidence and precise detail move Q.
                  </p>
                  <p>
                    <b className="text-ocean-navy">3. Seek expert verification.</b> Expert (1.5×) and high-value
                    (2.0×) verification multiply far above community verification.
                  </p>
                  <p>
                    <b className="text-ocean-navy">4. Clear the marketplace gate.</b> Past {data.marketplace_threshold} verified,
                    sales add ₹ earnings and the Trusted Data Seller badge.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
