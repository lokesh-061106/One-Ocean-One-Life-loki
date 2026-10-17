"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Calendar, Waves, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchCmsList, mediaUrl } from "@/lib/api-helpers";
import { LocationDisplay } from "@/components/location-display";
import { SoundLibrary } from "@/components/sounds/sound-library";
import { useAuth } from "@/components/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";

interface Sound {
  id: string;
  instrument: string;
  manufacturer: string;
  model_number: string;
  duration_seconds: number | null;
  frequency_range: string;
  depth_meters: number | null;
  written_description: string;
  audio_url: string | null;
  recording_date: string | null;
  contributor: string;
  contributor_name: string;
  village_name: string | null;
  district_name: string | null;
  zone_name: string | null;
  status: string | null;
  member_status: string | null;
  contribution_score: number | null;
  points: number | null;
  latitude: number | null;
  longitude: number | null;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  verified: "success",
  auto_validated: "success",
  submitted: "warning",
  moderator_review: "warning",
};

function humanize(value?: string | null): string {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SoundsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const mounted = useHydrated();
  const [sounds, setSounds] = useState<Sound[]>([]);

  const handleSubmitSound = () => {
    if (mounted && user) {
      router.push("/dashboard/contributions");
    } else {
      router.push("/login?next=/dashboard/contributions");
    }
  };

  useEffect(() => {
    async function load() {
      const data = await fetchCmsList<Sound>("/sounds/");
      setSounds(data);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero
          width="wide"
          badge={<Badge variant="secondary" className="mb-4 bg-sky-950/80 text-amber-300 border-sky-400/40 font-bold tracking-wider uppercase text-xs">Marine Bioacoustics (PAM)</Badge>}
          title="Ocean Sounds & Acoustics"
          subtitle="Explore curated marine acoustic recordings, dolphin echolocations, whale moans, and citizen hydrophone data."
        />

        <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
          <Tabs defaultValue="library">
            <TabsList className="mb-8 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
              <TabsTrigger value="library" className="gap-2 rounded-lg font-bold text-xs">
                <Waves className="h-4 w-4" /> Sound Library
              </TabsTrigger>
              <TabsTrigger value="recordings" className="gap-2 rounded-lg font-bold text-xs">
                <Mic className="h-4 w-4" /> Citizen Recordings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library">
              <SoundLibrary />
            </TabsContent>

            <TabsContent value="recordings">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sounds.map((sound) => {
                  const citizenName = sound.contributor_name || sound.contributor || "Anonymous citizen";
                  const place = [sound.village_name, sound.district_name].filter(Boolean).join(", ");
                  const placeLabel = place || sound.zone_name || "";
                  const hasCoords = sound.latitude != null && sound.longitude != null;
                  const hasStanding = !!sound.member_status || sound.contribution_score != null || !!sound.points;
                  return (
                    <Card key={sound.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Mic className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-ocean-navy">{sound.instrument || "Ocean Recording"}</h3>
                            <p className="text-xs text-ocean-text-secondary">
                              {[sound.manufacturer, sound.model_number].filter(Boolean).join(" ") || "Citizen contribution"}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3 rounded-lg border border-ocean-border bg-ocean-foam p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ocean-navy truncate">{citizenName}</p>
                              {sound.contributor && (
                                <p className="text-xs text-ocean-text-secondary">@{sound.contributor}</p>
                              )}
                            </div>
                            {sound.status && (
                              <Badge variant={STATUS_VARIANT[sound.status] ?? "secondary"}>
                                {humanize(sound.status)}
                              </Badge>
                            )}
                          </div>

                          {placeLabel && (
                            <div className="mt-2">
                              <LocationDisplay
                                name={placeLabel}
                                lat={hasCoords ? sound.latitude : null}
                                lng={hasCoords ? sound.longitude : null}
                                showCoords={true}
                                size="sm"
                              />
                            </div>
                          )}

                          {hasStanding && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {sound.member_status && (
                                <Badge variant="secondary">{humanize(sound.member_status)}</Badge>
                              )}
                              {sound.contribution_score != null && (
                                <Badge variant="outline">Score {sound.contribution_score}</Badge>
                              )}
                              {!!sound.points && <Badge variant="outline">{sound.points} pts</Badge>}
                            </div>
                          )}
                        </div>

                        {sound.written_description && <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-3">{sound.written_description}</p>}
                        {sound.audio_url && (
                          <div className="mb-3">
                            <audio controls preload="none" src={mediaUrl(sound.audio_url)} className="w-full">
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm text-ocean-text-secondary mb-3">
                          {sound.duration_seconds && <Badge variant="secondary">⏱ {sound.duration_seconds}s</Badge>}
                          {sound.depth_meters && <Badge variant="secondary">🌊 {sound.depth_meters}m</Badge>}
                          {sound.frequency_range && <Badge variant="secondary">Hz: {sound.frequency_range}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-ocean-text-secondary pt-3 border-t border-ocean-border">
                          {sound.recording_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(sound.recording_date).toLocaleDateString()}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {sounds.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <Mic className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
                    <p className="text-lg text-ocean-text-secondary mb-4">No recordings yet. Be the first to contribute!</p>
                    <Button onClick={handleSubmitSound}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Sound Contribution
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
