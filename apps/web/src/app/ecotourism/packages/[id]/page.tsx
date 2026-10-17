"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, Users, Check, Loader2, Anchor, ShieldCheck, MapPin,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { fetchCms, fetchCmsList } from "@/lib/api-helpers";
import { useRevealAll } from "@/hooks/use-reveal";
import { MODEL_META, EcoBadge, Stars, formatINR } from "@/components/eco/shared";
import { BookingWidget } from "@/components/eco/booking-widget";
import type { EcoPackage, EcoReview, SplitLine } from "@/types";

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rootRef = useRevealAll<HTMLDivElement>();

  const [pkg, setPkg] = useState<EcoPackage | null>(null);
  const [reviews, setReviews] = useState<EcoReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      setLoading(true);
      const data = await fetchCms<EcoPackage>(`/ecotourism/packages/${params.id}/`);
      setPkg(data);
      if (data) {
        const rv = await fetchCmsList<EcoReview>(`/ecotourism/reviews/?package=${data.id}`);
        setReviews(rv);
      }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-ocean-blue" />
          <p className="mt-4 text-ocean-text-secondary">Loading package…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-24 text-center">
          <Anchor className="mx-auto h-16 w-16 text-ocean-muted" />
          <h1 className="mt-4 text-2xl font-bold text-ocean-navy">Package not found</h1>
          <Button className="mt-6" onClick={() => router.push("/ecotourism")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to ecotourism
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const meta = MODEL_META[pkg.model_category] || MODEL_META.homestay_food;
  const price = typeof pkg.price === "string" ? parseFloat(pkg.price) : pkg.price;
  const original = pkg.original_price
    ? typeof pkg.original_price === "string"
      ? parseFloat(pkg.original_price)
      : pkg.original_price
    : null;
  const off = original && original > price ? Math.round(((original - price) / original) * 100) : 0;
  const splitLines: SplitLine[] = pkg.split_preview || [];
  const families = pkg.families || [];

  return (
    <div ref={rootRef} className="min-h-screen bg-ocean-foam">
      <Header />

      <main>
        <div className="border-b border-ocean-border bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 text-sm font-medium text-ocean-text-secondary hover:text-ocean-blue"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-ocean-muted">/</span>
            <Link href="/ecotourism" className="text-sm font-medium text-ocean-text-secondary hover:text-ocean-blue">
              Ecotourism
            </Link>
            <span className="text-ocean-muted">/</span>
            <span className="truncate text-sm font-semibold text-ocean-navy">{pkg.title}</span>
          </div>
        </div>

        {/* hero */}
        <PageHero bare className="py-0 sm:py-0">
          <div className="absolute -right-10 -top-10 text-[200px] leading-none opacity-10 select-none">
            {meta.icon}
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                📦 O3L Package
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                {meta.icon} {meta.short}
              </span>
              {off > 0 && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ocean-coral">
                  {off}% OFF
                </span>
              )}
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold sm:text-4xl">{pkg.title}</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/90">{pkg.description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {pkg.duration_text}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> ≤ {pkg.max_participants} people
              </span>
              {!!pkg.rating && (
                <span className="inline-flex items-center gap-1.5">
                  ★ {Number(pkg.rating).toFixed(1)} ({pkg.total_reviews || 0})
                </span>
              )}
              {pkg.village_name && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {pkg.village_name}
                </span>
              )}
            </div>
          </div>
        </PageHero>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* price + inclusions */}
              <div className="reveal visible rounded-2xl border border-ocean-border bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-end justify-between gap-4 border-b border-ocean-border pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-ocean-muted">Per person</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-ocean-navy">{formatINR(price)}</span>
                      {original && <span className="text-lg text-ocean-muted line-through">{formatINR(original)}</span>}
                    </div>
                  </div>
                  {pkg.family_count !== undefined && (
                    <div className="rounded-xl bg-ocean-coral/10 px-4 py-2.5 text-center">
                      <p className="text-lg font-extrabold text-ocean-coral">👨‍👩‍👧 {pkg.family_count}</p>
                      <p className="text-[11px] font-semibold text-ocean-coral/80">families share this payment</p>
                    </div>
                  )}
                </div>

                {!!pkg.inclusions?.length && (
                  <>
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ocean-navy">
                      <Check className="h-5 w-5 text-ocean-green" /> What&apos;s included
                    </h2>
                    <ul className="grid gap-2.5 sm:grid-cols-2">
                      {pkg.inclusions.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-sm text-ocean-text-secondary">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-ocean-green" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* itinerary */}
              {!!pkg.itinerary?.length && (
                <div className="reveal visible rounded-2xl border border-ocean-border bg-white p-6">
                  <h2 className="mb-5 text-lg font-bold text-ocean-navy">Itinerary</h2>
                  <ol className="relative space-y-6 border-l-2 border-ocean-green/30 pl-6">
                    {pkg.itinerary.map((step, i) => (
                      <li key={`${step.time}-${i}`} className="relative">
                        <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ocean-green text-[9px] text-white ring-4 ring-white">
                          ●
                        </span>
                        <p className="text-xs font-bold uppercase tracking-wider text-ocean-coral">{step.time}</p>
                        <p className="mt-0.5 font-semibold text-ocean-navy">{step.title}</p>
                        {step.detail && (
                          <p className="mt-1 text-sm text-ocean-text-secondary">{step.detail}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* families */}
              {families.length > 0 && (
                <div className="reveal visible rounded-2xl border border-ocean-border bg-white p-6">
                  <h2 className="mb-4 text-lg font-bold text-ocean-navy">The families behind this package</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {families.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 rounded-xl bg-ocean-foam p-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-blue/15 font-bold text-ocean-blue">
                          {f.name[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ocean-navy">{f.name}</p>
                          <p className="truncate text-xs text-ocean-text-secondary">
                            {[f.village_name, f.district_name].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          {!!f.rating && <p className="text-xs font-bold text-amber-500">★ {Number(f.rating).toFixed(1)}</p>}
                          {f.is_verified && <EcoBadge tone="green">✓ Verified</EcoBadge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* split preview */}
              {splitLines.length > 0 && (
                <div className="reveal visible rounded-2xl border border-ocean-green/30 bg-gradient-to-br from-emerald-50 to-white p-6">
                  <h3 className="mb-1 flex items-center gap-2 font-bold text-ocean-navy">
                    <ShieldCheck className="h-4 w-4 text-ocean-green" /> Transparent split per booking
                  </h3>
                  <p className="mb-4 text-xs text-ocean-text-secondary">
                    Every {formatINR(price)} per person flows like this:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {splitLines.map((line) => (
                      <div key={line.recipient_type} className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ocean-navy">{line.label}</span>
                          <span className="text-sm font-extrabold tabular-nums text-ocean-navy">
                            {Number(line.percentage)}%
                          </span>
                        </div>
                        <p className="mt-1 text-lg font-extrabold text-ocean-green">
                          {formatINR(Number(line.amount))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* reviews */}
              <div className="reveal visible rounded-2xl border border-ocean-border bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-ocean-navy">Traveller reviews</h3>
                  {!!pkg.rating && <Stars rating={Number(pkg.rating)} count={pkg.total_reviews} size="md" />}
                </div>
                {reviews.length ? (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="border-b border-ocean-border pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-blue/15 text-sm font-bold text-ocean-blue">
                            {(r.user_name || "T")[0]}
                          </span>
                          <p className="text-sm font-semibold text-ocean-navy">{r.user_name || "Traveller"}</p>
                          <span className="ml-auto text-amber-400">
                            {"★".repeat(r.rating)}
                            <span className="text-ocean-border">{"★".repeat(5 - r.rating)}</span>
                          </span>
                        </div>
                        {r.title && <p className="mt-2 text-sm font-semibold text-ocean-navy">{r.title}</p>}
                        {r.comment && <p className="mt-1 text-sm text-ocean-text-secondary">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ocean-text-secondary">
                    No reviews yet — book first, then share your story.
                  </p>
                )}
              </div>
            </div>

            {/* sticky booking */}
            <div>
              <div className="sticky top-24">
                <BookingWidget
                  kind="package"
                  id={pkg.id}
                  unitPrice={price}
                  priceUnit="person"
                  maxParticipants={pkg.max_participants}
                  title={pkg.title}
                />
                <div className="mt-4 rounded-2xl border border-ocean-border bg-ocean-light/60 p-5 text-xs leading-relaxed text-ocean-text-secondary">
                  <p className="mb-1.5 font-bold text-ocean-navy">🧩 One payment, many households</p>
                  Homestay, boat crew, cooks and storytellers are all paid from this single
                  booking through the visible ledger on the next screen.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
