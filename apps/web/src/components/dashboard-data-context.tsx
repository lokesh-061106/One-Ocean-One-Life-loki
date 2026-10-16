"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { authFetch } from "@/lib/auth-fetch";

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string> || {}) };
  const res = await authFetch(endpoint, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.non_field_errors?.[0] || JSON.stringify(err));
  }
  if (res.status === 204) return null;
  return res.json();
}

export type UserRole = "admin" | "community_leader" | "fisherman" | "researcher" | "educator";

export interface DashboardUser {
  id: string; name: string; email: string; role: string; village: string; status: string; verified: boolean; score: number; joinDate: string;
}

export interface DashboardPost {
  id: string; title: string; author: string; category: string; type: string; village: string; status: string; views: number; reactions: number; date: string; content?: string;
}

export interface DashboardSpecies {
  id: string; name: string; scientific: string; category: string; status: string; image: string; description?: string;
}

export interface DashboardEvent {
  id: string; title: string; type: string; date: string; village: string; participants: number; maxParticipants: number; status: string; description?: string;
}

export interface DashboardHotspot {
  id: string; name: string; zone_id: string; contributions: number; density: "low" | "medium" | "high" | "very_high"; lat: number; lng: number;
}

export interface DashboardContributionMedia {
  id: string;
  kind: string;
  url: string;
  display_name: string;
  order: number;
}

export interface DashboardContribution {
  id: string; title: string; type: string; author: string; village: string; villageId?: string;
  points: number; status: string; notes: string; description?: string; date: string;
  media?: DashboardContributionMedia[];
  contributorType?: string;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Record<string, unknown>;
}

export interface ContributionSavePayload {
  title: string; type: string; author: string; village: string;
  notes: string; description: string; points?: number;
  images?: File[]; video?: File | null; audio?: File | null; documents?: File[];
  locationPhoto?: File | null;
  setupImages?: File[];
  speciesImages?: File[];
  voiceNote?: File | null;
  spectrogram?: File | null;
  removeMediaIds?: string[];
  latitude?: number | null;
  longitude?: number | null;
  contributorType?: string;
  rememberContributorType?: boolean;
  metadata?: Record<string, unknown>;
  draft?: boolean;
  submit?: boolean;
}

export interface DashboardEmergencyContact {
  id: string; name: string; contact_type: string; phone: string; village_id: string; is_active: boolean;
}

