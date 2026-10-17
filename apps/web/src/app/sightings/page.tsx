"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, User, Calendar, Eye, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCmsList, mediaUrl, resolveName, resolveStr, sightingFallbackText } from "@/lib/api-helpers";
import { LocationDisplay } from "@/components/location-display";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import { RichContent } from "@/components/ui/rich-content";
import { useAuth } from "@/components/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";

interface SightingCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sightings_count?: number;
  species: { id: string; common_name: string; scientific_name: string; source_ref: string }[];
}

interface Sighting {
  id: string;
  slug?: string;
  ai_species_suggestion: string;
  ai_confidence: number | null;
  number_observed: number;
  behavior: string;
  sea_condition: string;
  weather: string;
  notes: string;
  sighting_date: string | null;
  photo: string | null;
  images?: { id: string; image: string; caption?: string | null }[];
  documents?: { id: string; document: string; name: string; file_type: string; file_size: number }[];
  category: string | null;
  category_name: string | null;
  species_name?: string | null;
  contributor?: string;
  village_name?: string | null;
  status?: string;
  species: { id: string; common_name: string; tamil_name: string; scientific_name: string; image: string | null } | string;
  contribution?: { id: string; user: any; village: any; location?: { type: string; coordinates: [number, number] } } | string;
}

export default function SightingsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const mounted = useHydrated();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [categories, setCategories] = useState<SightingCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  const handleSubmitSighting = () => {
    if (mounted && authUser) {
      router.push("/dashboard/contributions");
    } else {
      router.push("/login?next=/dashboard/contributions");
    }
  };

  const getGallery = (sighting: Sighting): LightboxImage[] => [
    ...(sighting.photo ? [{ src: mediaUrl(sighting.photo), caption: getSpeciesName(sighting) }] : []),
    ...(sighting.images ?? []).map((img) => ({ src: mediaUrl(img.image), caption: img.caption })),
  ];

  useEffect(() => {
    async function load() {
      const data = await fetchCmsList<SightingCategory>("/sightings/categories/");
      setCategories(data);
    }
    load();
  }, []);

  useEffect(() => {
    async function load() {
      const query = activeCategory ? `?category=${activeCategory}` : "";
      const data = await fetchCmsList<Sighting>(`/sightings/${query}`);
      setSightings(data);
    }
    load();
  }, [activeCategory]);

  const getSpeciesName = (sighting: Sighting) => {
    if (typeof sighting.species === "object" && sighting.species) {
      return sighting.species.common_name || sighting.species.scientific_name;
    }
    return sighting.ai_species_suggestion || "Unidentified Marine Life";
  };

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero
          width="wide"
          badge={<Badge variant="secondary" className="mb-4 bg-sky-950/80 text-amber-300 border-sky-400/40 font-bold tracking-wider uppercase text-xs">Community Biodiversity Log</Badge>}
          title="Marine Mammal Sightings"
          subtitle="Document and explore marine mammal, turtle, and marine life observations along Southern Indian coasts."
        />

        <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory("")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                activeCategory === ""
                  ? "bg-ocean-navy text-white shadow-md scale-105"
                  : "bg-white text-ocean-text-secondary border border-slate-200 hover:border-ocean-blue hover:text-ocean-blue"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id === activeCategory ? "" : category.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  activeCategory === category.id
                    ? "bg-ocean-navy text-white shadow-md scale-105"
                    : "bg-white text-ocean-text-secondary border border-slate-200 hover:border-ocean-blue hover:text-ocean-blue"
                }`}
              >
                {category.icon && (
                  <span
                    className="text-sm leading-none"
                    style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Android Emoji",sans-serif' }}
                  >
                    {category.icon}
                  </span>
                )}
                <span>{category.name}</span>
                {typeof category.sightings_count === "number" && (
                  <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeCategory === category.id ? "bg-white/25 text-white" : "bg-ocean-foam text-ocean-navy"
                  }`}>
                    {category.sightings_count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {(() => {
            const active = categories.find((c) => c.id === activeCategory);
            if (!active || !active.species?.length) return null;
            return (
              <div className="mb-8 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <p className="text-xs font-extrabold uppercase tracking-wider text-ocean-blue mb-2">Species in this category</p>
                <ul className="flex flex-wrap gap-2">
                  {active.species.map((species) => (
                    <li
                      key={species.id}
                      className="px-3 py-1 rounded-lg bg-ocean-foam text-xs font-medium text-ocean-navy border border-slate-200/80"
                    >
                      {species.common_name}
                      {species.scientific_name && <span className="italic text-ocean-blue"> ({species.scientific_name})</span>}
                      {species.source_ref && <span className="ml-1 text-[10px] text-ocean-muted">[{species.source_ref}]</span>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sightings.map((sighting) => {
              const contrib = typeof sighting.contribution === "object" ? sighting.contribution : null;
              const user = sighting.contributor || (contrib?.user ? resolveName(contrib.user) : "");
              const village = sighting.village_name || (contrib?.village ? resolveStr(contrib.village) : "");
              const gallery = getGallery(sighting);
              const speciesName = getSpeciesName(sighting);
              return (
                <Card key={sighting.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  {gallery.length > 0 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setLightbox({ images: gallery, index: 0 })}
                        className="block w-full cursor-zoom-in"
                        aria-label={`View ${speciesName} photos`}
                      >
                        <img src={gallery[0].src} alt={speciesName} className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20">
                          <span className="opacity-0 hover:opacity-100 transition-opacity rounded-full bg-white/90 p-2 shadow-lg">
                            <Camera className="h-5 w-5 text-ocean-navy" />
                          </span>
                        </div>
                      </button>
                      {gallery.length > 1 && (
                        <span className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-0.5">
                          1/{gallery.length}
                        </span>
                      )}
                      {gallery.length > 1 && (
                        <div className="flex gap-1 p-1 bg-ocean-navy/5 overflow-x-auto">
                          {gallery.map((img, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setLightbox({ images: gallery, index })}
                              className="shrink-0 rounded cursor-zoom-in"
                              aria-label={`View photo ${index + 1}`}
                            >
                              <img
                                src={img.src}
                                alt={`${speciesName} ${index + 1}`}
                                className={`h-12 w-16 object-cover rounded ${index === 0 ? "ring-2 ring-ocean-blue" : "opacity-70 hover:opacity-100"}`}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-ocean-coral/10 to-ocean-blue/10 h-48 flex flex-col items-center justify-center gap-1 px-4 text-center">
                      <Camera className="h-10 w-10 text-ocean-coral/30" />
                      <p className="text-sm font-medium text-ocean-navy">{village || "Marine life sighting"}</p>
                      <p className="text-xs text-ocean-muted">
                        {sighting.sighting_date ? new Date(sighting.sighting_date).toLocaleDateString() : "Photo pending"}
                      </p>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-ocean-navy text-lg">
                        <Link href={`/sightings/${sighting.slug || sighting.id}`} className="hover:text-ocean-blue transition-colors">
                          {speciesName}
                        </Link>
                      </h3>
                      {sighting.number_observed > 1 && <Badge variant="secondary">×{sighting.number_observed}</Badge>}
                    </div>
                    {sighting.ai_species_suggestion && sighting.ai_confidence && (
                      <p className="text-xs text-ocean-blue mb-2">🤖 AI: {sighting.ai_species_suggestion} ({(sighting.ai_confidence * 100).toFixed(0)}% confidence)</p>
                    )}
                    {sighting.notes ? (
                      <RichContent content={sighting.notes} className="text-sm mb-3 line-clamp-3" />
                    ) : (
                      <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-3">
                        {sightingFallbackText({
                          contributor: user,
                          village_name: village,
                          sighting_date: sighting.sighting_date,
                        })}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm text-ocean-text-secondary mb-3">
                      {sighting.category_name && <Badge variant="secondary">🗂 {sighting.category_name}</Badge>}
                      {sighting.behavior && sighting.behavior !== "unknown" && (
                        <Badge variant="secondary">{sighting.behavior}</Badge>
                      )}
                      {sighting.sea_condition && <Badge variant="secondary">🌊 {sighting.sea_condition}</Badge>}
                      {sighting.weather && <Badge variant="secondary">☁️ {sighting.weather}</Badge>}
                      {(sighting.documents?.length ?? 0) > 0 && (
                        <Badge variant="secondary">📄 {sighting.documents!.length} doc{sighting.documents!.length > 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-ocean-text-secondary pt-3 border-t border-ocean-border flex-wrap">
                      {user && <span className="flex items-center gap-1"><User className="h-3 w-3" />{user}</span>}
                      {village && <LocationDisplay name={village} showCoords={false} size="sm" />}
                      {sighting.sighting_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(sighting.sighting_date).toLocaleDateString()}</span>}
                    </div>
                    <Link
                      href={`/sightings/${sighting.slug || sighting.id}`}
                      className="mt-3 inline-flex items-center justify-center gap-2 rounded-md border border-ocean-border px-3 py-2 text-sm font-medium text-ocean-blue hover:bg-ocean-blue hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View full details
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
            {sightings.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Camera className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
                <p className="text-lg text-ocean-text-secondary mb-4">
                  {activeCategory ? "No sightings in this category yet." : "No sightings yet. Be the first to report!"}
                </p>
                <Button onClick={handleSubmitSighting}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Sighting Contribution
                </Button>
              </div>
            )}
          </div>
          {lightbox && (
            <ImageLightbox
              images={lightbox.images}
              index={lightbox.index}
              onClose={() => setLightbox(null)}
              onNavigate={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
