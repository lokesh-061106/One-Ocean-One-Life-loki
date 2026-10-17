"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, MapPin, User, Calendar, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicContributions } from "@/features/contributions";
import { mediaUrl } from "@/lib/api-helpers";
import { useAuth } from "@/components/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Contribution } from "@/types";

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "marine_sighting", label: "Sighting" },
  { value: "ocean_sound", label: "Sound" },
  { value: "fish_catch", label: "Fish Catch" },
  { value: "observation", label: "Observation" },
  { value: "education_post", label: "Education" },
  { value: "local_knowledge", label: "Guide" },
  { value: "event", label: "Event" },
  { value: "beach_cleanup", label: "Clean-up" },
];

const TYPE_BADGES: Record<string, string> = {
  observation: "bg-ocean-blue/10 text-ocean-blue",
  marine_sighting: "bg-ocean-blue/10 text-ocean-blue",
  ocean_sound: "bg-ocean-coral/10 text-ocean-coral",
  fish_catch: "bg-ocean-green/10 text-ocean-green",
  education_post: "bg-ocean-green/10 text-ocean-green",
  local_knowledge: "bg-ocean-warning/10 text-ocean-warning",
  event: "bg-ocean-blue/10 text-ocean-blue",
  beach_cleanup: "bg-ocean-green/10 text-ocean-green",
};

function firstImage(c: Contribution): string | null {
  const img = (c.media || []).find((m) => m.kind === "image");
  return img ? mediaUrl(img.url) : null;
}

export default function ContributionsPublicPage() {
  const router = useRouter();
  const { user } = useAuth();
  const mounted = useHydrated();
  const [activeType, setActiveType] = useState("all");
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSubmitClick = () => {
    if (mounted && user) {
      router.push("/dashboard/contributions");
    } else {
      router.push("/login?next=/dashboard/contributions");
    }
  };

  useEffect(() => {
    let cancelled = false;
    getPublicContributions(activeType === "all" ? undefined : activeType).then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeType]);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero
          badge={<Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Community</Badge>}
          title="Community Contributions"
          subtitle="Verified observations, sightings, sounds, education posts and guides shared by coastal communities."
        >
          <Button
            onClick={handleSubmitClick}
            className="mt-6 bg-white text-ocean-navy hover:bg-white/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Submit Contribution
          </Button>
        </PageHero>

        <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
          <div className="flex flex-wrap gap-2">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveType(tab.value);
                  setLoading(true);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeType === tab.value
                    ? "bg-ocean-navy text-white"
                    : "bg-white text-ocean-navy border border-ocean-border hover:border-ocean-blue"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-16 text-ocean-text-secondary">Loading contributions...</div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-16 text-ocean-text-secondary">
              No approved contributions in this category yet.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((c) => {
              const img = firstImage(c);
              return (
                <Link
                  key={c.id}
                  href={`/contributions/${c.slug || c.id}`}
                  className="bg-white rounded-xl overflow-hidden border border-ocean-border hover:shadow-lg transition-shadow group"
                >
                  <div className="h-44 bg-ocean-navy/10 relative overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ocean-muted">
                        <Award className="h-10 w-10" />
                      </div>
                    )}
                    <Badge className={`absolute top-3 left-3 ${TYPE_BADGES[c.type] || "bg-white/90 text-ocean-navy"}`}>
                      {c.type_display || c.type}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-2">
                    <h2 className="font-semibold text-ocean-navy line-clamp-2 group-hover:text-ocean-blue transition-colors">
                      {c.title || "Untitled contribution"}
                    </h2>
                    {c.notes && (
                      <p className="text-sm text-ocean-text-secondary line-clamp-2">{c.notes}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-ocean-text-secondary pt-1">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {c.author_display || c.user_name || "Community"}
                      </span>
                      {c.village_name && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {c.village_name}
                        </span>
                      )}
                      {c.verified_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {c.verified_at.split("T")[0]}
                        </span>
                      )}
                      {c.points > 0 && (
                        <span className="ml-auto font-semibold text-ocean-blue">+{c.points} pts</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
