"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Calendar, MapPin, User, FileText, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { RichContent } from "@/components/ui/rich-content";
import { getPublicContribution } from "@/features/contributions";
import { mediaUrl } from "@/lib/api-helpers";
import type { Contribution } from "@/types";

export default function ContributionDetailPage() {
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<Contribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.slug) return;
    getPublicContribution(params.slug).then((data) => {
      setItem(data);
      const first = (data?.media || []).find((m) => m.kind === "image");
      setActiveImage(first ? mediaUrl(first.url) : null);
      setLoading(false);
    });
  }, [params?.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-ocean-navy text-lg animate-pulse">Loading contribution...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ocean-navy mb-4">Contribution Not Found</h1>
          <p className="text-ocean-text-secondary mb-4">This contribution is not found or not yet approved.</p>
          <Link href="/contributions" className="text-ocean-blue hover:underline">
            Back to Contributions
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const images = (item.media || []).filter((m) => m.kind === "image");
  const videos = (item.media || []).filter((m) => m.kind === "video");
  const audios = (item.media || []).filter((m) => m.kind === "audio");
  const docs = (item.media || []).filter((m) => m.kind === "document");

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero bare className="py-0 sm:py-0">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/contributions" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4">
              <ArrowLeft className="h-4 w-4" />Back to Contributions
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="bg-white/15 text-white">{item.type_display || item.type}</Badge>
              <Badge className="bg-ocean-green text-white">Verified</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-3">{item.title || "Untitled contribution"}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{item.author_display || item.user_name}</span>
              {item.village_name && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.village_name}</span>
              )}
              {item.verified_at && (
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{item.verified_at.split("T")[0]}</span>
              )}
              {item.points > 0 && (
                <span className="inline-flex items-center gap-1.5 font-semibold"><Award className="h-4 w-4" />+{item.points} points</span>
              )}
            </div>
          </div>
        </PageHero>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {images.length > 0 && (
            <section>
              {activeImage && (
                <div className="rounded-xl overflow-hidden border border-ocean-border bg-white mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeImage} alt={item.title} className="w-full max-h-[420px] object-contain bg-ocean-navy/5" />
                </div>
              )}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveImage(mediaUrl(m.url))}
                      className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === mediaUrl(m.url) ? "border-ocean-blue" : "border-transparent"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(m.url)} alt={m.display_name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {item.notes && (
            <section className="bg-white rounded-xl border border-ocean-border p-5">
              <h2 className="text-sm font-semibold text-ocean-text-secondary uppercase tracking-wide mb-2">Notes</h2>
              <p className="text-ocean-navy whitespace-pre-line">{item.notes}</p>
            </section>
          )}

          {item.description && (
            <section className="bg-white rounded-xl border border-ocean-border p-5">
              <h2 className="text-sm font-semibold text-ocean-text-secondary uppercase tracking-wide mb-2">Description</h2>
              <RichContent content={item.description} />
            </section>
          )}

          {videos.length > 0 && (
            <section className="bg-white rounded-xl border border-ocean-border p-5 space-y-3">
              <h2 className="text-sm font-semibold text-ocean-text-secondary uppercase tracking-wide">Video</h2>
              {videos.map((m) => (
                <video key={m.id} controls className="w-full rounded-lg max-h-[420px] bg-black">
                  <source src={mediaUrl(m.url)} />
                </video>
              ))}
            </section>
          )}

          {audios.length > 0 && (
            <section className="bg-white rounded-xl border border-ocean-border p-5 space-y-3">
              <h2 className="text-sm font-semibold text-ocean-text-secondary uppercase tracking-wide">Audio</h2>
              {audios.map((m) => (
                <div key={m.id}>
                  <p className="text-sm text-ocean-navy mb-1">{m.display_name}</p>
                  <audio controls className="w-full">
                    <source src={mediaUrl(m.url)} />
                  </audio>
                </div>
              ))}
            </section>
          )}

          {docs.length > 0 && (
            <section className="bg-white rounded-xl border border-ocean-border p-5 space-y-2">
              <h2 className="text-sm font-semibold text-ocean-text-secondary uppercase tracking-wide mb-2">Documents</h2>
              {docs.map((m) => (
                <a
                  key={m.id}
                  href={mediaUrl(m.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-ocean-border hover:border-ocean-blue text-ocean-navy"
                >
                  <FileText className="h-5 w-5 text-ocean-blue shrink-0" />
                  <span className="flex-1 truncate text-sm">{m.display_name}</span>
                  <Download className="h-4 w-4 text-ocean-text-secondary" />
                </a>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
