"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Layers, X } from "lucide-react";
import LayerPanel from "@/components/map/layer-panel";
import MarineMap, { type BasemapMode } from "@/components/map/marine-map";
import ProfileDashboard from "@/components/map/profile-dashboard";
import ContributorDashboard from "@/components/map/contributor-dashboard";
import { useMarineGeo } from "@/hooks/use-marine-geo";
import {
  BIODIVERSITY_POINTS,
  CORAL_REEFS,
  DASH_TABS,
  DEFAULT_LAYERS,
  ESTUARIES,
  FISHING_GROUNDS,
  MARINE_LAYERS,
  MANGROVES,
  MARINE_MAMMALS,
  OCEAN_CONDITIONS,
  POLLUTION_POINTS,
  PROTECTED_AREAS,
  SEAGRASS,
  STATE_COLORS,
  STATE_PROFILES,
  TURTLE_OBSERVATIONS,
  type LayerGroup,
  type ProfileView,
  type StateSlug,
} from "@/data/marine";

export default function MarineDashboard() {
  const { data: geo } = useMarineGeo();
  const [mode, setMode] = useState<"fisheries" | "contributors">("fisheries");
  const [activeLayers, setActiveLayers] = useState<string[]>(DEFAULT_LAYERS);
  const [basemap, setBasemap] = useState<BasemapMode>("satellite");
  const [selectedState, setSelectedState] = useState<StateSlug>("tamil-nadu");
  const [profileView, setProfileView] = useState<ProfileView>("data");
  const [layersOpen, setLayersOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      "Coastal States": STATE_PROFILES.length,
      "Coastal Length": STATE_PROFILES.length,
      "Coastal Districts": geo?.districts.features.length ?? 0,
      "Fishing Ban Areas": geo?.bands.features.length ?? 0,
      "Lean Fishing Periods": geo?.bands.features.length ?? 0,
      "Fishing Grounds": FISHING_GROUNDS.length,
      "Coral Reefs": CORAL_REEFS.length,
      Seagrass: SEAGRASS.length,
      Mangroves: MANGROVES.length,
      Estuaries: ESTUARIES.length,
      "Marine Protected Areas": PROTECTED_AREAS.length,
      "Marine Biodiversity": BIODIVERSITY_POINTS.length,
      "Marine Mammals": MARINE_MAMMALS.length,
      "Sea Turtle Observations": TURTLE_OBSERVATIONS.length,
      "Ocean Conditions": OCEAN_CONDITIONS.length,
      "Marine Pollution": POLLUTION_POINTS.length,
      "Fishing Crafts": STATE_PROFILES.length,
      "Fisheries Agencies": STATE_PROFILES.length,
      "Fishing Seasons": STATE_PROFILES.length,
      "State Profiles": STATE_PROFILES.length,
    };
    if (geo) {
      let v = 0,
        h = 0,
        l = 0;
      geo.locations.features.forEach((f) => {
        if (f.properties?.kind === "village") v++;
        else if (f.properties?.kind === "harbour") h++;
        else l++;
      });
      c["Marine Fishing Villages"] = v;
      c["Fishing Harbours"] = h;
      c["Landing Centres"] = l;
      c["Marine Habitats"] = CORAL_REEFS.length + SEAGRASS.length + MANGROVES.length + ESTUARIES.length;
    }
    return c;
  }, [geo]);

  const toggleLayer = useCallback(
    (id: string) =>
      setActiveLayers((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id])),
    []
  );

  const toggleGroup = useCallback(
    (group: LayerGroup, on: boolean) =>
      setActiveLayers((prev) => {
        const groupIds = MARINE_LAYERS.filter((l) => l.group === group).map((l) => l.id);
        if (on) return Array.from(new Set([...prev, ...groupIds]));
        return prev.filter((l) => !groupIds.includes(l));
      }),
    []
  );

  const resetLayers = useCallback(() => setActiveLayers(DEFAULT_LAYERS), []);

  const openProfile = useCallback((slug: StateSlug, view: ProfileView) => {
    setSelectedState(slug);
    setProfileView(view);
    setLayersOpen(false);
    if (window.innerWidth < 1024) {
      setTimeout(() => profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* mode switch */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-1 flex items-center gap-1 w-fit">
        {(
          [
            { id: "fisheries", label: "Fisheries GIS" },
            { id: "contributors", label: "Contributors" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              mode === m.id ? "bg-ocean-navy text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "contributors" ? (
        <ContributorDashboard />
      ) : (
        <>
          {/* toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1">
          {DASH_TABS.map((tab) => (
            <a
              key={tab.id}
              href={tab.href}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-ocean-blue hover:bg-ocean-blue/5 transition-colors"
            >
              {tab.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayersOpen((v) => !v)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-ocean-navy text-white"
          >
            <Layers className="h-3.5 w-3.5" /> Layers
          </button>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {STATE_PROFILES.map((p) => {
              const on = p.slug === selectedState;
              return (
                <button
                  key={p.slug}
                  onClick={() => setSelectedState(p.slug)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    on ? "text-white" : "text-slate-500 hover:bg-slate-50"
                  }`}
                  style={{ background: on ? STATE_COLORS[p.slug] : "transparent" }}
                  title={p.state}
                >
                  {p.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* map workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* left: layers */}
        <aside className="hidden lg:block lg:col-span-3">
          <LayerPanel
            active={activeLayers}
            onToggle={toggleLayer}
            onToggleGroup={toggleGroup}
            onReset={resetLayers}
            counts={counts}
          />
        </aside>

        {/* center: map */}
        <div className="lg:col-span-6 h-[440px] sm:h-[520px] lg:h-[640px]">
          <MarineMap
            geo={geo}
            activeLayers={activeLayers}
            basemap={basemap}
            onBasemapChange={setBasemap}
            selectedState={selectedState}
            onSelectState={setSelectedState}
            onOpenProfile={openProfile}
          />
        </div>

        {/* right: profile */}
        <aside ref={profileRef} className="lg:col-span-3 scroll-mt-24">
          <ProfileDashboard
            selected={selectedState}
            onSelect={setSelectedState}
            view={profileView}
            onViewChange={setProfileView}
            geo={geo}
            className="max-h-[640px]"
          />
        </aside>
      </div>

      {/* mobile layer drawer */}
      {layersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 flex" onClick={() => setLayersOpen(false)}>
          <div className="bg-white w-[86%] max-w-[340px] h-full p-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setLayersOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="h-[calc(100%-44px)]">
              <LayerPanel
                active={activeLayers}
                onToggle={toggleLayer}
                onToggleGroup={toggleGroup}
                onReset={resetLayers}
                counts={counts}
              />
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
