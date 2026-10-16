"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fish, Ruler, Weight, User, MapPin, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCmsList, mediaUrl, type ApiFishCatch } from "@/lib/api-helpers";
import { LocationDisplay } from "@/components/location-display";

const GROUP_LABELS: Record<string, string> = {
  fish: "Fish",
  shark_ray: "Shark & Ray",
  turtle: "Sea Turtle",
  mammal: "Marine Mammal",
  crustacean: "Crustacean",
  mollusc: "Mollusc",
  other: "Other",
};

const GEAR_LABELS: Record<string, string> = {
  gillnet: "Gill net",
  trawl: "Trawl net",
  longline: "Longline",
  handline: "Handline",
  cast_net: "Cast net",
  seine: "Seine net",
  trap: "Trap / pot",
  spear: "Spear",
  other: "Other",
};

const GROUP_FILTERS = ["fish", "shark_ray", "turtle", "crustacean", "mollusc", "other"];

export default function FishCatchPage() {
  const [catches, setCatches] = useState<ApiFishCatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState("");

  useEffect(() => {
    let cancelled = false;
    const query = activeGroup ? `?species_group=${activeGroup}` : "";
    fetchCmsList<ApiFishCatch>(`/catches/${query}`).then((data) => {
      if (!cancelled) {
        setCatches(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeGroup]);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[#041c33] text-white py-14 sm:py-18 border-b border-sky-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#021120] via-[#052647] to-[#073a66] opacity-90 pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-400/15 text-teal-200 border border-teal-400/30 mb-4 tracking-wide uppercase">
              Fisheries Catch Log
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Artisanal Fish Catch Ledger
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Verified catch logs and biological biometrics shared directly by artisanal fishers and marine scientists along India&apos;s coast.
            </p>
          </div>
        </section>

        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveGroup("")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeGroup === ""
                  ? "bg-ocean-blue text-white"
                  : "bg-white text-ocean-text-secondary border border-ocean-border hover:border-ocean-blue hover:text-ocean-blue"
              }`}
            >
              All
            </button>
            {GROUP_FILTERS.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group === activeGroup ? "" : group)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeGroup === group
                    ? "bg-ocean-blue text-white"
                    : "bg-white text-ocean-text-secondary border border-ocean-border hover:border-ocean-blue hover:text-ocean-blue"
                }`}
              >
                {GROUP_LABELS[group] ?? group}
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-16 text-ocean-text-secondary">Loading catches...</div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catches.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  {item.photo ? (
                    <img
                      src={mediaUrl(item.photo)}
                      alt={item.species_name || item.species_display || "Fish catch"}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-ocean-green/10 to-ocean-blue/10 h-48 flex items-center justify-center">
                      <Fish className="h-12 w-12 text-ocean-green/30" />
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-ocean-navy text-lg">
                        {item.species_name || item.species_display || "Fish catch"}
                      </h3>
                      {item.number > 1 && <Badge variant="secondary">×{item.number}</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-ocean-text-secondary mb-3">
                      {item.species_group && (
                        <Badge variant="secondary">{GROUP_LABELS[item.species_group] ?? item.species_group}</Badge>
                      )}
                      {item.gear && (
                        <Badge variant="secondary">
                          🎣 {item.gear === "other" && item.gear_other ? item.gear_other : GEAR_LABELS[item.gear] ?? item.gear}
                        </Badge>
                      )}
                      {item.weight != null && (
                        <Badge variant="secondary">
                          <Weight className="h-3 w-3 mr-1" />
                          {item.weight} {item.weight_unit}
                        </Badge>
                      )}
                      {item.length != null && (
                        <Badge variant="secondary">
                          <Ruler className="h-3 w-3 mr-1" />
                          {item.length} {item.length_unit}
                        </Badge>
                      )}
                      {item.depth_m != null && <Badge variant="secondary">{item.depth_m} m deep</Badge>}
                    </div>

                    {item.notes && <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-3">{item.notes}</p>}

                    <div className="flex items-center gap-3 text-sm text-ocean-text-secondary pt-3 border-t border-ocean-border flex-wrap">
                      {item.contributor && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.contributor}
                        </span>
                      )}
                      {item.village_name && <LocationDisplay name={item.village_name} showCoords={false} size="sm" />}
                      {item.fishing_location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.fishing_location_name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {catches.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Fish className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
                  <p className="text-lg text-ocean-text-secondary mb-4">
                    {activeGroup ? "No catches in this group yet." : "No fish catches shared yet. Be the first to add one!"}
                  </p>
                  <Button asChild>
                    <Link href="/contributions">
                      <Plus className="mr-2 h-4 w-4" />
                      Add a Fish Catch
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
