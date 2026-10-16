"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Waves,
  Fish,
  MapPin,
  Users,
  BookOpen,
  Mic,
  Camera,
  Trophy,
  ArrowRight,
  TrendingUp,
  Globe,
  Heart,
  Shield,
  Zap,
  ChevronRight,
  Anchor,
  Recycle,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Anchor,
    title: "Fisheries Ecotourism",
    description: "5 community livelihood models, certified fishing village homestays, boat tours & 100% escrow protection.",
    href: "/ecotourism",
    color: "bg-amber-500",
    badge: "Flagship",
  },
  {
    icon: Recycle,
    title: "Circular Economy",
    description: "Transform ocean waste into income: dry fish value addition, seaweed agar, bio-fertilizer & SHG schemes.",
    href: "/economy",
    color: "bg-emerald-600",
    badge: "Community SHG",
  },
  {
    icon: ShoppingCart,
    title: "Marketplace",
    description: "Ocean-friendly products, direct catch, preserved coastal goods & community-crafted artisanal wares.",
    href: "/marketplace",
    color: "bg-teal-600",
  },
  {
    icon: BookOpen,
    title: "Ocean Guides",
    description: "Learn about marine species, habitats, and ecosystems along the Southern India coastline.",
    href: "/guides",
    color: "bg-ocean-blue",
  },
  {
    icon: Mic,
    title: "Ocean Sounds",
    description: "Listen to citizen-science bioacoustics, dolphin echolocation & hydrophone recordings.",
    href: "/sounds",
    color: "bg-indigo-600",
  },
  {
    icon: Camera,
    title: "Marine Sightings",
    description: "Discover and report marine mammal sightings, turtles, and biodiversity near your coast.",
    href: "/sightings",
    color: "bg-ocean-green",
  },
  {
    icon: MapPin,
    title: "Ocean Map",
    description: "Explore observations, hotspots, and coastal village landing points with interactive mapping.",
    href: "/map",
    color: "bg-sky-600",
  },
  {
    icon: Users,
    title: "Community Network",
    description: "Connect directly with coastal fisherfolk, marine researchers, NGOs, and cooperatives.",
    href: "/community/members",
    color: "bg-ocean-coral",
  },
  {
    icon: Trophy,
    title: "Recognition & Impact",
    description: "Celebrating coastal contributors and village societies making a lasting environmental impact.",
    href: "/recognition",
    color: "bg-ocean-warning",
  },
];

const stats = [
  { label: "People Engaged", value: "142,820+", icon: Users },
  { label: "Coastal Villages", value: "612", icon: MapPin },
  { label: "Verified Observations", value: "1.2M+", icon: TrendingUp },
  { label: "Marine Sightings", value: "184K+", icon: Fish },
];

