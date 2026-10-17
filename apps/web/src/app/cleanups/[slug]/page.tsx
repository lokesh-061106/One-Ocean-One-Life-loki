"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Users,
  Scale,
  Calendar,
  User,
  MapPin,
  ImageIcon,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import { fetchCms, type ApiBeachCleanup } from "@/lib/api-helpers";
import { authFetch } from "@/lib/auth-fetch";

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-ocean-text-secondary">{label}</p>
        <p className="text-sm font-medium text-ocean-navy">{value}</p>
      </div>
    </div>
  );
}

function PhotoGallery({
  item,
  onRefresh,
}: {
  item: ApiBeachCleanup;
  onRefresh: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  const gallery: LightboxImage[] = (item.photos ?? []).map((photo) => ({
    src: photo.image,
    caption: photo.caption || (photo.uploaded_by_name ? `Photo by ${photo.uploaded_by_name}` : null),
  }));

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setUploading(true);
      try {
        const form = new FormData();
        form.append("image", file);
        const res = await authFetch(`/ecotourism/cleanups/${item.slug}/photos/`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.image?.[0] || body.detail || "Upload failed.");
        }
        onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(photoId: string) {
    setDeletingId(photoId);
    setError(null);
    try {
      const res = await authFetch(`/ecotourism/cleanups/photos/${photoId}/`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not delete photo.");
      }
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete photo.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-ocean-blue" />
          Photos
          <span className="ml-auto text-sm font-normal text-ocean-text-secondary">
            {item.photos?.length ?? 0}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.photos && item.photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {item.photos.map((photo, index) => (
              <figure key={photo.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setLightbox({ images: gallery, index })}
                  aria-label={`View photo ${index + 1}`}
                  className="block w-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.image}
                    alt={photo.caption || `Clean-up photo${photo.uploaded_by_name ? ` by ${photo.uploaded_by_name}` : ""}`}
                    className="w-full h-32 object-cover rounded-lg border border-ocean-border"
                  />
                </button>
                {photo.caption && (
                  <figcaption className="mt-1 text-xs text-ocean-text-secondary line-clamp-2">
                    {photo.caption}
                  </figcaption>
                )}
                {item.can_edit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={deletingId === photo.id}
                    aria-label="Delete photo"
                    className="absolute z-10 top-1.5 right-1.5 rounded-md bg-white/90 p-1.5 text-ocean-coral opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {deletingId === photo.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ocean-border py-10 text-center">
            <ImageIcon className="h-8 w-8 text-ocean-text-secondary/50 mx-auto mb-2" />
            <p className="text-sm text-ocean-text-secondary">No photos have been added yet.</p>
          </div>
        )}

        {item.can_edit && (
          <div className="rounded-lg border border-ocean-border p-4">
            <p className="text-sm font-medium text-ocean-navy mb-2">Add a photo</p>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="cleanup-photo-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-md bg-ocean-blue px-3 py-2 text-sm font-medium text-white hover:bg-ocean-deep transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Choose image"}
              </button>
            </div>
            <p className="mt-2 text-xs text-ocean-text-secondary">
              Photos you add appear in the gallery above.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-ocean-coral">{error}</p>}
      </CardContent>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}
    </Card>
  );
}

export default function CleanupDetailPage() {
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<ApiBeachCleanup | null>(null);
  const [loading, setLoading] = useState(true);
  const slug = params?.slug;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchCms<ApiBeachCleanup>(`/ecotourism/cleanups/${slug}/`).then((data) => {
      if (!cancelled) {
        setItem(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function refresh() {
    if (!slug) return;
    fetchCms<ApiBeachCleanup>(`/ecotourism/cleanups/${slug}/`).then((data) => {
      if (data) setItem(data);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-ocean-navy text-lg animate-pulse">Loading clean-up...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ocean-navy mb-4">Clean-up Not Found</h1>
          <p className="text-ocean-text-secondary mb-4">This clean-up could not be found.</p>
          <Link href="/cleanups" className="text-ocean-blue hover:underline">
            Back to Clean-ups
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero bare className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <Link
              href="/cleanups"
              className="inline-flex items-center gap-2 text-ocean-sand hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clean-ups
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="bg-white/20 text-white border-white/30">🗑 Beach Clean-up</Badge>
              {item.cleanup_date && (
                <Badge className="bg-white/20 text-white border-white/30">
                  {new Date(item.cleanup_date).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-ocean-sand text-sm">
              {item.beach_name && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {item.beach_name}
                </span>
              )}
              {item.organizer_name && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {item.organizer_name}
                </span>
              )}
            </div>
          </div>
        </PageHero>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-ocean-green" />
                    About This Clean-up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {item.description ? (
                    <p className="text-ocean-text-secondary leading-relaxed whitespace-pre-line">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-ocean-text-secondary leading-relaxed">
                      A community beach clean-up{item.beach_name ? ` at ${item.beach_name}` : ""}.
                      {item.participants_count > 0 && ` ${item.participants_count} volunteers took part,`}
                      {item.waste_collected_kg > 0 &&
                        ` collecting ${item.waste_collected_kg} kg of waste from the coast.`}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-ocean-border p-5 text-center">
                      <Users className="h-6 w-6 text-ocean-green mx-auto mb-2" />
                      <p className="text-2xl font-bold text-ocean-navy">{item.participants_count}</p>
                      <p className="text-xs text-ocean-text-secondary">Volunteers</p>
                    </div>
                    <div className="rounded-xl border border-ocean-border p-5 text-center">
                      <Scale className="h-6 w-6 text-ocean-coral mx-auto mb-2" />
                      <p className="text-2xl font-bold text-ocean-navy">{item.waste_collected_kg}</p>
                      <p className="text-xs text-ocean-text-secondary">Kg of waste</p>
                    </div>
                    <div className="rounded-xl border border-ocean-border p-5 text-center">
                      <ImageIcon className="h-6 w-6 text-ocean-blue mx-auto mb-2" />
                      <p className="text-2xl font-bold text-ocean-navy">{item.photos_count}</p>
                      <p className="text-xs text-ocean-text-secondary">Photos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <PhotoGallery item={item} onRefresh={refresh} />
            </div>

            <div className="space-y-6">
              <Card className="border-2 border-ocean-green">
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {item.cleanup_date && (
                    <StatRow
                      icon={<Calendar className="h-4 w-4 text-ocean-green" />}
                      label="Clean-up date"
                      value={new Date(item.cleanup_date).toLocaleDateString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                  )}
                  {item.beach_name && (
                    <StatRow
                      icon={<MapPin className="h-4 w-4 text-ocean-green" />}
                      label="Beach"
                      value={item.beach_name}
                    />
                  )}
                  {item.organizer_name && (
                    <StatRow
                      icon={<User className="h-4 w-4 text-ocean-green" />}
                      label="Organizer"
                      value={item.organizer_name}
                    />
                  )}
                  <StatRow
                    icon={<Users className="h-4 w-4 text-ocean-green" />}
                    label="Participants"
                    value={String(item.participants_count)}
                  />
                  <StatRow
                    icon={<Scale className="h-4 w-4 text-ocean-green" />}
                    label="Waste collected"
                    value={`${item.waste_collected_kg} kg`}
                  />
                  {item.created_at && (
                    <StatRow
                      icon={<Calendar className="h-4 w-4 text-ocean-green" />}
                      label="Recorded on"
                      value={new Date(item.created_at).toLocaleDateString()}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-ocean-text-secondary mb-3">
                    Want to join the next clean-up or record one of your own?
                  </p>
                  <Link
                    href="/contributions"
                    className="block w-full text-center rounded-md border border-ocean-border px-3 py-2 text-sm font-medium text-ocean-green hover:bg-ocean-green hover:text-white transition-colors"
                  >
                    Record a Clean-up
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
