"use client";

import type {
  ContributorAggregateRow,
  ContributorLevel,
  ContributorTotals,
} from "@/hooks/use-contributor-map";

export const CONTRIBUTION_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "ocean_sound", label: "Ocean sound" },
  { value: "marine_sighting", label: "Marine sighting" },
  { value: "fish_catch", label: "Fish catch" },
  { value: "education_post", label: "Education post" },
  { value: "event", label: "Event" },
  { value: "beach_cleanup", label: "Beach cleanup" },
  { value: "local_knowledge", label: "Local knowledge" },
  { value: "observation", label: "Observation" },
];

const LEVELS: { value: ContributorLevel; label: string }[] = [
  { value: "state", label: "State" },
  { value: "zone", label: "Zone" },
  { value: "district", label: "District" },
  { value: "village", label: "Village" },
];

const LEVEL_COLOR: Record<ContributorLevel, string> = {
  state: "#0EA5E9",
  zone: "#6366F1",
  district: "#F59E0B",
  village: "#10B981",
};

export interface BreadcrumbItem {
  label: string;
  index: number;
}

interface ContributorPanelProps {
  level: ContributorLevel;
  rows: ContributorAggregateRow[];
  totals: ContributorTotals;
  loading: boolean;
  selectedId: string | null;
  breadcrumb: BreadcrumbItem[];
  type: string;
  isCoastal: boolean;
  onTypeChange: (value: string) => void;
  onCoastalChange: (value: boolean) => void;
  onSelectRow: (row: ContributorAggregateRow) => void;
  onDrillRow: (row: ContributorAggregateRow) => void;
  onBreadcrumbClick: (index: number) => void;
}

export default function ContributorPanel({
  level,
  rows,
  totals,
  loading,
  selectedId,
  breadcrumb,
  type,
  isCoastal,
  onTypeChange,
  onCoastalChange,
  onSelectRow,
  onDrillRow,
  onBreadcrumbClick,
}: ContributorPanelProps) {
  const maxContributions = Math.max(1, ...rows.map((r) => r.contributions));

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="text-ocean-navy font-bold text-sm">Contribution by location</div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Public &amp; verified contributions grouped by area. Click a bubble to drill down.
        </p>
      </div>

      {/* breadcrumb */}
      <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap items-center gap-1 text-[11px]">
        {breadcrumb.map((item, i) => (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-300">/</span>}
            <button
              onClick={() => onBreadcrumbClick(item.index)}
              className={`px-1.5 py-0.5 rounded hover:bg-ocean-blue/10 ${
                i === breadcrumb.length - 1 ? "font-bold text-ocean-navy" : "text-ocean-blue"
              }`}
            >
              {item.label}
            </button>
          </span>
        ))}
        <span className="ml-auto text-slate-400">{LEVELS.find((l) => l.value === level)?.label}</span>
      </div>

      {/* filters */}
      <div className="px-3 py-2 border-b border-slate-100 space-y-2">
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ocean-blue/40"
        >
          {CONTRIBUTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isCoastal}
            onChange={(e) => onCoastalChange(e.target.checked)}
            className="accent-ocean-blue"
          />
          Coastal villages only
        </label>
      </div>

      {/* totals */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100 text-center">
        <Stat label="Contributions" value={totals.contributions} />
        <Stat label="Verified" value={totals.verified} />
        <Stat label="Points" value={totals.points} />
        <Stat label="Contributors" value={totals.contributors} />
      </div>

      {/* ranked list */}
      <div className="px-2 py-2 overflow-y-auto flex-1 space-y-1 max-h-[520px]">
        {loading && <p className="text-xs text-slate-400 text-center py-4">Loading areas…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">No contributions in this scope.</p>
        )}
        {rows.map((row) => {
          const on = selectedId === (row.id ?? row.name);
          const pct = Math.round((row.contributions / maxContributions) * 100);
          return (
            <button
              key={row.id ?? row.name}
              onClick={() => onSelectRow(row)}
              onDoubleClick={() => level !== "village" && onDrillRow(row)}
              className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                on ? "bg-ocean-light/80 ring-1 ring-ocean-blue/30" : "hover:bg-slate-50"
              }`}
              title={level !== "village" ? "Click to select · double-click to drill down" : "Click to select"}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: LEVEL_COLOR[row.level] }}
                  />
                  <span className="text-xs font-semibold text-ocean-navy truncate">{row.name}</span>
                </span>
                <span className="text-[11px] font-bold text-ocean-blue shrink-0">{row.contributions}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: LEVEL_COLOR[row.level] }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {row.contributors} contrib.
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white py-2">
      <div className="text-sm font-bold text-ocean-navy">{value.toLocaleString("en-IN")}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

export { LEVELS };
