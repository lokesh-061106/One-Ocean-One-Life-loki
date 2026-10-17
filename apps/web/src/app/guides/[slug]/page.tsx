"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Eye, Heart, Share2, BookOpen, Info, ChevronRight, Lightbulb, Microscope } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RichContent, decodeEntities } from "@/components/ui/rich-content";
import { guideSpecies, getGuideCategory } from "@/lib/data";
import { fetchCms, fetchCmsList, type ApiSpecies } from "@/lib/api-helpers";

const statusMap: Record<string, string> = {
  LC: "Least Concern", VU: "Vulnerable", EN: "Endangered", CR: "Critically Endangered",
};

const statusColors: Record<string, string> = {
  "Least Concern": "bg-ocean-green text-white",
  Vulnerable: "bg-ocean-warning text-white",
  Endangered: "bg-ocean-danger text-white",
  "Critically Endangered": "bg-red-700 text-white",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const has = (value?: string | null): value is string =>
  typeof value === "string" && value.trim().length > 0;

interface RelatedItem {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  icon: string;
}

export default function SpeciesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [species, setSpecies] = useState<ApiSpecies | null>(null);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await fetchCms<ApiSpecies>(`/guides/species/${slug}/`);
      const found = data ?? (guideSpecies.find((s) => s.slug === slug || s.id === slug) as unknown as ApiSpecies) ?? null;
      if (cancelled) return;
      setSpecies(found);
      setLoading(false);
      if (found?.slug && found.slug !== slug && UUID_RE.test(slug)) {
        router.replace(`/guides/${found.slug}`);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  const catId =
    typeof species?.category === "object" && species.category !== null
      ? species.category.id
      : typeof species?.category === "string"
        ? species.category
        : undefined;

  useEffect(() => {
    if (!catId || !species) return;
    let cancelled = false;
    async function loadRelated() {
      const list = await fetchCmsList<ApiSpecies>(`/guides/species/?category=${catId}`);
      if (cancelled) return;
      if (list.length > 0) {
        setRelated(
          list
            .filter((s) => s.id !== species!.id)
            .slice(0, 4)
            .map((s) => ({
              id: s.id,
              slug: s.slug || s.id,
              common_name: s.common_name,
              scientific_name: s.scientific_name,
              icon: typeof s.category === "object" && s.category?.icon ? s.category.icon : "🐟",
            }))
        );
        return;
      }
      setRelated(
        guideSpecies
          .filter((s) => s.category_id === catId && s.id !== species!.id)
          .slice(0, 4)
          .map((s) => ({ id: s.id, slug: s.slug, common_name: s.common_name, scientific_name: s.scientific_name, icon: s.image }))
      );
    }
    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [catId, species]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-ocean-navy text-lg animate-pulse">Loading species...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!species) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ocean-navy mb-4">Species Not Found</h1>
          <Link href="/guides" className="text-ocean-blue hover:underline">Back to Guides</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const category =
    typeof species.category === "object" && species.category !== null
      ? species.category
      : getGuideCategory(catId || "");

  const statusLabel = statusMap[species.conservation_status] || species.conservation_status;
  const heroIcon = has(species.image) ? species.image : category?.icon || "🐟";
  const hasImage = /^https?:\/\//.test(heroIcon) || heroIcon.startsWith("/");

  const quickFacts = [
    { label: "Diet", value: species.diet },
    { label: "Typical Size", value: species.typical_size },
    { label: "Conservation Status", value: statusLabel },
    { label: "Category", value: category?.name },
  ].filter((fact): fact is { label: string; value: string } => has(fact.value));

  const hasContent =
    has(species.description) ||
    has(species.habitat) ||
    has(species.behavior) ||
    has(species.identification) ||
    has(species.interesting_facts);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        {/* Species hero */}
        <PageHero bare className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/guides" className="inline-flex items-center gap-2 text-ocean-sand hover:text-white mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Guides
            </Link>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="shrink-0 flex h-32 w-32 md:h-40 md:w-40 items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                {hasImage ? (
                  <img src={heroIcon} alt={species.common_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-7xl">{heroIcon}</span>
                )}
              </div>
              <div className="flex-1">
                {(has(statusLabel) || species.is_verified) && (
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {has(statusLabel) && <Badge className={statusColors[statusLabel]}>{statusLabel}</Badge>}
                    {species.is_verified && <Badge className="bg-white/20 text-white">✓ Verified</Badge>}
                  </div>
                )}
                <h1 className="text-4xl font-bold text-white mb-2">{species.common_name}</h1>
                {has(species.scientific_name) && (
                  <p className="text-xl text-ocean-sand italic mb-2">{species.scientific_name}</p>
                )}
                {has(species.tamil_name) && <p className="text-ocean-sand mb-4">{species.tamil_name}</p>}
                {category && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {category.icon} {category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </PageHero>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {has(species.description) && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-ocean-blue" /> Overview</CardTitle></CardHeader>
                  <CardContent><RichContent content={species.description} /></CardContent>
                </Card>
              )}

              {has(species.habitat) && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-ocean-blue" /> Habitat</CardTitle></CardHeader>
                  <CardContent><RichContent content={species.habitat} /></CardContent>
                </Card>
              )}

              {has(species.behavior) && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-ocean-blue" /> Behavior</CardTitle></CardHeader>
                  <CardContent><RichContent content={species.behavior} /></CardContent>
                </Card>
              )}

              {has(species.identification) && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-ocean-blue" /> Identification</CardTitle></CardHeader>
                  <CardContent><RichContent content={species.identification} /></CardContent>
                </Card>
              )}

              {has(species.interesting_facts) && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-ocean-blue" /> Interesting Facts</CardTitle></CardHeader>
                  <CardContent><RichContent content={species.interesting_facts} /></CardContent>
                </Card>
              )}

              {!hasContent && (
                <Card>
                  <CardContent className="py-10 text-center text-ocean-text-secondary">
                    <Microscope className="mx-auto mb-3 h-8 w-8 text-ocean-muted" />
                    Detailed information for this guide entry is coming soon.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {quickFacts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Quick Facts</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {quickFacts.map((fact, index) => (
                      <div key={fact.label}>
                        {index > 0 && <Separator className="mb-4" />}
                        <span className="text-sm text-ocean-muted">{fact.label}</span>
                        <p className="font-medium text-ocean-navy">{decodeEntities(fact.value)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline"><Heart className="mr-2 h-4 w-4" /> Save to Favorites</Button>
                  <Button className="w-full" variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Species</Button>
                  <Button className="w-full" variant="outline"><Eye className="mr-2 h-4 w-4" /> Report Sighting</Button>
                </CardContent>
              </Card>

              {related.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Related Species</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {related.map((s) => (
                      <Link key={s.id} href={`/guides/${s.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-ocean-light transition-colors">
                        <span className="text-2xl">{s.icon}</span>
                        <div>
                          <p className="font-medium text-ocean-navy text-sm">{s.common_name}</p>
                          {has(s.scientific_name) && <p className="text-xs text-ocean-text-secondary italic">{s.scientific_name}</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 text-ocean-muted ml-auto" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
