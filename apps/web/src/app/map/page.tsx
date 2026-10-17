"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
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
        <PageHero
          width="wide"
          badge={<span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">Marine Fisheries GIS · Southern India</span>}
          title="Marine Fisheries GIS Dashboard"
          subtitle="Government-grade marine fisheries spatial atlas for Andhra Pradesh, Karnataka, Kerala, and Tamil Nadu — coastal boundaries, fishing villages, active harbours, seasonal bans, habitats, and PMMSY welfare schemes in one interactive spatial console."
        >
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <span className="bg-white/10 px-3 py-1 rounded-full">🛰 Esri satellite &amp; OSM street basemaps</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Layers: administrative · infrastructure · seasons · habitats · biodiversity</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Live O3L verified telemetry &amp; catch logs</span>
          </div>
        </PageHero>

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
