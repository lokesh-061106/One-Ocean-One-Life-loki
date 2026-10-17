"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  ContributorAggregateRow,
  ContributorLevel,
  ContributorPerson,
  ContributorPoint,
} from "@/hooks/use-contributor-map";

export type ContributorBasemap = "satellite" | "streets";

interface ContributorMapProps {
  rows: ContributorAggregateRow[];
  level: ContributorLevel;
  people: ContributorPerson[];
  points: ContributorPoint[];
  basemap: ContributorBasemap;
  onBasemapChange: (mode: ContributorBasemap) => void;
  selectedId: string | null;
  onSelectRow: (row: ContributorAggregateRow | null) => void;
  onDrillRow: (row: ContributorAggregateRow) => void;
}

const CENTER: [number, number] = [79.2, 12.6];
const INITIAL_ZOOM = 5.1;

const LEVEL_COLOR: Record<ContributorLevel, string> = {
  state: "#0EA5E9",
  zone: "#6366F1",
  district: "#F59E0B",
  village: "#10B981",
};

const LEVEL_LABEL: Record<ContributorLevel, string> = {
  state: "State",
  zone: "Zone",
  district: "Coastal district",
  village: "Village / town",
};

const POINT_COLOR = "#FF7660";
const PEOPLE_COLOR = "#8B5CF6";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function popupShell(title: string, subtitle: string, body: string) {
  return `<div style="min-width:220px;max-width:290px;font-family:inherit">
    <div style="background:#082A38;color:#fff;padding:8px 10px;margin:-8px -10px 8px;border-radius:8px 8px 0 0">
      <div style="font-size:13px;font-weight:700">${title}</div>
      <div style="font-size:11px;opacity:.75">${subtitle}</div>
    </div>${body}</div>`;
}

function metricRow(label: string, value: string) {
  return `<div style="display:flex;justify-content:space-between;gap:10px;font-size:11.5px;padding:3px 0;border-bottom:1px dashed #e5eaf0">
    <span style="color:#5b6b78">${label}</span><span style="font-weight:700;color:#082A38;text-align:right">${value}</span></div>`;
}

