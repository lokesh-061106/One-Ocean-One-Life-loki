"use client";

import { useState, useEffect } from "react";
import { FileText, Users, Shield, AlertTriangle, Scale, Globe } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CMS_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const iconMap: Record<string, any> = { FileText, Users, Shield, AlertTriangle, Scale, Globe };

interface CmsPage { hero_title?: string; hero_subtitle?: string; content?: string; sections?: { title: string; icon: string; content: string }[]; }

const fallbackSections = [
  { icon: "FileText", title: "Acceptance of Terms", content: "By using O3L, you agree to these terms and our Privacy Policy." },
  { icon: "Users", title: "User Accounts", content: "You must be at least 13 years old. One person, one account." },
  { icon: "Shield", title: "User Conduct", content: "No impersonation, harmful content, harassment, or unauthorized access." },
  { icon: "FileText", title: "Content and Contributions", content: "You own your content. You grant O3L a non-exclusive license for research." },
  { icon: "AlertTriangle", title: "Disclaimer", content: "O3L is provided as is without warranties." },
  { icon: "Scale", title: "Limitation of Liability", content: "No liability for indirect or consequential damages." },
  { icon: "Globe", title: "Governing Law", content: "Governed by laws of India. Courts in Chennai have jurisdiction." },
];

export default function TermsPage() {
  const [cms, setCms] = useState<CmsPage | null>(null);

  useEffect(() => {
    fetch(`${CMS_API}/cms/terms/`).then(r => r.ok ? r.json() : null).then(setCms).catch(() => {});
  }, []);

  const sections = cms?.sections && cms.sections.length > 0 ? cms.sections : fallbackSections;

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero
          badge={<Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Legal</Badge>}
          title={cms?.hero_title || "Terms of Service"}
          subtitle={cms?.hero_subtitle || "Please read these terms carefully before using O3L."}
        />

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {cms?.content && <div className="prose prose-lg max-w-none mb-12 text-ocean-text-secondary" dangerouslySetInnerHTML={{ __html: cms.content }} />}

            <div className="space-y-6">
              {sections.map((s, i) => {
                const Icon = iconMap[s.icon] || FileText;
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
              <p className="text-ocean-navy font-semibold">Questions about our terms?</p>
              <p className="text-ocean-text-secondary mt-1">Contact us at <a href="mailto:legal@o3l.org" className="text-ocean-blue hover:underline">legal@o3l.org</a></p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
