"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Calendar,
  Clock,
  Eye,
  FileText,
  Share2,
  Sparkles,
  User,
  Waves,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCms, mediaUrl, resolveName, resolveStr, sightingFallbackText } from "@/lib/api-helpers";
import { LocationDisplay } from "@/components/location-display";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import { RichContent, stripHtml } from "@/components/ui/rich-content";
import { DocumentPopup, formatFileSize } from "@/components/ui/document-popup";

interface SightingImage {
  id: string;
  image: string;
  caption?: string | null;
}

interface SightingDoc {
  id: string;
  document: string;
  name: string;
  file_type: string;
  file_size: number;
  sort_order?: number;
}

interface SightingDetail {
  id: string;
  species: string | null;
  species_name?: string | null;
  category: string | null;
  category_name?: string | null;
  status?: string;
  contributor?: string;
  village_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ai_species_suggestion: string;
  ai_confidence: number | null;
  number_observed: number;
  behavior: string;
  sea_condition: string;
  weather: string;
  notes: string;
  sighting_date: string | null;
  sighting_time: string | null;
  photo: string | null;
  video: string | null;
  images: SightingImage[];
  documents?: SightingDoc[];
  created_at?: string;
}

export default function SightingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sighting, setSighting] = useState<SightingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  const [openDoc, setOpenDoc] = useState<SightingDoc | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchCms<SightingDetail>(`/sightings/${slug}/`);
      setSighting(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!openDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDoc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDoc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-ocean-navy text-lg animate-pulse">Loading sighting...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!sighting) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ocean-navy mb-4">Sighting Not Found</h1>
          <Link href="/sightings" className="text-ocean-blue hover:underline">
            Back to Sightings
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const gallery: LightboxImage[] = [
    ...(sighting.photo ? [{ src: mediaUrl(sighting.photo), caption: getSpeciesName(sighting) }] : []),
    ...(sighting.images ?? []).map((img) => ({ src: mediaUrl(img.image), caption: img.caption })),
  ];

  const speciesName = getSpeciesName(sighting);
  const hasCoords =
    sighting.latitude != null && sighting.longitude != null && sighting.latitude !== 0 && sighting.longitude !== 0;
  const user = sighting.contributor ? resolveName(sighting.contributor) : "";
  const village = sighting.village_name ? resolveStr(sighting.village_name) : "";

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = stripHtml(sighting.notes).slice(0, 200) || `Marine sighting: ${speciesName}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${speciesName} — Marine Sighting`, text: shareText, url: shareUrl });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        prompt("Copy this link:", shareUrl);
      }
    }
  };

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        {/* Hero */}
        <PageHero bare className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/sightings"
              className="inline-flex items-center gap-2 text-ocean-sand hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sightings
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {sighting.category_name && <Badge className="bg-white/20 text-white border-white/30">🗂 {sighting.category_name}</Badge>}
              {sighting.status && <Badge className="bg-white/20 text-white border-white/30">{sighting.status}</Badge>}
              {sighting.number_observed > 1 && <Badge className="bg-white/20 text-white border-white/30">×{sighting.number_observed} observed</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{speciesName}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-ocean-sand text-sm">
              {sighting.sighting_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(sighting.sighting_date).toLocaleDateString()}
                  {sighting.sighting_time ? ` · ${String(sighting.sighting_time).slice(0, 5)}` : ""}
                </span>
              )}
              {user && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {user}
                </span>
              )}
              {village && (
                <LocationDisplay
                  name={village}
                  lat={sighting.latitude ?? null}
                  lng={sighting.longitude ?? null}
                  showCoords={true}
                  size="sm"
                  className="text-ocean-sand [&_span]:text-ocean-sand"
                />
              )}
            </div>
          </div>
        </PageHero>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-ocean-blue" />
                    Photos
                    {gallery.length > 1 && <span className="text-sm font-normal text-ocean-text-secondary">{gallery.length} images</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gallery.length > 0 ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setLightbox({ images: gallery, index: 0 })}
                        className="block w-full cursor-zoom-in group relative"
                        aria-label={`View ${speciesName} photos`}
                      >
                        <img
                          src={gallery[0].src}
                          alt={speciesName}
                          className="w-full max-h-[480px] object-contain bg-ocean-navy/5 rounded-lg"
                        />
                        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white text-xs px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view full size
                        </span>
                      </button>
                      {gallery.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
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
                                className={`h-20 w-28 object-cover rounded ${
                                  index === 0 ? "ring-2 ring-ocean-blue" : "opacity-75 hover:opacity-100"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-ocean-coral/10 to-ocean-blue/10 h-64 flex flex-col items-center justify-center rounded-lg gap-1 px-4 text-center">
                      <Camera className="h-12 w-12 text-ocean-coral/30 mb-1" />
                      <p className="text-sm font-medium text-ocean-navy">{village || "Marine life sighting"}</p>
                      <p className="text-xs text-ocean-muted">
                        {sighting.sighting_date
                          ? `Recorded ${new Date(sighting.sighting_date).toLocaleDateString()}`
                          : "No photos yet"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents */}
              {(sighting.documents?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-ocean-blue" />
                      Documents
                      <span className="text-sm font-normal text-ocean-text-secondary">
                        {sighting.documents!.length} file{sighting.documents!.length > 1 ? "s" : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-ocean-border">
                      {sighting.documents!.map((doc) => (
                        <li key={doc.id}>
                          <button
                            type="button"
                            onClick={() => setOpenDoc(doc)}
                            className="w-full flex items-center gap-3 py-3 text-left group hover:bg-ocean-foam rounded-lg px-2 -mx-2 transition-colors"
                          >
                            <span className="shrink-0 rounded-lg bg-ocean-blue/10 p-2.5 group-hover:bg-ocean-blue/20 transition-colors">
                              <FileText className="h-5 w-5 text-ocean-blue" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-ocean-navy truncate group-hover:text-ocean-blue transition-colors">
                                {doc.name}
                              </span>
                              <span className="block text-xs text-ocean-muted">
                                {doc.file_type.toUpperCase()} · {formatFileSize(doc.file_size)}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-medium text-ocean-blue opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to view ↗
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-ocean-muted mt-3">
                      Documents open in a viewer popup — no download required.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Notes — full text */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Sighting</CardTitle>
                </CardHeader>
                <CardContent>
                  {sighting.notes ? (
                    <RichContent content={sighting.notes} className="text-ocean-text-secondary leading-relaxed" />
                  ) : (
                    <p className="text-ocean-text-secondary leading-relaxed">
                      {sightingFallbackText({
                        contributor: user,
                        village_name: village,
                        sighting_date: sighting.sighting_date,
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-2 border-ocean-blue">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Details
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="mr-1.5 h-4 w-4" />
                      {copied ? "Copied!" : "Share"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {sighting.behavior && sighting.behavior !== "unknown" && (
                    <DetailRow icon={<Waves className="h-4 w-4 text-ocean-blue" />} label="Behavior" value={sighting.behavior} />
                  )}
                  {sighting.sea_condition && (
                    <DetailRow icon={<Waves className="h-4 w-4 text-ocean-blue" />} label="Sea condition" value={sighting.sea_condition} />
                  )}
                  {sighting.weather && (
                    <DetailRow icon={<Sparkles className="h-4 w-4 text-ocean-blue" />} label="Weather" value={sighting.weather} />
                  )}
                  <DetailRow
                    icon={<Eye className="h-4 w-4 text-ocean-blue" />}
                    label="Number observed"
                    value={String(sighting.number_observed ?? 1)}
                  />
                  {sighting.sighting_date && (
                    <DetailRow
                      icon={<Calendar className="h-4 w-4 text-ocean-blue" />}
                      label="Sighted on"
                      value={`${new Date(sighting.sighting_date).toLocaleDateString()}${
                        sighting.sighting_time ? ` at ${String(sighting.sighting_time).slice(0, 5)}` : ""
                      }`}
                    />
                  )}
                  {sighting.ai_species_suggestion && (
                    <DetailRow
                      icon={<Sparkles className="h-4 w-4 text-ocean-blue" />}
                      label="AI suggestion"
                      value={`${sighting.ai_species_suggestion}${
                        sighting.ai_confidence ? ` (${(sighting.ai_confidence * 100).toFixed(0)}%)` : ""
                      }`}
                    />
                  )}
                  {user && <DetailRow icon={<User className="h-4 w-4 text-ocean-blue" />} label="Observer" value={user} />}
                  {sighting.status && <DetailRow icon={<Eye className="h-4 w-4 text-ocean-blue" />} label="Status" value={sighting.status} />}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasCoords ? (
                    <>
                      <div className="rounded-xl overflow-hidden h-48 border border-ocean-light">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                            (sighting.longitude ?? 0) - 0.05
                          }%2C${(sighting.latitude ?? 0) - 0.03}%2C${(sighting.longitude ?? 0) + 0.05}%2C${
                            (sighting.latitude ?? 0) + 0.03
                          }&layer=mapnik&marker=${sighting.latitude}%2C${sighting.longitude}`}
                          className="w-full h-full border-0"
                          loading="lazy"
                          title="Sighting Location"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        {village && <p className="text-sm font-medium text-ocean-navy">{village}</p>}
                        <p className="text-xs text-ocean-text-secondary">
                          {sighting.latitude?.toFixed(4)}, {sighting.longitude?.toFixed(4)}
                        </p>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${sighting.latitude}&mlon=${sighting.longitude}#map=14/${sighting.latitude}/${sighting.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-ocean-blue hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          Open in Maps ↗
                        </a>
                      </div>
                    </>
                  ) : village ? (
                    <div className="flex items-center gap-2 text-ocean-text-secondary">
                      <LocationDisplay name={village} lat={null} lng={null} showCoords={false} size="md" />
                    </div>
                  ) : (
                    <p className="text-ocean-muted italic text-sm">No location recorded.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}

      {openDoc && <DocumentPopup doc={openDoc} onClose={() => setOpenDoc(null)} />}
    </div>
  );
}

function getSpeciesName(sighting: SightingDetail): string {
  if (sighting.species_name) return sighting.species_name;
  if (sighting.ai_species_suggestion) return sighting.ai_species_suggestion;
  if (typeof sighting.species === "object" && sighting.species) {
    return (sighting.species as any).common_name || (sighting.species as any).scientific_name || "Unidentified Marine Life";
  }
  return "Unidentified Marine Life";
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ocean-muted">{label}</p>
        <p className="font-medium text-ocean-navy break-words">{value}</p>
      </div>
    </div>
  );
}