interface DashboardDataContextType {
  users: DashboardUser[];
  posts: DashboardPost[];
  species: DashboardSpecies[];
  events: DashboardEvent[];
  hotspots: DashboardHotspot[];
  contributions: DashboardContribution[];
  emergencyContacts: DashboardEmergencyContact[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  addUser: (u: Omit<DashboardUser, "id">) => Promise<void>;
  updateUser: (id: string, u: Partial<DashboardUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addPost: (p: Omit<DashboardPost, "id">) => Promise<void>;
  updatePost: (id: string, p: Partial<DashboardPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  addSpecies: (s: Omit<DashboardSpecies, "id">) => Promise<void>;
  updateSpecies: (id: string, s: Partial<DashboardSpecies>) => Promise<void>;
  deleteSpecies: (id: string) => Promise<void>;
  addEvent: (e: Omit<DashboardEvent, "id">) => Promise<void>;
  updateEvent: (id: string, e: Partial<DashboardEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addHotspot: (h: Omit<DashboardHotspot, "id">) => Promise<void>;
  updateHotspot: (id: string, h: Partial<DashboardHotspot>) => Promise<void>;
  deleteHotspot: (id: string) => Promise<void>;
  addContribution: (c: Omit<DashboardContribution, "id"> & Partial<ContributionSavePayload>) => Promise<void>;
  updateContribution: (id: string, c: Partial<DashboardContribution> & Partial<ContributionSavePayload>) => Promise<void>;
  reviewContribution: (id: string, action: "approve" | "reject", opts?: { notes?: string; rejection_reason?: string; points?: number }) => Promise<any>;
  deleteContribution: (id: string) => Promise<void>;
  addEmergencyContact: (c: Omit<DashboardEmergencyContact, "id">) => Promise<void>;
  updateEmergencyContact: (id: string, c: Partial<DashboardEmergencyContact>) => Promise<void>;
  deleteEmergencyContact: (id: string) => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | null>(null);

function mapUserFromApi(p: any): DashboardUser {
  const u = p.user || {};
  return {
    id: p.id || u.id || "",
    name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "Unknown",
    email: u.email || "",
    role: u.role || "community_member",
    village: p.village_name || "",
    status: p.member_status || "community_member",
    verified: u.is_verified || false,
    score: p.contribution_score || 0,
    joinDate: u.date_joined ? u.date_joined.split("T")[0] : "",
  };
}

function mapPostFromApi(p: any): DashboardPost {
  const author = p.author_name || (p.author?.username) || "";
  return {
    id: p.id || "",
    title: p.title || "",
    author,
    category: typeof p.category === "object" && p.category !== null ? p.category.name || "" : (p.category || ""),
    type: typeof p.category === "object" && p.category !== null ? "story" : (p.category || "story"),
    village: p.village_name || "",
    status: p.is_verified ? "published" : "pending",
    views: p.views_count || 0,
    reactions: p.reactions_count || 0,
    date: p.created_at ? p.created_at.split("T")[0] : "",
  };
}

function mapSpeciesFromApi(s: any): DashboardSpecies {
  const catName = typeof s.category === "object" ? s.category?.name : s.category_name || "";
  return {
    id: s.id || "",
    name: s.common_name || "",
    scientific: s.scientific_name || "",
    category: catName,
    status: s.is_verified ? "Verified" : "Pending",
    image: s.image || "",
    description: s.description || "",
  };
}

function mapEventFromApi(e: any): DashboardEvent {
  const village = e.location_name || (typeof e.village === "object" ? e.village?.name : e.village_name) || "";
  return {
    id: e.id || "",
    title: e.title || "",
    type: e.event_type || "",
    date: e.start_date ? e.start_date.split("T")[0] : "",
    village,
    participants: e.participant_count || 0,
    maxParticipants: e.max_participants || 0,
    status: e.is_published ? "published" : "draft",
    description: e.description || "",
  };
}

function mapHotspotFromApi(h: any): DashboardHotspot {
  const zoneName = typeof h.zone === "object" ? h.zone?.name : h.zone_name || "";
  let lat = 0, lng = 0;
  if (h.center) {
    if (typeof h.center === "object" && h.center.coordinates) {
      lng = h.center.coordinates[0];
      lat = h.center.coordinates[1];
    } else if (typeof h.center === "string") {
      // Handles "SRID=4326;POINT (lng lat)", "POINT(lng lat)", etc.
      const m = h.center.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
      if (m) { lng = parseFloat(m[1]); lat = parseFloat(m[2]); }
    }
  }
  return {
    id: h.id || "",
    name: h.cell_id || "",
    zone_id: typeof h.zone === "object" ? h.zone?.id : h.zone || "",
    contributions: h.contribution_count || 0,
    density: h.density_level || "medium",
    lat,
    lng,
  };
}

function mapContributionFromApi(c: any): DashboardContribution {
  const author = c.author_display || c.author || c.user_name || (typeof c.user === "object" ? c.user?.username : "") || "";
  let latitude: number | null = null;
  let longitude: number | null = null;
  const loc = c.location;
  if (loc) {
    if (typeof loc === "object" && Array.isArray(loc.coordinates)) {
      longitude = loc.coordinates[0];
      latitude = loc.coordinates[1];
    } else if (typeof loc === "string") {
      const m = loc.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
      if (m) { longitude = parseFloat(m[1]); latitude = parseFloat(m[2]); }
    }
  }
  if (typeof c.latitude === "number") latitude = c.latitude;
  if (typeof c.longitude === "number") longitude = c.longitude;
  return {
    id: c.id || "",
    title: c.title || c.notes || c.type_display || `Contribution ${c.id?.slice(0, 8)}`,
    type: c.type || "",
    author,
    village: c.village_name || "",
    villageId: c.village || "",
    points: c.points || 0,
    status: c.status || "submitted",
    notes: c.notes || "",
    description: c.description || "",
    media: Array.isArray(c.media) ? c.media : [],
    date: c.created_at ? c.created_at.split("T")[0] : "",
    contributorType: c.contributor_type || "",
    latitude,
    longitude,
    metadata: c.metadata || {},
  };
}

function buildContributionFormData(payload: ContributionSavePayload): FormData {
  const fd = new FormData();
  fd.append("title", payload.title);
  fd.append("type", payload.type);
  fd.append("author", payload.author);
  fd.append("village", payload.village);
  fd.append("notes", payload.notes || "");
  fd.append("description", payload.description || "");
  if (payload.points !== undefined) fd.append("points", String(payload.points));
  if (payload.contributorType) fd.append("contributor_type", payload.contributorType);
  if (payload.rememberContributorType) fd.append("remember_contributor_type", "true");
  if (payload.latitude != null) fd.append("latitude", String(payload.latitude));
  if (payload.longitude != null) fd.append("longitude", String(payload.longitude));
  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    fd.append("metadata", JSON.stringify(payload.metadata));
  }
  if (payload.draft) fd.append("draft", "true");
  if (payload.submit) fd.append("submit", "true");
  (payload.images || []).forEach((f) => fd.append("images", f));
  (payload.setupImages || []).forEach((f) => fd.append("setup_images", f));
  (payload.speciesImages || []).forEach((f) => fd.append("species_images", f));
  if (payload.locationPhoto) fd.append("location_photo", payload.locationPhoto);
  if (payload.video) fd.append("video", payload.video);
  if (payload.audio) fd.append("audio", payload.audio);
  if (payload.voiceNote) fd.append("voice_note", payload.voiceNote);
  if (payload.spectrogram) fd.append("spectrogram", payload.spectrogram);
  (payload.documents || []).forEach((f) => fd.append("documents", f));
  if (payload.removeMediaIds?.length) {
    payload.removeMediaIds.forEach((id) => fd.append("remove_media_ids", id));
  }
  return fd;
}

async function apiMultipartRequest(endpoint: string, method: string, fd: FormData): Promise<any> {
  // authFetch attaches the Bearer token and refreshes it on 401.
  // Do NOT set Content-Type — the browser must add the multipart boundary.
  const res = await authFetch(endpoint, { method, body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail =
      err.detail ||
      err.non_field_errors?.[0] ||
      Object.values(err).flat().map(String).join("; ") ||
      JSON.stringify(err);
    throw new Error(detail || "Request failed");
  }
  return res.json();
}

function mapContactFromApi(c: any): DashboardEmergencyContact {
  return {
    id: c.id || "",
    name: c.name || "",
    contact_type: c.contact_type || "",
    phone: c.phone || "",
    village_id: typeof c.village === "object" ? c.village?.id : c.village || "",
    is_active: c.is_active !== false,
  };
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [species, setSpecies] = useState<DashboardSpecies[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [hotspots, setHotspots] = useState<DashboardHotspot[]>([]);
  const [contributions, setContributions] = useState<DashboardContribution[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<DashboardEmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [usersRes, postsRes, speciesRes, eventsRes, hotspotsRes, contactsRes, contributionsRes] = await Promise.allSettled([
      apiRequest("/auth/members/"),
      apiRequest("/community/posts/"),
      apiRequest("/guides/species/"),
      apiRequest("/community/events/"),
      apiRequest("/maps/hotspots/"),
      apiRequest("/maps/emergency/contacts/"),
      apiRequest("/contributions/my/"),
    ]);
    return { usersRes, postsRes, speciesRes, eventsRes, hotspotsRes, contactsRes, contributionsRes };
  }, []);

  const applyAll = useCallback((results: Awaited<ReturnType<typeof loadAll>>) => {
    const { usersRes, postsRes, speciesRes, eventsRes, hotspotsRes, contactsRes, contributionsRes } = results;
    try {
      if (usersRes.status === "fulfilled") {
        const data = usersRes.value?.results || usersRes.value || [];
        setUsers(Array.isArray(data) ? data.map(mapUserFromApi) : []);
      }
      if (postsRes.status === "fulfilled") {
        const data = postsRes.value?.results || postsRes.value || [];
        setPosts(Array.isArray(data) ? data.map(mapPostFromApi) : []);
      }
      if (speciesRes.status === "fulfilled") {
        const data = speciesRes.value?.results || speciesRes.value || [];
        setSpecies(Array.isArray(data) ? data.map(mapSpeciesFromApi) : []);
      }
      if (eventsRes.status === "fulfilled") {
        const data = eventsRes.value?.results || eventsRes.value || [];
        setEvents(Array.isArray(data) ? data.map(mapEventFromApi) : []);
      }
      if (hotspotsRes.status === "fulfilled") {
        const data = hotspotsRes.value?.results || hotspotsRes.value || [];
        setHotspots(Array.isArray(data) ? data.map(mapHotspotFromApi) : []);
      }
      if (contactsRes.status === "fulfilled") {
        const data = contactsRes.value?.results || contactsRes.value || [];
        setEmergencyContacts(Array.isArray(data) ? data.map(mapContactFromApi) : []);
      }
      if (contributionsRes.status === "fulfilled") {
        const data = contributionsRes.value?.results || contributionsRes.value || [];
        setContributions(Array.isArray(data) ? data.map(mapContributionFromApi) : []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    applyAll(await loadAll());
  }, [loadAll, applyAll]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    loadAll().then(applyAll);
  }, [loadAll, applyAll]);

  // ── Users ──
  const addUser = useCallback(async (u: Omit<DashboardUser, "id">) => {
    const parts = u.name.split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    const res = await apiRequest("/auth/users/create/", {
      method: "POST",
      body: JSON.stringify({
        username: u.email.split("@")[0],
        email: u.email,
        password: "TempPassword123!",
        first_name: firstName,
        last_name: lastName,
        role: u.role,
        village: u.village,
        occupation: u.role,
        bio: "",
      }),
    });
    setUsers(prev => [...prev, mapUserFromApi(res)]);
  }, []);

  const updateUser = useCallback(async (id: string, u: Partial<DashboardUser>) => {
    await apiRequest(`/auth/users/${id}/update/`, {
      method: "PATCH",
      body: JSON.stringify({
        first_name: u.name?.split(" ")[0],
        last_name: u.name?.split(" ").slice(1).join(" "),
        role: u.role,
        member_status: u.status,
        is_verified: u.verified,
      }),
    });
    setUsers(prev => prev.map(x => x.id === id ? { ...x, ...u } : x));
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await apiRequest(`/auth/users/${id}/delete/`, { method: "DELETE" });
    setUsers(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Posts ──
  const addPost = useCallback(async (p: Omit<DashboardPost, "id">) => {
    const res = await apiRequest("/community/posts/create/", {
      method: "POST",
      body: JSON.stringify({
        title: p.title,
        content: p.content || `<p>${p.title}</p>`,
        category: p.type || "story",
      }),
    });
    setPosts(prev => [mapPostFromApi(res), ...prev]);
  }, []);

  const updatePost = useCallback(async (id: string, p: Partial<DashboardPost>) => {
    await apiRequest(`/community/posts/${id}/update/`, {
      method: "PATCH",
      body: JSON.stringify({
        title: p.title,
        content: p.content,
        category: p.type,
      }),
    });
    setPosts(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  }, []);

  const deletePost = useCallback(async (id: string) => {
    await apiRequest(`/community/posts/${id}/delete/`, { method: "DELETE" });
    setPosts(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Species ──
  const addSpecies = useCallback(async (s: Omit<DashboardSpecies, "id">) => {
    const res = await apiRequest("/guides/species/create/", {
      method: "POST",
      body: JSON.stringify({
        common_name: s.name,
        scientific_name: s.scientific,
        category: s.category,
        description: s.description || "",
        is_verified: s.status === "Verified",
        image: s.image,
      }),
    });
    setSpecies(prev => [...prev, mapSpeciesFromApi(res)]);
  }, []);

  const updateSpecies = useCallback(async (id: string, s: Partial<DashboardSpecies>) => {
    await apiRequest(`/guides/species/${id}/update/`, {
      method: "PATCH",
      body: JSON.stringify({
        common_name: s.name,
        scientific_name: s.scientific,
        category: s.category,
        description: s.description,
        is_verified: s.status === "Verified",
        image: s.image,
      }),
    });
    setSpecies(prev => prev.map(x => x.id === id ? { ...x, ...s } : x));
  }, []);

  const deleteSpecies = useCallback(async (id: string) => {
    await apiRequest(`/guides/species/${id}/delete/`, { method: "DELETE" });
    setSpecies(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Events ──
  const addEvent = useCallback(async (e: Omit<DashboardEvent, "id">) => {
    const startDate = e.date ? new Date(e.date).toISOString() : new Date().toISOString();
    const endDate = e.date ? new Date(new Date(e.date).getTime() + 4 * 60 * 60 * 1000).toISOString() : startDate;
    const res = await apiRequest("/community/events/create/", {
      method: "POST",
      body: JSON.stringify({
        title: e.title,
        description: e.description || `${e.title} - organized by the community.`,
        event_type: e.type || "community_meeting",
        location_name: e.village || "",
        start_date: startDate,
        end_date: endDate,
        max_participants: e.maxParticipants || 50,
      }),
    });
    setEvents(prev => [mapEventFromApi(res), ...prev]);
  }, []);

  const updateEvent = useCallback(async (id: string, e: Partial<DashboardEvent>) => {
    await apiRequest(`/community/events/${id}/update/`, {
      method: "PATCH",
      body: JSON.stringify({
        title: e.title,
        description: e.description,
        event_type: e.type,
        location_name: e.village,
        max_participants: e.maxParticipants,
      }),
    });
    setEvents(prev => prev.map(x => x.id === id ? { ...x, ...e } : x));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await apiRequest(`/community/events/${id}/delete/`, { method: "DELETE" });
    setEvents(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Hotspots ──
  const addHotspot = useCallback(async (h: Omit<DashboardHotspot, "id">) => {
    const res = await apiRequest("/maps/hotspots/create/", {
      method: "POST",
      body: JSON.stringify({
        cell_id: h.name,
        zone: h.zone_id,
        contribution_count: h.contributions,
        density_level: h.density,
        center: `POINT (${h.lng} ${h.lat})`,
      }),
    });
    setHotspots(prev => [...prev, mapHotspotFromApi(res)]);
  }, []);

  const updateHotspot = useCallback(async (id: string, h: Partial<DashboardHotspot>) => {
    const payload: Record<string, any> = {};
    if (h.name !== undefined) payload.cell_id = h.name;
    if (h.zone_id !== undefined) payload.zone = h.zone_id;
    if (h.contributions !== undefined) payload.contribution_count = h.contributions;
    if (h.density !== undefined) payload.density_level = h.density;
    if (h.lat !== undefined && h.lng !== undefined) payload.center = `POINT (${h.lng} ${h.lat})`;
    await apiRequest(`/maps/hotspots/${id}/update/`, { method: "PATCH", body: JSON.stringify(payload) });
    setHotspots(prev => prev.map(x => x.id === id ? { ...x, ...h } : x));
  }, []);

  const deleteHotspot = useCallback(async (id: string) => {
    await apiRequest(`/maps/hotspots/${id}/delete/`, { method: "DELETE" });
    setHotspots(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Contributions ──
  const addContribution = useCallback(async (c: Omit<DashboardContribution, "id"> & Partial<ContributionSavePayload>) => {
    const payload: ContributionSavePayload = {
      title: c.title || "",
      type: c.type || "",
      author: c.author || "",
      village: (c as any).villageId || c.village || "",
      notes: c.notes || "",
      description: c.description || "",
      points: (c as any).points,
      images: (c as any).images,
      video: (c as any).video,
      audio: (c as any).audio,
      documents: (c as any).documents,
      locationPhoto: (c as any).locationPhoto ?? (c as any).location_photo,
      setupImages: (c as any).setupImages ?? (c as any).setup_images,
      speciesImages: (c as any).speciesImages ?? (c as any).species_images,
      voiceNote: (c as any).voiceNote ?? (c as any).voice_note,
      spectrogram: (c as any).spectrogram,
      latitude: (c as any).latitude,
      longitude: (c as any).longitude,
      contributorType: (c as any).contributorType ?? (c as any).contributor_type,
      rememberContributorType: (c as any).rememberContributorType ?? (c as any).remember_contributor_type,
      metadata: (c as any).metadata,
      draft: (c as any).draft,
      submit: (c as any).submit,
    };
    const res = await apiMultipartRequest("/contributions/", "POST", buildContributionFormData(payload));
    setContributions(prev => [mapContributionFromApi(res), ...prev]);
  }, []);

  const updateContribution = useCallback(async (id: string, c: Partial<DashboardContribution> & Partial<ContributionSavePayload>) => {
    const fd = new FormData();
    if (c.title !== undefined) fd.append("title", c.title);
    if (c.type !== undefined) fd.append("type", c.type);
    if (c.author !== undefined) fd.append("author", c.author);
    const villageId = (c as any).villageId || c.village;
    if (villageId) fd.append("village", villageId);
    if (c.notes !== undefined) fd.append("notes", c.notes);
    if (c.description !== undefined) fd.append("description", c.description);
    const contributorType = (c as any).contributorType ?? (c as any).contributor_type;
    if (contributorType) fd.append("contributor_type", contributorType);
    const latitude = (c as any).latitude;
    const longitude = (c as any).longitude;
    if (latitude != null) fd.append("latitude", String(latitude));
    if (longitude != null) fd.append("longitude", String(longitude));
    const metadata = (c as any).metadata;
    if (metadata && Object.keys(metadata).length > 0) {
      fd.append("metadata", JSON.stringify(metadata));
    }
    if ((c as any).submit) fd.append("submit", "true");
    ((c as any).images || []).forEach((f: File) => fd.append("images", f));
    ((c as any).setupImages || []).forEach((f: File) => fd.append("setup_images", f));
    ((c as any).speciesImages || []).forEach((f: File) => fd.append("species_images", f));
    if ((c as any).locationPhoto) fd.append("location_photo", (c as any).locationPhoto);
    if ((c as any).video) fd.append("video", (c as any).video);
    if ((c as any).audio) fd.append("audio", (c as any).audio);
    if ((c as any).voiceNote) fd.append("voice_note", (c as any).voiceNote);
    if ((c as any).spectrogram) fd.append("spectrogram", (c as any).spectrogram);
    ((c as any).documents || []).forEach((f: File) => fd.append("documents", f));
    const removeIds = (c as any).removeMediaIds;
    (removeIds || []).forEach((id: string) => fd.append("remove_media_ids", id));
    const res = await apiMultipartRequest(`/contributions/${id}/update/`, "PATCH", fd);
    setContributions(prev => prev.map(x => x.id === id ? mapContributionFromApi({ ...x, ...res }) : x));
  }, []);

  const reviewContribution = useCallback(async (id: string, action: "approve" | "reject", opts?: { notes?: string; rejection_reason?: string; points?: number }) => {
    const res = await apiRequest(`/contributions/${id}/review/`, {
      method: "POST",
      body: JSON.stringify({ action, ...opts }),
    });
    setContributions(prev => prev.map(x => x.id === id ? { ...x, status: res.status, points: res.points ?? x.points } : x));
    return res;
  }, []);

  const deleteContribution = useCallback(async (id: string) => {
    await apiRequest(`/contributions/${id}/delete/`, { method: "DELETE" });
    setContributions(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Emergency Contacts ──
  const addEmergencyContact = useCallback(async (c: Omit<DashboardEmergencyContact, "id">) => {
    const res = await apiRequest("/maps/emergency/contacts/create/", {
      method: "POST",
      body: JSON.stringify({
        name: c.name,
        contact_type: c.contact_type,
        phone: c.phone,
        village: c.village_id,
        is_active: c.is_active,
      }),
    });
    setEmergencyContacts(prev => [...prev, mapContactFromApi(res)]);
  }, []);

  const updateEmergencyContact = useCallback(async (id: string, c: Partial<DashboardEmergencyContact>) => {
    await apiRequest(`/maps/emergency/contacts/${id}/update/`, {
      method: "PATCH",
      body: JSON.stringify({
        name: c.name,
        contact_type: c.contact_type,
        phone: c.phone,
        village: c.village_id,
        is_active: c.is_active,
      }),
    });
    setEmergencyContacts(prev => prev.map(x => x.id === id ? { ...x, ...c } : x));
  }, []);

  const deleteEmergencyContact = useCallback(async (id: string) => {
    await apiRequest(`/maps/emergency/contacts/${id}/delete/`, { method: "DELETE" });
    setEmergencyContacts(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <DashboardDataContext.Provider value={{
      users, posts, species, events, hotspots, contributions, emergencyContacts, loading,
      refreshAll,
      addUser, updateUser, deleteUser,
      addPost, updatePost, deletePost,
      addSpecies, updateSpecies, deleteSpecies,
      addEvent, updateEvent, deleteEvent,
      addHotspot, updateHotspot, deleteHotspot,
      addContribution, updateContribution, reviewContribution, deleteContribution,
      addEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
    }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    // Never silently no-op — that hid a real bug where mutations "succeeded"
    // without any network request. The provider now lives in app/dashboard/layout.tsx.
    throw new Error("useDashboardData must be used within <DashboardDataProvider> (app/dashboard/layout.tsx)");
  }
  return ctx;
}
