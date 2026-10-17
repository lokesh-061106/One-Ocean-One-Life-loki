"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Clock, User, Share2, CheckCircle, X, AlertCircle, Info } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { events, getVillage } from "@/lib/data";
import { fetchCms, resolveName, resolveStr, isUUID, resolveUserName, resolveVillageName, ApiEvent } from "@/lib/api-helpers";
import { RichContent, stripHtml } from "@/components/ui/rich-content";

const DEFAULT_COORDS = { lat: 10.7656, lng: 79.842 };

function parsePoint(value: unknown): { lat: number; lng: number } | null {
  if (!value) return null;
  let point = value;
  if (typeof point === "string") {
    const trimmed = point.trim();
    if (!trimmed.startsWith("{")) return null;
    try {
      point = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  const geo = point as { type?: string; coordinates?: number[] };
  if (geo?.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
    return { lng: geo.coordinates[0], lat: geo.coordinates[1] };
  }
  return null;
}

function isPlainTextLocation(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !value.trim().startsWith("{");
}

const typeColors: Record<string, string> = {
  cleanup: "bg-ocean-green text-white",
  workshop: "bg-ocean-blue text-white",
  research: "bg-ocean-coral text-white",
  awareness: "bg-ocean-warning text-white",
  fishing_knowledge: "bg-ocean-navy text-white",
  community_meeting: "bg-ocean-info text-white",
  education: "bg-ocean-green text-white",
  tourism: "bg-ocean-blue text-white",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [resolvedOrganizer, setResolvedOrganizer] = useState<string>("");
  const [resolvedVillage, setResolvedVillage] = useState<string>("");

  const showToast = (type: Toast["type"], message: string) => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
  };

  useEffect(() => {
    async function load() {
      const data = await fetchCms<ApiEvent>(`/community/events/${id}/`);
      const ev = data ?? (events.find(e => e.id === id) as any as ApiEvent) ?? null;
      setEvent(ev);
      setLoading(false);

      if (ev) {
        if (ev.organizer_name) {
          setResolvedOrganizer(ev.organizer_name);
        } else if (isUUID(ev.organizer)) {
          resolveUserName(ev.organizer).then(setResolvedOrganizer);
        } else {
          setResolvedOrganizer(resolveName(ev.organizer));
        }
        if (ev.village_name) {
          setResolvedVillage(ev.village_name);
        } else if (isUUID(ev.village)) {
          resolveVillageName(ev.village).then(setResolvedVillage);
        } else {
          setResolvedVillage(resolveStr(ev.village));
        }
      }
    }
    load();
  }, [id]);

  const handleJoin = async () => {
    if (joined) return;
    const token = localStorage.getItem("o3l_access_token");
    if (!token) {
      showToast("info", "Please log in to register for this event.");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`${API}/community/events/${id}/join/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setJoined(true);
        showToast("success", "Successfully registered for this event!");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err.detail || err.message || "Failed to register. You may already be registered.");
      }
    } catch {
      showToast("error", "Failed to connect to server. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = event?.title || "O3L Event";
    const shareText = stripHtml(event?.description) || "Check out this event on O3L";
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("success", "Event link copied to clipboard!");
      } catch {
        prompt("Copy this link:", shareUrl);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-ocean-navy text-lg animate-pulse">Loading event...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ocean-navy mb-4">Event Not Found</h1>
          <Link href="/events" className="text-ocean-blue hover:underline">Back to Events</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const eventType = (event as any).event_type || (event as any).type;
  const participantCount = (event as any).participant_count ?? (event as any).participants_count ?? 0;
  const maxParticipants = event.max_participants ?? 0;
  const organizerName = resolvedOrganizer || resolveName(event.organizer);
  const villageName = resolvedVillage || resolveStr(event.village);
  const capacityPercent = maxParticipants > 0 ? Math.round((participantCount / maxParticipants) * 100) : 0;
  const eventLocation =
    (event as any).location_name ||
    (isPlainTextLocation((event as any).location) ? (event as any).location : "") ||
    villageName;
  const endDate = event.end_date || '';
  const point = parsePoint((event as any).location);
  const lat = point?.lat ?? DEFAULT_COORDS.lat;
  const lng = point?.lng ?? DEFAULT_COORDS.lng;

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero bare className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/events" className="inline-flex items-center gap-2 text-ocean-sand hover:text-white mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={typeColors[eventType]}>{eventType.replace(/_/g, ' ')}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{event.title}</h1>
            <RichContent content={event.description} className="text-lg text-ocean-sand max-w-3xl on-dark" />
          </div>
        </PageHero>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-ocean-text-secondary">
                    <Calendar className="h-5 w-5 text-ocean-blue" />
                    <div><p className="font-medium text-ocean-navy">{event.start_date.split('T')[0]}</p><p className="text-sm">Start Date</p></div>
                  </div>
                  <div className="flex items-center gap-3 text-ocean-text-secondary">
                    <Clock className="h-5 w-5 text-ocean-blue" />
                    <div><p className="font-medium text-ocean-navy">{event.start_date.split('T')[1]?.slice(0,5)} - {endDate.split('T')[1]?.slice(0,5)}</p><p className="text-sm">Time</p></div>
                  </div>
                  <div className="flex items-center gap-3 text-ocean-text-secondary">
                    <MapPin className="h-5 w-5 text-ocean-blue" />
                    <div><p className="font-medium text-ocean-navy">{eventLocation || "To be announced"}</p>{villageName && villageName !== eventLocation && <p className="text-sm">{villageName}</p>}</div>
                  </div>
                  <div className="flex items-center gap-3 text-ocean-text-secondary">
                    <Users className="h-5 w-5 text-ocean-blue" />
                    <div><p className="font-medium text-ocean-navy">{participantCount} / {maxParticipants} participants</p><p className="text-sm">{maxParticipants - participantCount} spots remaining</p></div>
                  </div>
                  {organizerName && (
                    <div className="flex items-center gap-3 text-ocean-text-secondary">
                      <User className="h-5 w-5 text-ocean-blue" />
                      <div><p className="font-medium text-ocean-navy">{organizerName}</p><p className="text-sm">Organizer</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>About This Event</CardTitle></CardHeader>
                <CardContent>
                  <RichContent content={event.description} className="text-ocean-text-secondary leading-relaxed" />
                  <p className="text-ocean-text-secondary leading-relaxed mt-4">
                    This event is organized as part of O3L&apos;s community engagement program. Join us to learn, share, and contribute to ocean conservation efforts in Tamil Nadu. All community members are welcome to participate.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-2 border-ocean-blue">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-ocean-navy mb-4">Join This Event</h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1"><span className="text-ocean-text-secondary">Capacity</span><span className="font-medium text-ocean-blue">{capacityPercent}%</span></div>
                    <div className="h-3 bg-ocean-light rounded-full overflow-hidden">
                      <div className="h-full bg-ocean-green rounded-full" style={{ width: `${capacityPercent}%` }} />
                    </div>
                    <p className="text-xs text-ocean-muted mt-1">{maxParticipants - participantCount} spots left</p>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleJoin} disabled={joining || joined}>
                    {joined ? <><CheckCircle className="mr-2 h-4 w-4" />Registered</> : joining ? "Registering..." : "Register Now"}
                  </Button>
                  <Button className="w-full mt-2" variant="outline" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" />Share Event</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-hidden h-48 border border-ocean-light">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.03}%2C${lng + 0.05}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      title="Event Location"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-ocean-navy">{eventLocation || villageName}</p>
                    <p className="text-xs text-ocean-text-secondary">{villageName ? `${villageName}, Tamil Nadu` : "India"}</p>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ocean-blue hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Open in Maps ↗
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[280px] animate-slide-in ${
              toast.type === "success" ? "bg-ocean-green" :
              toast.type === "error" ? "bg-ocean-coral" :
              "bg-ocean-blue"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> :
             toast.type === "error" ? <AlertCircle className="h-5 w-5 shrink-0" /> :
             <Info className="h-5 w-5 shrink-0" />}
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