export default function ContributorMap({
  rows,
  level,
  people,
  points,
  basemap,
  onBasemapChange,
  selectedId,
  onSelectRow,
  onDrillRow,
}: ContributorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const listenersRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const handlersRef = useRef({ onSelectRow, onDrillRow, level, rows });
  useEffect(() => {
    handlersRef.current = { onSelectRow, onDrillRow, level, rows };
  }, [onSelectRow, onDrillRow, level, rows]);

  const closePopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  const aggregateGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    for (const row of rows) {
      if (row.latitude == null || row.longitude == null) continue;
      features.push({
        type: "Feature",
        id: row.id ?? row.name,
        geometry: { type: "Point", coordinates: [row.longitude, row.latitude] },
        properties: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          level: row.level,
          contributions: row.contributions,
          verified: row.verified,
          points: row.points,
          contributors: row.contributors,
        },
      });
    }
    return { type: "FeatureCollection", features };
  }, [rows]);

  const peopleGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: people.map((p) => ({
      type: "Feature" as const,
      id: p.user,
      geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] },
      properties: { ...p },
    })),
  }), [people]);

  const pointsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature" as const,
      id: p.id,
      geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] },
      properties: { ...p },
    })),
  }), [points]);

  /* ---------------- map init ---------------- */

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "satellite-tiles": {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
          },
          "street-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "basemap-satellite",
            type: "raster",
            source: "satellite-tiles",
            layout: { visibility: basemap === "satellite" ? "visible" : "none" },
          },
          {
            id: "basemap-streets",
            type: "raster",
            source: "street-tiles",
            layout: { visibility: basemap === "streets" ? "visible" : "none" },
          },
        ],
      },
      center: CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 4,
      maxZoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => setMapReady(true));
    map.on("error", () => {});

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      closePopup();
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- basemap ---------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer("basemap-satellite")) {
      map.setLayoutProperty("basemap-satellite", "visibility", basemap === "satellite" ? "visible" : "none");
    }
    if (map.getLayer("basemap-streets")) {
      map.setLayoutProperty("basemap-streets", "visibility", basemap === "streets" ? "visible" : "none");
    }
  }, [basemap, mapReady]);

  /* ---------------- sources & layers ---------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const ensureSource = (id: string) => {
      if (!map.getSource(id)) {
        map.addSource(id, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
    };

    ensureSource("contrib-aggregates");
    ensureSource("contrib-points");
    ensureSource("contrib-people");

    if (!map.getLayer("contrib-aggregates-circle")) {
      map.addLayer({
        id: "contrib-aggregates-circle",
        type: "circle",
        source: "contrib-aggregates",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "contributions"],
            1, 10, 10, 18, 50, 30, 200, 46,
          ],
          "circle-color": LEVEL_COLOR[level],
          "circle-opacity": 0.55,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1.4,
        },
      });
    } else {
      map.setPaintProperty("contrib-aggregates-circle", "circle-color", LEVEL_COLOR[level]);
    }

    if (!map.getLayer("contrib-points-circle")) {
      map.addLayer({
        id: "contrib-points-circle",
        type: "circle",
        source: "contrib-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 10, 5.5, 14, 8],
          "circle-color": POINT_COLOR,
          "circle-opacity": 0.9,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1,
        },
      });
    }

    if (!map.getLayer("contrib-people-circle")) {
      map.addLayer({
        id: "contrib-people-circle",
        type: "circle",
        source: "contrib-people",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 10, 7, 14, 10],
          "circle-color": PEOPLE_COLOR,
          "circle-opacity": 0.95,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1.2,
        },
      });
    }

    if (!map.getLayer("contrib-selected-ring")) {
      map.addLayer({
        id: "contrib-selected-ring",
        type: "circle",
        source: "contrib-aggregates",
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "contributions"],
            1, 15, 10, 24, 50, 38, 200, 54,
          ],
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 3,
          "circle-opacity": 1,
        },
      });
    }

    if (!listenersRef.current) {
      const setCursor = (v: string) => {
        map.getCanvas().style.cursor = v;
      };
      ["contrib-aggregates-circle", "contrib-points-circle", "contrib-people-circle"].forEach((id) => {
        map.on("mouseenter", id, () => setCursor("pointer"));
        map.on("mouseleave", id, () => setCursor(""));
      });
      listenersRef.current = true;
    }
  }, [mapReady, level]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const set = (id: string, data: GeoJSON.FeatureCollection) => {
      const src = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(data);
    };
    set("contrib-aggregates", aggregateGeoJSON);
    set("contrib-points", pointsGeoJSON);
    set("contrib-people", peopleGeoJSON);
  }, [mapReady, aggregateGeoJSON, pointsGeoJSON, peopleGeoJSON]);

  /* ---------------- click handling ---------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const layerIds = ["contrib-aggregates-circle", "contrib-points-circle", "contrib-people-circle"]
        .filter((id) => map.getLayer(id));
      const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
      if (!features.length) {
        closePopup();
        handlersRef.current.onSelectRow(null);
        return;
      }
      const feature = features[0];
      const props = feature.properties ?? {};
      const layerId = feature.layer.id;

      if (layerId === "contrib-aggregates-circle") {
        const row = handlersRef.current.rows.find(
          (r) => (r.id ?? r.name) === (feature.id ?? props.id)
        );
        if (row) handlersRef.current.onSelectRow(row);
        const canDrill = (props.level as ContributorLevel) !== "village";
        const body =
          metricRow("Contributions", `${escapeHtml(props.contributions)}`) +
          metricRow("Verified", `${escapeHtml(props.verified)}`) +
          metricRow("Points", `${escapeHtml(props.points)}`) +
          metricRow("Contributors", `${escapeHtml(props.contributors)}`) +
          (canDrill
            ? `<button class="cm-drill" style="margin-top:8px;width:100%;border:1px solid #cbd5e1;background:#082A38;color:#fff;font-size:11px;font-weight:700;padding:6px 8px;border-radius:6px;cursor:pointer">Explore ${escapeHtml(props.name)} →</button>`
            : "");
        const root = document.createElement("div");
        root.innerHTML = popupShell(
          escapeHtml(props.name),
          LEVEL_LABEL[props.level as ContributorLevel] ?? "Area",
          body
        );
        root.querySelector<HTMLButtonElement>(".cm-drill")?.addEventListener("click", () => {
          const row = handlersRef.current.rows.find(
            (r) => (r.id ?? r.name) === (feature.id ?? props.id)
          );
          if (row) handlersRef.current.onDrillRow(row);
          closePopup();
        });
        closePopup();
        popupRef.current = new maplibregl.Popup({ offset: 12, maxWidth: "300px" })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setDOMContent(root)
          .addTo(map);
      } else if (layerId === "contrib-points-circle") {
        const body =
          metricRow("Type", escapeHtml(props.type_display ?? props.type)) +
          metricRow("Status", escapeHtml(props.status)) +
          metricRow("Points", escapeHtml(props.points)) +
          metricRow("Contributor", escapeHtml(props.contributor)) +
          metricRow("Village", escapeHtml(props.village ?? "—")) +
          metricRow("District", escapeHtml(props.district ?? "—"));
        closePopup();
        popupRef.current = new maplibregl.Popup({ offset: 12, maxWidth: "300px" })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(popupShell("Contribution", escapeHtml(props.contributor), body))
          .addTo(map);
      } else {
        const body =
          metricRow("Village", escapeHtml(props.village ?? "—")) +
          metricRow("District", escapeHtml(props.district ?? "—")) +
          metricRow("State", escapeHtml(props.state ?? "—")) +
          metricRow("Verified", escapeHtml(props.verified_contributions)) +
          metricRow("Score", escapeHtml(props.total_score)) +
          (props.earnings_hidden
            ? ""
            : metricRow("Earnings", `₹${escapeHtml(props.earnings_inr)}`));
        closePopup();
        popupRef.current = new maplibregl.Popup({ offset: 12, maxWidth: "300px" })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(popupShell(escapeHtml(props.name), "Contributor", body))
          .addTo(map);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [mapReady, closePopup]);

  /* ---------------- selection highlight ---------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("contrib-selected-ring")) return;
    map.setFilter("contrib-selected-ring", [
      "==", ["get", "id"], selectedId ?? "__none__",
    ]);
    if (selectedId) {
      const row = rows.find((r) => (r.id ?? r.name) === selectedId);
      if (row && row.latitude != null && row.longitude != null) {
        map.easeTo({ center: [row.longitude, row.latitude], duration: 600 });
      }
    }
  }, [selectedId, rows, mapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        {(["satellite", "streets"] as ContributorBasemap[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onBasemapChange(mode)}
            className={`px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
              basemap === mode ? "bg-ocean-navy text-white" : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-200 rounded-lg shadow-sm px-3 py-2 text-[11px] leading-relaxed">
        <div className="font-bold text-ocean-navy mb-1">Legend</div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR[level] }} />
          {LEVEL_LABEL[level]} bubble
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PEOPLE_COLOR }} />
          Contributor (opted-in)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: POINT_COLOR }} />
          Exact contribution
        </div>
      </div>
    </div>
  );
}
