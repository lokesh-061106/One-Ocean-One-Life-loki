"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Clock, Eye, Heart, Share2, BookOpen, Tag, ZoomIn } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { educationPosts, getEducationCategory, getUser, getVillage } from "@/lib/data";
import { fetchCms, resolveName, resolveStr, ApiEducationPost } from "@/lib/api-helpers";
import { RichContent, stripHtml } from "@/components/ui/rich-content";
import { ImageLightbox, LightboxImage } from "@/components/ui/image-lightbox";
import { LocationDisplay } from "@/components/location-display";

const typeColors: Record<string, string> = {
  story: "bg-ocean-blue text-white",
  tutorial: "bg-ocean-green text-white",
  blog: "bg-ocean-coral text-white",
  experience: "bg-ocean-warning text-white",
  knowledge: "bg-ocean-navy text-white",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function EducationPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<ApiEducationPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchCms<ApiEducationPost>(`/education/posts/${slug}/`);
      setPost(
        data ??
        (educationPosts.find((p) => (p as any).slug === slug || p.id === slug) as any as ApiEducationPost) ??
        null
      );
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-ocean-navy text-lg animate-pulse">Loading post...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ocean-navy mb-4">Post Not Found</h1>
          <Link href="/education" className="text-ocean-blue hover:underline">Back to Education</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const catId = typeof post.category === 'object' && post.category !== null
    ? post.category.id
    : typeof post.category === 'string' ? post.category : (post as any).category_id;
  const category = typeof post.category === 'object' && post.category !== null
    ? post.category
    : getEducationCategory(catId);
  const authorObj = typeof post.author === 'object' && post.author !== null ? post.author : null;
  const authorName =
    resolveName(post.author) ||
    post.author_name ||
    ((post as any).author_id ? getUser((post as any).author_id)?.first_name : "") ||
    "";
  const authorRole = authorObj?.role ? authorObj.role.replace(/_/g, " ").toLowerCase() : "";
  const villageName =
    resolveStr(post.village) ||
    post.village_name ||
    ((post as any).village_id ? getVillage((post as any).village_id)?.name : "") ||
    "";
  const plainText = stripHtml(post.content);
  const readTime = Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200)) + " min read";
  const relatedPosts = educationPosts.filter((p) => p.category_id === catId && p.id !== post.id).slice(0, 3);
  const lightboxImages: LightboxImage[] = [
    ...(post.image ? [{ src: post.image, caption: post.title }] : []),
    ...(post.images ?? []).map((img) => ({ src: img.image, caption: img.caption })),
  ];
  const galleryOffset = post.image ? 1 : 0;

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero bare className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/education" className="inline-flex items-center gap-2 text-ocean-sand hover:text-white mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Education
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={typeColors[post.post_type]}>{post.post_type}</Badge>
              {category && <Badge variant="secondary" className="bg-white/20 text-white">{category.icon} {category.name}</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-ocean-sand text-sm">
              {authorName && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-medium text-sm">{authorName.charAt(0)}</div>
                  <span>{authorName}</span>
                </div>
              )}
              {villageName && <LocationDisplay name={villageName} showCoords={false} size="md" />}
              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{post.created_at.split('T')[0]}</div>
              <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{readTime}</div>
            </div>
          </div>
        </PageHero>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  {post.image && (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(0)}
                      className="group relative mb-8 block w-full cursor-zoom-in overflow-hidden rounded-xl"
                      aria-label="View cover image"
                    >
                      <img src={post.image} alt={post.title} className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-80" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                        <span className="translate-y-2 rounded-full bg-white/90 p-3 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
                          <ZoomIn className="h-6 w-6 text-ocean-navy" />
                        </span>
                      </div>
                    </button>
                  )}
                  <div className="prose prose-lg max-w-none">
                    <RichContent content={post.content} className="text-ocean-text-secondary leading-relaxed" />
                  </div>

                  {post.images && post.images.length > 0 && (
                    <>
                      <Separator className="my-8" />
                      <h2 className="text-xl font-bold text-ocean-navy mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" /> Gallery
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {post.images!.map((img, i) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setLightboxIndex(galleryOffset + i)}
                            className="group block w-full text-left cursor-zoom-in"
                            aria-label={`View image ${i + 1}`}
                          >
                            <div className="overflow-hidden rounded-lg">
                              <img
                                src={img.image}
                                alt={img.caption || post.title}
                                className="h-40 md:h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            {img.caption && (
                              <p className="text-xs text-ocean-text-secondary mt-2 group-hover:text-ocean-navy transition-colors">
                                {img.caption}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator className="my-8" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm"><Heart className="mr-1 h-4 w-4" />{post.reactions_count}</Button>
                      <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" />{post.views_count}</Button>
                    </div>
                    <Button variant="outline" size="sm"><Share2 className="mr-1 h-4 w-4" />Share</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>About the Author</CardTitle></CardHeader>
                <CardContent>
                  {authorName ? (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-ocean-blue flex items-center justify-center text-white font-bold">{authorName.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-semibold text-ocean-navy">{authorName}</p>
                        {authorRole && <p className="text-xs text-ocean-text-secondary capitalize">{authorRole}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-ocean-text-secondary mb-3">Community member</p>
                  )}
                  {authorObj?.is_verified && (
                    <Badge variant="secondary" className="bg-ocean-green/10 text-ocean-green mb-3">Verified Member</Badge>
                  )}
                  {villageName && (
                    <div className="text-sm text-ocean-text-secondary">
                      <LocationDisplay name={villageName} showCoords={false} size="sm" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {relatedPosts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Related Posts</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {relatedPosts.map((p) => (
                      <Link key={p.id} href={`/education/${(p as any).slug || p.id}`} className="block p-3 rounded-lg hover:bg-ocean-light transition-colors">
                        <Badge className={`${typeColors[p.post_type]} text-xs`}>{p.post_type}</Badge>
                        <p className="font-medium text-ocean-navy text-sm mt-2 line-clamp-2">{p.title}</p>
                        <p className="text-xs text-ocean-text-secondary mt-1">{p.readTime} read</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      <Footer />
    </div>
  );
}
