"use client";

import Link from "next/link";
import { Clock, Users, MapPin, Anchor, Sparkles, Phone, ShieldCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EcoBadge, MODEL_META, formatINR, priceOf, typeMeta } from "./shared";
import type { EcoPackage, TourismOpportunity } from "@/types";

/* ------------------------------------------------------------------ */
/* Experience card                                                     */
/* ------------------------------------------------------------------ */

export function ExperienceCard({
  item,
  index = 0,
  className,
}: {
  item: TourismOpportunity;
  index?: number;
  className?: string;
}) {
  const meta = MODEL_META[item.model_category] || MODEL_META.fisher_coastal;
  const t = typeMeta(item.opportunity_type);
  const img = item.image || (item.images && item.images[0]) || t.fallbackImg || meta.coverImage;

  return (
    <Link
      href={`/ecotourism/${item.slug || item.id}`}
      className={cn(
        "group block reveal visible rounded-2xl border border-slate-200/90 bg-white shadow-sm",
        "transition-all duration-300 hover:-translate-y-1.5 hover:border-ocean-blue hover:shadow-ocean-lg sheen overflow-hidden",
        className
      )}
      style={{ transitionDelay: `${Math.min(index, 7) * 70}ms` }}
    >
      {/* Visual header */}
      <div className={cn("relative h-48 overflow-hidden bg-gradient-to-br", meta.gradient)}>
        {img ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/25" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-90 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              {t.icon}
            </span>
            <span className="absolute -bottom-6 -right-4 text-[110px] leading-none opacity-10 select-none">
              {meta.icon}
            </span>
          </div>
        )}

        {/* Category chip */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          Model {meta.number}: {meta.icon} {meta.short}
        </span>

        {/* Verification Pill */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
          ✓ Verified Host
        </span>

        {/* State pill if available */}
        {item.state && (
          <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            📍 {item.state}
          </span>
        )}

        {/* Price flag */}
        <span className="absolute bottom-2.5 right-3 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-ocean-navy shadow-md transition-transform duration-300 group-hover:-translate-y-1">
          {priceOf(item)}
          <span className="text-[10px] font-medium text-ocean-text-secondary">
            {item.price_unit === "person" ? "/person" : item.price_unit === "boat" ? "/boat" : item.price_unit === "night" ? "/night" : item.price_unit === "student" ? "/student" : "/group"}
          </span>
        </span>

        {item.blocked_reason && (
          <span className="absolute right-3 top-10 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-bold text-white">
            ⛔ Ban window
          </span>
        )}
      </div>

      <div className="p-5 pt-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-bold text-ocean-navy transition-colors group-hover:text-ocean-blue">
            {item.name}
          </h3>
          {!!item.rating && (
            <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
              ★ {Number(item.rating).toFixed(1)}
            </span>
          )}
        </div>

        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-ocean-blue">
          {t.icon} {t.label}
        </p>

        {item.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-ocean-text-secondary">
            {item.description}
          </p>
        )}

        {/* Key Location and Host Verification Row */}
        <div className="mb-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs space-y-1">
          <div className="flex items-center justify-between text-ocean-navy">
            <span className="inline-flex items-center gap-1 truncate font-semibold">
              <Anchor className="h-3.5 w-3.5 text-ocean-blue shrink-0" />
              <span className="truncate">{item.family_name || "Coastal Fisher Family Society"}</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
              Govt Reg.
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-ocean-text-secondary">
            {(item.village_name || item.district_name) && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 text-ocean-green shrink-0" />
                {[item.village_name, item.district_name].filter(Boolean).join(", ")}
              </span>
            )}
            {item.contact_phone && (
              <span className="inline-flex items-center gap-1 font-semibold text-ocean-blue">
                <Phone className="h-3 w-3 shrink-0" />
                {item.contact_phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ocean-text-secondary">
          {item.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {item.duration}
            </span>
          )}
          {item.max_participants && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              ≤{item.max_participants}
            </span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3 w-3" /> 100% Escrow
          </span>
          {item.is_sustainable && <EcoBadge tone="green">♻️ Sustainable</EcoBadge>}
          {item.lean_season_friendly !== false && !item.is_offshore && (
            <EcoBadge tone="amber">🌱 Lean-season</EcoBadge>
          )}
          {item.is_offshore && (
            <EcoBadge tone="blue">🚤 Boat / Sea</EcoBadge>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Package card                                                        */
/* ------------------------------------------------------------------ */

export function PackageCard({ pkg, index = 0 }: { pkg: EcoPackage; index?: number }) {
  const meta = MODEL_META[pkg.model_category] || MODEL_META.homestay_food;
  const price = typeof pkg.price === "string" ? parseFloat(pkg.price) : pkg.price;
  const original = pkg.original_price
    ? typeof pkg.original_price === "string"
      ? parseFloat(pkg.original_price)
      : pkg.original_price
    : null;
  const off = original && original > price ? Math.round(((original - price) / original) * 100) : null;
  const pkgImg = pkg.image || meta.coverImage;

  return (
    <Link
      href={`/ecotourism/packages/${pkg.id}`}
      className={cn(
        "group relative block reveal visible overflow-hidden rounded-2xl border-2 border-emerald-300/60 bg-white",
        "shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500 hover:shadow-ocean-lg sheen"
      )}
      style={{ transitionDelay: `${Math.min(index, 5) * 80}ms` }}
    >
      {off && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-ocean-coral px-2.5 py-1 text-[11px] font-bold text-white shadow">
          {off}% OFF
        </span>
      )}

      <div className={cn("relative h-44 overflow-hidden bg-gradient-to-br", meta.gradient)}>
        {pkgImg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pkgImg}
              alt={pkg.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <span className="text-6xl animate-bob">🛶</span>
            <span className="text-6xl opacity-80">🏠</span>
            <span className="text-6xl animate-wave">🌅</span>
          </div>
        )}
        <span className="absolute bottom-3 left-3 text-xs font-bold text-white">
          {meta.icon} {meta.short} · {pkg.duration_text}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-ocean-green" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-ocean-green">
            O3L Package
          </span>
        </div>

        <h3 className="mb-2 line-clamp-2 font-semibold text-ocean-navy transition-colors group-hover:text-ocean-blue">
          {pkg.title}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-ocean-text-secondary">{pkg.description}</p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {(pkg.inclusions || []).slice(0, 4).map((inc) => (
            <span
              key={inc}
              className="rounded-md bg-ocean-light px-2 py-0.5 text-[11px] font-medium text-ocean-deep"
            >
              ✓ {inc}
            </span>
          ))}
          {(pkg.inclusions || []).length > 4 && (
            <span className="rounded-md bg-ocean-light px-2 py-0.5 text-[11px] font-medium text-ocean-deep">
              +{(pkg.inclusions || []).length - 4} more
            </span>
          )}
        </div>

        <div className="flex items-end justify-between border-t border-ocean-border pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-ocean-navy">{formatINR(price)}</span>
              {original && <span className="text-sm text-ocean-muted line-through">{formatINR(original)}</span>}
            </div>
            <span className="text-[11px] text-ocean-text-secondary">per person</span>
          </div>
          <div className="text-right text-[11px] text-ocean-text-secondary">
            {pkg.family_count !== undefined && (
              <div className="font-semibold text-ocean-coral">👨‍👩‍👧 {pkg.family_count} families share</div>
            )}
            {!!pkg.rating && <div>★ {Number(pkg.rating).toFixed(1)}</div>}
          </div>
        </div>
      </div>
    </Link>
  );
}
