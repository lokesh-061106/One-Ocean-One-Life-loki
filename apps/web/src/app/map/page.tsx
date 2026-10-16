"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import FisheriesCharts from "@/components/charts/fisheries-charts";
import {
  AgenciesSection,
  ComparisonSection,
  ProfileSection,
  ReliefSection,
  ReportsSection,
  SeasonsSection,
  SummaryBar,
} from "@/components/map/marine-sections";

const MarineDashboard = dynamic(() => import("@/components/map/marine-dashboard"), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-slate-200 rounded-xl h-[560px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-ocean-blue border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-ocean-navy font-medium text-sm">Loading marine GIS dashboard…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        {/* hero */}
        <section className="relative overflow-hidden bg-[#041c33] text-white pt-14 pb-20 border-b border-sky-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#021120] via-[#052647] to-[#073a66] opacity-90 pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-400/15 text-sky-200 border border-sky-400/30 mb-4 tracking-wide uppercase">
              Marine Fisheries GIS · Southern India
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Marine Fisheries GIS Dashboard
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Government-grade marine fisheries spatial atlas for Andhra Pradesh, Karnataka, Kerala, and Tamil Nadu — coastal
              boundaries, fishing villages, active harbours, seasonal bans, habitats, and PMMSY welfare schemes in one interactive
              spatial console.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-slate-300">
              <span className="bg-white/10 px-3 py-1 rounded-full">🛰 Esri satellite &amp; OSM street basemaps</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">Layers: administrative · infrastructure · seasons · habitats · biodiversity</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">Live O3L verified telemetry &amp; catch logs</span>
            </div>
          </div>
        </section>

        {/* summary modules */}
        <SummaryBar />

        {/* map workspace */}
        <section id="map" className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-10 scroll-mt-24">
          <MarineDashboard />
        </section>

        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-14 space-y-16">
          <ComparisonSection />

          <section aria-label="Fisheries charts">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ocean-navy">Fisheries at a glance</h2>
              <p className="text-sm text-ocean-text-secondary mt-1">
                Fleet composition and coastal indicators across the four states.
              </p>
            </div>
            <FisheriesCharts />
          </section>

          <ProfileSection />
          <AgenciesSection />
          <SeasonsSection />
          <ReliefSection />
          <ReportsSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
