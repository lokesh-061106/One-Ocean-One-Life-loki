"use client";

import { useState, useEffect } from "react";
import { Database, Eye, Users, Lock, Globe, Shield } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CMS_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const iconMap: Record<string, any> = { Database, Eye, Users, Lock, Globe, Shield };

interface CmsPage { hero_title?: string; hero_subtitle?: string; content?: string; sections?: { title: string; icon: string; content: string }[]; }

const fallbackSections = [
  { icon: "Database", title: "Information We Collect", content: "Account information, profile details, contributions, device information, location data, and usage preferences." },
  { icon: "Eye", title: "How We Use Your Information", content: "To provide services, process contributions, connect members, send notifications, and ensure safety." },
  { icon: "Users", title: "Information Sharing", content: "Your public profile is visible. We share aggregated data for research. We never sell your information." },
  { icon: "Lock", title: "Data Security", content: "Industry-standard encryption, hashed passwords, regular security audits, and encrypted backups." },
  { icon: "Globe", title: "Your Rights", content: "Access, download, correct, delete your data. Opt out anytime. Withdraw consent at any time." },
  { icon: "Shield", title: "Data Retention", content: "Active data retained while account is active. Inactive data purged after 90 days." },
];

export default function PrivacyPage() {
  const [cms, setCms] = useState<CmsPage | null>(null);

  useEffect(() => {
    fetch(`${CMS_API}/cms/privacy/`).then(r => r.ok ? r.json() : null).then(setCms).catch(() => {});
  }, []);

  const sections = cms?.sections && cms.sections.length > 0 ? cms.sections : fallbackSections;

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero
          badge={<Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Legal</Badge>}
          title={cms?.hero_title || "Privacy Policy"}
          subtitle={cms?.hero_subtitle || "Your privacy is fundamental to our mission."}
        />

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {cms?.content && <div className="prose prose-lg max-w-none mb-12 text-ocean-text-secondary" dangerouslySetInnerHTML={{ __html: cms.content }} />}

            <div className="space-y-6">
              {sections.map((s, i) => {
                const Icon = iconMap[s.icon] || Shield;
                return (
                  <Card key={i} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-ocean-blue/10 flex items-center justify-center flex-shrink-0"><Icon className="h-6 w-6 text-ocean-blue" /></div>
                        <div>
                          <h3 className="font-semibold text-ocean-navy mb-2 text-lg">{s.title}</h3>
                          <div className="text-ocean-text-secondary" dangerouslySetInnerHTML={{ __html: s.content }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-12 bg-ocean-light rounded-xl p-6 text-center">
              <p className="text-ocean-navy font-semibold">Questions about our privacy policy?</p>
              <p className="text-ocean-text-secondary mt-1">Contact us at <a href="mailto:privacy@o3l.org" className="text-ocean-blue hover:underline">privacy@o3l.org</a></p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
