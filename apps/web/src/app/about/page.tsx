"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Globe, Heart, Shield, Target, Eye, MapPin, Award, ChevronRight, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { platformStats } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const CMS_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const iconMap: Record<string, any> = { Heart, Globe, Users, Shield, Target, Eye, MapPin, Award, ChevronRight, Database: Shield, Lock: Shield, Scale: Shield, AlertTriangle: Shield, FileText: Shield };

const team = [
  { name: "Dr. Kavitha Rajan", role: "Founder & Director", bio: "Marine biologist with 15 years of research experience in the Gulf of Mannar." },
  { name: "Arumugam K.", role: "Community Programs Lead", bio: "Third-generation fisherman passionate about bridging traditional knowledge and modern science." },
  { name: "Priya S.", role: "Research Coordinator", bio: "Environmental scientist specializing in coastal ecosystem monitoring." },
  { name: "Lakshmi Devi", role: "Education Manager", bio: "Former teacher with expertise in community-based environmental education." },
];

const values = [
  { icon: Heart, title: "Community First", description: "We prioritize the needs and knowledge of coastal communities in everything we do." },
  { icon: Globe, title: "Ocean Conservation", description: "Our mission is to protect marine ecosystems through collective action and scientific research." },
  { icon: Users, title: "Inclusivity", description: "We welcome everyone - fishermen, researchers, educators, students, and concerned citizens." },
  { icon: Shield, title: "Sustainability", description: "We promote practices that ensure the long-term health of both marine and human communities." },
  { icon: Eye, title: "Citizen Science", description: "We believe everyone can contribute valuable data to understand and protect our oceans." },
  { icon: Target, title: "Impact-Driven", description: "Every initiative is measured by its tangible impact on ocean health and community wellbeing." },
];

const milestones = [
  { year: "2024", title: "Foundation", description: "O3L founded by a group of marine biologists and coastal community leaders in Tamil Nadu." },
  { year: "2024", title: "Pilot Launch", description: "Started with 5 coastal villages and 50 community members in the Nagapattinam district." },
  { year: "2025", title: "Expansion", description: "Expanded to all 5 coastal zones of Tamil Nadu with over 10,000 active members." },
  { year: "2025", title: "Research Partnerships", description: "Partnered with 12 research institutions and universities across India." },
  { year: "2026", title: "142K+ Members", description: "Reached over 142,000 engaged community members across 612 coastal villages." },
  { year: "2026", title: "1.2M Observations", description: "Collected over 1.2 million verified marine observations and citizen science data points." },
];

interface CmsPage { hero_title?: string; hero_subtitle?: string; content?: string; sidebar_content?: string; sections?: { title: string; icon: string; content: string }[]; }

export default function AboutPage() {
  const [cms, setCms] = useState<CmsPage | null>(null);

  useEffect(() => {
    fetch(`${CMS_API}/cms/about/`).then(r => r.ok ? r.json() : null).then(setCms).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        {/* Hero */}
        <PageHero
          badge={<Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">About O3L</Badge>}
          title={cms?.hero_title || "One Ocean One Life"}
          subtitle={cms?.hero_subtitle || "Connecting coastal communities to collectively understand and protect the ocean."}
          subtitleClassName="mb-8"
        >
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-ocean-green hover:bg-ocean-green/90 text-white" asChild><Link href="/register">Join Our Mission <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-ocean-deep" asChild><Link href="/contact">Contact Us</Link></Button>
          </div>
        </PageHero>

        {/* Mission / CMS Content */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-3xl font-bold text-ocean-navy mb-6">Our Mission</h2>
                {cms?.content ? (
                  <div className="prose prose-lg max-w-none text-ocean-text-secondary" dangerouslySetInnerHTML={{ __html: cms.content }} />
                ) : (
                  <>
                    <p className="text-lg text-ocean-text-secondary mb-4">O3L is a multi-platform citizen science and coastal community platform designed for ocean conservation in Tamil Nadu, India.</p>
                    <p className="text-ocean-text-secondary mb-4">We believe that the people who live closest to the ocean are its best guardians.</p>
                  </>
                )}
                {cms?.sidebar_content && (
                  <div className="mt-6 p-4 bg-ocean-light rounded-xl" dangerouslySetInnerHTML={{ __html: cms.sidebar_content }} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ocean-light rounded-xl p-6 text-center"><p className="text-3xl font-bold text-ocean-blue">{formatNumber(platformStats.totalUsers)}+</p><p className="text-sm text-ocean-text-secondary mt-1">People Engaged</p></div>
                <div className="bg-ocean-light rounded-xl p-6 text-center"><p className="text-3xl font-bold text-ocean-blue">{platformStats.totalVillages}</p><p className="text-sm text-ocean-text-secondary mt-1">Coastal Villages</p></div>
                <div className="bg-ocean-light rounded-xl p-6 text-center"><p className="text-3xl font-bold text-ocean-blue">1.2M+</p><p className="text-sm text-ocean-text-secondary mt-1">Verified Observations</p></div>
                <div className="bg-ocean-light rounded-xl p-6 text-center"><p className="text-3xl font-bold text-ocean-blue">5</p><p className="text-sm text-ocean-text-secondary mt-1">Coastal Zones</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* CMS Sections */}
        {cms?.sections && cms.sections.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-ocean-navy text-center mb-12">From Our CMS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cms.sections.map((s, i) => {
                  const Icon = iconMap[s.icon] || Target;
                  return (
                    <Card key={i} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-ocean-blue/10 flex items-center justify-center mb-4"><Icon className="h-6 w-6 text-ocean-blue" /></div>
                        <h3 className="font-semibold text-ocean-navy mb-2">{s.title}</h3>
                        <div className="text-sm text-ocean-text-secondary" dangerouslySetInnerHTML={{ __html: s.content }} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Values */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-ocean-navy text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-ocean-blue/10 flex items-center justify-center mb-4"><Icon className="h-6 w-6 text-ocean-blue" /></div>
                      <h3 className="font-semibold text-ocean-navy mb-2">{value.title}</h3>
                      <p className="text-sm text-ocean-text-secondary">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-ocean-navy text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-ocean-blue flex items-center justify-center text-white font-bold text-sm">{milestone.year}</div>
                    {index < milestones.length - 1 && <div className="w-0.5 flex-1 bg-ocean-border mt-2" />}
                  </div>
                  <div className="pb-8"><h3 className="font-semibold text-ocean-navy text-lg mb-1">{milestone.title}</h3><p className="text-ocean-text-secondary">{milestone.description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-ocean-navy text-center mb-12">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-20 h-20 rounded-full bg-ocean-blue flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">{member.name.charAt(0)}</div>
                    <h3 className="font-semibold text-ocean-navy">{member.name}</h3>
                    <p className="text-sm text-ocean-blue mb-2">{member.role}</p>
                    <p className="text-sm text-ocean-text-secondary">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-ocean-deep to-ocean-blue">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
            <p className="text-lg text-ocean-sand mb-8 max-w-2xl mx-auto">Join thousands of coastal community members who are already contributing to ocean conservation.</p>
            <Button size="lg" className="bg-ocean-green hover:bg-ocean-green/90 text-white" asChild><Link href="/register">Get Started Today <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
