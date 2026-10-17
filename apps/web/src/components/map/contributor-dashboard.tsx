"use client";

import { useMemo, useState } from "react";
import ContributorMap, { type ContributorBasemap } from "@/components/map/contributor-map";
import ContributorPanel, { type BreadcrumbItem } from "@/components/map/contributor-panel";
import ContributorDetail from "@/components/map/contributor-detail";
import {
  useContributorAggregates,
  useContributorPeople,
  useContributorPoints,
  type ContributorAggregateRow,
  type ContributorLevel,
} from "@/hooks/use-contributor-map";

const DEPTH_LEVELS: ContributorLevel[] = ["state", "zone", "district", "village"];

const EMPTY_TOTALS = { contributions: 0, verified: 0, points: 0, contributors: 0 };

export default function ContributorDashboard() {
  const [stack, setStack] = useState<ContributorAggregateRow[]>([]);
  const [selected, setSelected] = useState<ContributorAggregateRow | null>(null);
  const [type, setType] = useState("all");
  const [isCoastal, setIsCoastal] = useState(false);
  const [basemap, setBasemap] = useState<ContributorBasemap>("streets");

  const level = DEPTH_LEVELS[Math.min(stack.length, DEPTH_LEVELS.length - 1)];
  const parent = stack.length
    ? level === "zone"
      ? stack[0]?.name ?? null
      : level === "district"
        ? stack[1]?.slug ?? null
        : stack[2]?.slug ?? null
    : null;

  const aggQuery = useContributorAggregates({ level, parent, type, isCoastal });
  const peopleQuery = useContributorPeople();
  const pointsQuery = useContributorPoints(undefined, type);

  const rows = aggQuery.data?.rows ?? [];
  const totals = aggQuery.data?.totals ?? EMPTY_TOTALS;
  const people = peopleQuery.data?.results ?? [];
  const points = pointsQuery.data?.results ?? [];

  const selectedKey = selected ? selected.id ?? selected.name : null;

  const breadcrumb = useMemo<BreadcrumbItem[]>(
    () => [
      { label: "All states", index: 0 },
      ...stack.map((row, i) => ({ label: row.name, index: i + 1 })),
    ],
    [stack]
  );

  const selectRow = (row: ContributorAggregateRow | null) => setSelected(row);

  const drillRow = (row: ContributorAggregateRow) => {
    if (level === "village") return;
    const depth = DEPTH_LEVELS.indexOf(level);
    setStack((prev) => [...prev.slice(0, depth), row]);
    setSelected(null);
  };

  const breadcrumbClick = (index: number) => {
    setStack((prev) => prev.slice(0, index));
    setSelected(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <aside className="lg:col-span-3">
        <ContributorPanel
          level={level}
          rows={rows}
          totals={totals}
          loading={aggQuery.isLoading}
          selectedId={selectedKey}
          breadcrumb={breadcrumb}
          type={type}
          isCoastal={isCoastal}
          onTypeChange={setType}
          onCoastalChange={setIsCoastal}
          onSelectRow={selectRow}
          onDrillRow={drillRow}
          onBreadcrumbClick={breadcrumbClick}
        />
      </aside>

      <div className="lg:col-span-6 h-[440px] sm:h-[520px] lg:h-[640px] relative">
        <ContributorMap
          rows={rows}
          level={level}
          people={people}
          points={points}
          basemap={basemap}
          onBasemapChange={setBasemap}
          selectedId={selectedKey}
          onSelectRow={selectRow}
          onDrillRow={drillRow}
        />
        {aggQuery.isError && (
          <div className="absolute inset-x-0 top-0 bg-red-50 text-red-700 text-xs px-3 py-2 border-b border-red-200">
            Could not load contribution aggregates. Check that the API is running.
          </div>
        )}
        {aggQuery.data?.truncated && (
          <div className="absolute inset-x-0 bottom-0 bg-amber-50 text-amber-800 text-[11px] px-3 py-1.5 border-t border-amber-200">
            Showing a capped sample of contributions — refine with filters or zoom in.
          </div>
        )}
      </div>

      <aside className="lg:col-span-3">
        <ContributorDetail
          level={level}
          selected={selected}
          totals={totals}
          people={people}
          className="max-h-[640px]"
        />
      </aside>
    </div>
  );
}
