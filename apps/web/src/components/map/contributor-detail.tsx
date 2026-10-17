"use client";

import { Users } from "lucide-react";
import type {
  ContributorAggregateRow,
  ContributorLevel,
  ContributorPerson,
  ContributorTotals,
} from "@/hooks/use-contributor-map";

const LEVEL_LABEL: Record<ContributorLevel, string> = {
  state: "State",
  zone: "Zone",
  district: "Coastal district",
  village: "Village / town",
};

interface ContributorDetailProps {
  level: ContributorLevel;
  selected: ContributorAggregateRow | null;
  totals: ContributorTotals;
  people: ContributorPerson[];
  className?: string;
}

export default function ContributorDetail({
  level,
  selected,
  totals,
  people,
  className,
}: ContributorDetailProps) {
  const areaName = selected?.name ?? null;

  const inArea = (p: ContributorPerson) => {
    if (!areaName) return true;
    const name = areaName.toLowerCase();
    if (p.state && p.state.toLowerCase() === name) return true;
    if (p.district && p.district.toLowerCase() === name) return true;
    if (p.village && p.village.toLowerCase() === name) return true;
    return false;
  };

  const contributors = people
    .filter(inArea)
    .sort((a, b) => b.verified_contributions - a.verified_contributions)
    .slice(0, 8);

  const stats = selected
    ? {
        contributions: selected.contributions,
        verified: selected.verified,
        points: selected.points,
        contributors: selected.contributors,
      }
    : totals;

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden ${className ?? ""}`}>
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {selected ? LEVEL_LABEL[level] : "Overall"}
        </div>
        <div className="text-ocean-navy font-bold text-sm truncate">
          {selected?.name ?? "All coastal areas"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100 text-center">
        <Metric label="Contributions" value={stats.contributions} />
        <Metric label="Verified" value={stats.verified} />
        <Metric label="Points" value={stats.points} />
        <Metric label="Contributors" value={stats.contributors} />
      </div>

      <div className="px-4 py-3 flex items-center gap-2 text-ocean-navy font-bold text-xs border-b border-slate-100">
        <Users className="h-3.5 w-3.5" />
        Opted-in contributors
        <span className="ml-auto text-[10px] font-semibold text-slate-400">{contributors.length}</span>
      </div>

      <div className="overflow-y-auto flex-1 px-2 py-2 space-y-1 max-h-[420px]">
        {contributors.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            No opted-in contributors in this area yet.
          </p>
        )}
        {contributors.map((p) => (
          <div key={p.user} className="px-2 py-1.5 rounded-md hover:bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ocean-navy truncate">{p.name}</span>
              {p.tier && p.tier !== "new" && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-ocean-blue/10 text-ocean-blue shrink-0">
                  {p.tier}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {[p.village, p.district, p.state].filter(Boolean).join(" · ") || "Location private"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {p.verified_contributions} verified · {p.total_score} pts
              {!p.earnings_hidden && p.earnings_inr != null ? ` · ₹${p.earnings_inr}` : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
        Exact contribution markers appear only for contributors who opted in to the public map.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white py-2">
      <div className="text-sm font-bold text-ocean-navy">{value.toLocaleString("en-IN")}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
