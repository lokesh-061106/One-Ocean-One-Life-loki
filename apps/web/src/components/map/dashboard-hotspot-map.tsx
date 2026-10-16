"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ============================================================ */
/*  Dashboard hotspot map (MapLibre GL)                         */
/*                                                              */
/*  Lightweight map for /dashboard/maps — plots the live        */
/*  hotspots from useDashboardData() as density-coloured        */
/*  markers with popups. Same tile style as the storefront      */
/*  ExperienceMap (OSM raster, no API key required).            */
/* ============================================================ */

export interface DashboardHotspotPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  density: "low" | "medium" | "high" | "very_high";
  contributions: number;
  zoneName?: string;
}

const CENTER: [number, number] = [79.2, 12.6];

const DENSITY_COLOR: Record<DashboardHotspotPoint["density"], string> = {
  low: "#3b82f6",
  medium: "#eab308",
  high: "#f97316",
  very_high: "#ef4444",
};

const DENSITY_SIZE: Record<DashboardHotspotPoint["density"], number> = {
  low: 14,
  medium: 18,
  high: 22,
  very_high: 26,
};

const DENSITY_LABEL: Record<DashboardHotspotPoint["density"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

export function DashboardHotspotMap({
  hotspots,
  height = 384,
}: {
  hotspots: DashboardHotspotPoint[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "street-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "basemap-streets", type: "raster", source: "street-tiles" }],
      },
      center: CENTER,
      zoom: 5.1,
      minZoom: 4,
      maxZoom: 13,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => setReady(true));
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const valid = hotspots.filter(
      (hs) => Number.isFinite(hs.lat) && Number.isFinite(hs.lng)
    );

    valid.forEach((hs) => {
      const color = DENSITY_COLOR[hs.density] || DENSITY_COLOR.medium;
      const size = DENSITY_SIZE[hs.density] || 16;

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", hs.name);
      el.style.cssText = `
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2.5px solid #fff;cursor:pointer;
        box-shadow:0 2px 8px rgba(0,0,0,.35);transition:transform .15s ease;
      `;
      el.onmouseenter = () => (el.style.transform = "scale(1.2)");
      el.onmouseleave = () => (el.style.transform = "scale(1)");

      const popup = new maplibregl.Popup({ offset: size / 2, closeButton: false }).setHTML(`
        <div style="min-width:170px;font-family:inherit">
          <div style="font-weight:700;color:#082A38;font-size:13px;margin-bottom:2px">${escapeHtml(hs.name)}</div>
          ${hs.zoneName ? `<div style="font-size:11px;color:#64748B;margin-bottom:4px">📍 ${escapeHtml(hs.zoneName)}</div>` : ""}
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#334155">
            <span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block"></span>
            <span style="font-weight:600">${DENSITY_LABEL[hs.density] || hs.density} density</span>
          </div>
          <div style="font-size:11px;color:#087EA4;font-weight:700;margin-top:3px">
            ${hs.contributions.toLocaleString("en-IN")} contributions
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hs.lng, hs.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (valid.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      valid.forEach((hs) => bounds.extend([hs.lng, hs.lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 9, duration: 800 });
    } else if (valid.length === 1) {
      map.easeTo({ center: [valid[0].lng, valid[0].lat], zoom: 8, duration: 800 });
    }
  }, [hotspots, ready]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl"
      style={{ height }}
      aria-label="Hotspot map"
    />
  );
}

export default DashboardHotspotMap;
