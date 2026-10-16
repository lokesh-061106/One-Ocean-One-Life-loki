"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, Eye, Heart, User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { educationPosts, educationCategories, getEducationCategory, getUser, getVillage } from "@/lib/data";
import { fetchCmsList, resolveName, resolveStr, type ApiEducationPost, type ApiEducationCategory } from "@/lib/api-helpers";
import { stripHtml } from "@/components/ui/rich-content";
import { LocationDisplay } from "@/components/location-display";

const typeColors: Record<string, string> = {
  story: "bg-ocean-blue/10 text-ocean-blue",
  tutorial: "bg-ocean-green/10 text-ocean-green",
  blog: "bg-ocean-coral/10 text-ocean-coral",
  experience: "bg-ocean-warning/10 text-ocean-warning",
  knowledge: "bg-ocean-navy/10 text-ocean-navy",
};

interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  image: string;
  post_type: string;
  category_id: string;
  category_name: string;
  author_name: string;
  village_name: string;
  reactions_count: number;
  views_count: number;
  readTime: string;
  created_at: string;
}

function mapPost(api: ApiEducationPost): Post {
  const cat = typeof api.category === "object" ? api.category : null;
  const plain = stripHtml(api.content);
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(wordCount / 200));
  return {
    id: api.id,
    slug: api.slug || api.id,
    title: api.title,
    content: plain,
    image: api.image || "",
    post_type: api.post_type,
    category_id: cat?.id || "",
    category_name: resolveStr(api.category),
    author_name: api.author_name || resolveName(api.author),
    village_name: api.village_name || resolveStr(api.village),
    reactions_count: api.reactions_count,
    views_count: api.views_count,
    readTime: `${readMin} min`,
    created_at: api.created_at,
  };
}

function mapCategory(api: ApiEducationCategory) {
  return { id: api.id, name: api.name, name_tamil: api.name_tamil, slug: api.slug, icon: api.icon, count: api.post_count ?? 0 };
}

export default function EducationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [posts, setPosts] = useState<Post[]>(() =>
    educationPosts.map((p) => {
      const cat = getEducationCategory(p.category_id);
      const author = getUser(p.author_id);
      const village = getVillage(p.village_id);
      return {
        id: p.id,
        slug: (p as any).slug || p.id,
        title: p.title,
        content: stripHtml(p.content),
        image: "",
        post_type: p.post_type,
        category_id: p.category_id,
        category_name: cat?.name || "",
        author_name: author?.first_name || "",
        village_name: village?.name || "",
        reactions_count: p.reactions_count,
        views_count: p.views_count,
        readTime: p.readTime,
        created_at: p.created_at,
      };
    })
  );
  const [categories, setCategories] = useState(educationCategories);

  useEffect(() => {
    async function load() {
      const [apiPosts, apiCats] = await Promise.all([
        fetchCmsList<ApiEducationPost>("/education/posts/"),
        fetchCmsList<ApiEducationCategory>("/education/categories/"),
      ]);
      if (apiPosts.length > 0) setPosts(apiPosts.map(mapPost));
      if (apiCats.length > 0) setCategories(apiCats.map(mapCategory));
    }
    load();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || post.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[#041c33] text-white py-14 sm:py-18 border-b border-sky-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#021120] via-[#052647] to-[#073a66] opacity-90 pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-400/15 text-sky-200 border border-sky-400/30 mb-4 tracking-wide uppercase">
              Coastal Ocean Knowledge Bank
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Ocean Education & Indigenous Lore
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Generational navigation wisdom, traditional marine ecology, tide lore, and conservation practice recorded directly by coastal fishers and oceanographers.
            </p>
          </div>
        </section>
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
              <Input placeholder="Search posts, navigation lore, traditional fishers..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant={selectedCategory === "All" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("All")}>All</Button>
            {categories.map((cat) => (
              <Button key={cat.id} variant={selectedCategory === cat.name ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.name)}>
                {cat.name}<Badge variant="secondary" className="ml-2 bg-white/20">{cat.count}</Badge>
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/education/${post.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                  {post.image ? (
                    <img src={post.image} alt={post.title} className="h-32 w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="bg-gradient-to-br from-ocean-blue/10 to-ocean-green/10 h-32 flex items-center justify-center"><BookOpen className="h-12 w-12 text-ocean-blue/30" /></div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={typeColors[post.post_type]}>{post.post_type}</Badge>
                      {post.category_name && <Badge variant="secondary">{post.category_name}</Badge>}
                    </div>
                    <h3 className="font-semibold text-ocean-navy mb-2 group-hover:text-ocean-blue transition-colors line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-ocean-text-secondary mb-4 line-clamp-2 flex-1">{post.content.slice(0, 120)}...</p>
                    <div className="flex items-center gap-4 text-sm text-ocean-text-secondary mb-4">
                      {post.author_name && <div className="flex items-center gap-1"><User className="h-4 w-4" />{post.author_name}</div>}
                      {post.village_name && <LocationDisplay name={post.village_name} showCoords={false} size="sm" />}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-ocean-border">
                      <div className="flex items-center gap-4 text-sm text-ocean-text-secondary">
                        <div className="flex items-center gap-1"><Eye className="h-4 w-4" />{post.views_count}</div>
                        <div className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.reactions_count}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-ocean-text-secondary"><Clock className="h-4 w-4" />{post.readTime}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