const impactAreas = [
  {
    icon: Globe,
    title: "Ocean Conservation",
    description: "Protecting marine ecosystems through community-driven data collection and awareness.",
  },
  {
    icon: Heart,
    title: "Community Empowerment",
    description: "Building coastal livelihoods through knowledge sharing and collaborative research.",
  },
  {
    icon: Shield,
    title: "Marine Protection",
    description: "Safeguarding endangered species and their habitats along the Southern Indian coast.",
  },
  {
    icon: Zap,
    title: "Citizen Science",
    description: "Empowering everyday people to contribute to scientific research and understanding.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F3F8FB]">
      <Header />

      <main>
        {/* Executive Hero Section */}
        <section className="relative overflow-hidden bg-[#041c33] text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-[#021120] via-[#052647] to-[#073a66]" />
          <div className="pointer-events-none absolute inset-0 opacity-15 mix-blend-luminosity">
            <img src="/shg/p1-banner-boats.webp" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#021120] via-transparent to-[#021120]/75" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          <div className="relative mx-auto max-w-[1720px] px-4 py-20 sm:px-6 lg:px-8 xl:px-10 lg:py-28">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-950/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 shadow-md mb-6">
                🌊 Southern India Coastal Ecosystem Platform
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-md">
                One Ocean · One Life
              </h1>
              
              <p className="text-xl md:text-2xl font-bold text-amber-300 mb-4 drop-shadow-sm">
                Connect. Learn. Contribute. Protect.
              </p>
              
              <p className="text-base sm:text-lg font-medium text-slate-100 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
                Connecting coastal fishing communities, artisanal fishers, marine researchers, NGOs, and travelers to build sustainable livelihoods and safeguard our living oceans.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" className="bg-amber-400 text-ocean-navy hover:bg-amber-300 font-extrabold shadow-lg transition hover:scale-105" asChild>
                  <Link href="/ecotourism">
                    <Anchor className="mr-2 h-5 w-5" />
                    Explore Ecotourism
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" className="border-sky-300/40 bg-white/10 text-white hover:bg-white hover:text-ocean-navy font-bold backdrop-blur-sm" asChild>
                  <Link href="/economy">
                    <Recycle className="mr-2 h-5 w-5" />
                    Circular Economy
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white hover:text-ocean-navy font-bold backdrop-blur-sm" asChild>
                  <Link href="/guides">
                    Explore Guides
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="rounded-2xl border border-slate-200/90 bg-ocean-foam p-6 text-center hover:border-ocean-blue transition-all duration-300 hover:-translate-y-1 hover:shadow-ocean">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <Icon className="h-6 w-6 text-ocean-blue" />
                    </div>
                    <div className="text-3xl font-black text-ocean-navy mb-1">{stat.value}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-ocean-text-secondary">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features / Modules Section */}
        <section className="py-16 bg-[#F3F8FB]">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-ocean-blue">Integrated Platform Architecture</span>
              <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-ocean-navy">
                Explore All O3L Platform Modules
              </h2>
              <p className="mt-2 text-base text-ocean-text-secondary max-w-2xl mx-auto">
                Comprehensive solutions connecting community livelihoods, marine research, education, and coastal markets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link key={index} href={feature.href} className="group block">
                    <div className="h-full rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-ocean-blue hover:shadow-ocean-lg flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          {feature.badge && (
                            <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                              {feature.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-extrabold text-ocean-navy mb-2 group-hover:text-ocean-blue transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-ocean-text-secondary">
                          {feature.description}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center text-xs font-bold text-ocean-blue group-hover:text-ocean-deep transition-colors pt-3 border-t border-slate-100">
                        Launch module
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-16 bg-white border-y border-slate-200">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-ocean-green">Real World Impact</span>
              <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-ocean-navy">
                Empowering Coastal Communities
              </h2>
              <p className="mt-2 text-base text-ocean-text-secondary max-w-2xl mx-auto">
                Transforming coastal well-being through direct income diversification and citizen science.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {impactAreas.map((area, index) => {
                const Icon = area.icon;
                return (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-ocean-foam p-6">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-xs">
                      <Icon className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <h3 className="text-base font-extrabold text-ocean-navy mb-1.5">{area.title}</h3>
                    <p className="text-xs sm:text-sm text-ocean-text-secondary leading-relaxed">{area.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#021120] via-[#052647] to-[#073a66] text-white">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Strengthen Our Coastal Future?
            </h2>
            <p className="text-base sm:text-lg text-slate-200 mb-8 max-w-2xl mx-auto font-medium">
              Join coastal fishing households, scientific institutions, and conscious travelers active across the Southern Indian coastline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="bg-amber-400 text-ocean-navy hover:bg-amber-300 font-extrabold shadow-lg" asChild>
                <Link href="/ecotourism">
                  <Anchor className="mr-2 h-5 w-5" />
                  Explore Ecotourism
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-ocean-navy font-bold backdrop-blur-sm" asChild>
                <Link href="/economy">
                  <Recycle className="mr-2 h-5 w-5" />
                  Circular Economy
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
