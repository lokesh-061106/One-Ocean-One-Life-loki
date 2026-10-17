"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines, BookOpen, Calendar, ChevronLeft, ChevronRight,
  Eye, Fish, ImagePlus, ImageUp, Layers, LocateFixed, MapPin, Save, Scroll,
  Search, Trash2, Upload, X, AlertCircle, CheckCircle2,
} from "lucide-react";
import { gps } from "exifr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mediaUrl } from "@/lib/api-helpers";
import {
  getWizardConfig,
  type ContributionWizardConfig,
  type WizardField,
  type WizardTypeConfig,
} from "@/features/contributions";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ocean_sound: AudioLines,
  marine_sighting: Search,
  fish_catch: Fish,
  observation: Eye,
  education_post: BookOpen,
  event: Calendar,
  beach_cleanup: Trash2,
  local_knowledge: Scroll,
};

const STEPS = ["Type", "Media", "Location", "Details", "Review"] as const;

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${path}${path.includes("?") ? "&" : "?"}page_size=100`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  } catch {
    return [];
  }
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface ExistingMediaItem {
  id: string;
  kind: string;
  url: string;
  display_name: string;
  role?: string;
}

export interface ContributionWizardData {
  contributorType: string;
  type: string;
  title: string;
  author: string;
  village: string;
  notes: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, string>;
  images: File[];
  locationPhoto: File | null;
  setupImages: File[];
  speciesImages: File[];
  video: File | null;
  audio: File | null;
  voiceNote: File | null;
  spectrogram: File | null;
  documents: File[];
  removeMediaIds: string[];
  points?: number;
  draft?: boolean;
  submit?: boolean;
}

interface ContributionWizardProps {
  mode: "add" | "edit";
  initialData?: Partial<ContributionWizardData> & {
    id?: string;
    existingMedia?: ExistingMediaItem[];
  };
  isAdmin?: boolean;
  defaultAuthor?: string;
  onSave: (data: ContributionWizardData) => Promise<void>;
  onCancel: () => void;
}

export function ContributionWizard({
  mode, initialData, isAdmin, defaultAuthor, onSave, onCancel,
}: ContributionWizardProps) {
  const [config, setConfig] = useState<ContributionWizardConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [readingGps, setReadingGps] = useState(false);
  const [gpsPhotoMsg, setGpsPhotoMsg] = useState<string | null>(null);
  const gpsPhotoInputRef = useRef<HTMLInputElement>(null);
  const [researchOpen, setResearchOpen] = useState(false);
  const [showOtherTypes, setShowOtherTypes] = useState(false);

  // Identity comes from Profile / account role on the API — not asked in the form.
  const [contributorType] = useState(initialData?.contributorType || "");
  const [type, setType] = useState(initialData?.type || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [author, setAuthor] = useState(initialData?.author || defaultAuthor || "");
  const [stateName, setStateName] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [villageId, setVillageId] = useState(initialData?.village || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude ?? null);
  const [metadata, setMetadata] = useState<Record<string, string>>(() => {
    const src = initialData?.metadata || {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(src)) {
      if (v == null || v === "") continue;
      out[k] = typeof v === "boolean" ? (v ? "true" : "false") : String(v);
    }
    return out;
  });

  const [images, setImages] = useState<File[]>(initialData?.images || []);
  const [locationPhoto, setLocationPhoto] = useState<File | null>(initialData?.locationPhoto || null);
  const [setupImages, setSetupImages] = useState<File[]>(initialData?.setupImages || []);
  const [speciesImages, setSpeciesImages] = useState<File[]>(initialData?.speciesImages || []);
  const [video, setVideo] = useState<File | null>(initialData?.video || null);
  const [audio, setAudio] = useState<File | null>(initialData?.audio || null);
  const [voiceNote, setVoiceNote] = useState<File | null>(initialData?.voiceNote || null);
  const [spectrogram, setSpectrogram] = useState<File | null>(initialData?.spectrogram || null);
  const [documents, setDocuments] = useState<File[]>(initialData?.documents || []);
  const [removeMediaIds, setRemoveMediaIds] = useState<string[]>(initialData?.removeMediaIds || []);

  const [states, setStates] = useState<{ name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string; zone_name?: string }[]>([]);

  const existingMedia = useMemo(() => initialData?.existingMedia || [], [initialData?.existingMedia]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setConfigError(null);
      getWizardConfig()
        .then((c) => { if (!cancelled) setConfig(c); })
        .catch((e) => {
          if (!cancelled) {
            setConfigError(e?.message || "Could not load submission options. Check your connection and retry.");
          }
        });
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchList<{ name: string }>("/states/").then(setStates);
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !initialData?.village) return;
    let cancelled = false;
    (async () => {
      const v = await fetchJson<{ id: string; name: string; district: string }>(`/villages/${initialData.village}/`);
      if (!v?.district || cancelled) return;
      const allDistricts = await fetchList<{ id: string; name: string; state: string }>("/districts/");
      const match = allDistricts.find((d) => d.id === v.district);
      if (!match?.state || cancelled) return;
      setStateName(match.state);
      setDistrictId(v.district);
      setDistricts(allDistricts.filter((d) => d.state === match.state));
      setVillages(await fetchList(`/villages/?district=${v.district}`));
    })();
    return () => { cancelled = true; };
  }, [mode, initialData?.village]);

  useEffect(() => {
    if (!stateName) return;
    let cancelled = false;
    fetchList<{ id: string; name: string }>(`/districts/?state=${encodeURIComponent(stateName)}`).then((d) => {
      if (!cancelled) setDistricts(d || []);
    });
    return () => { cancelled = true; };
  }, [stateName]);

  useEffect(() => {
    let cancelled = false;
    const path = districtId
      ? `/villages/?district=${districtId}&page_size=100`
      : "/villages/?page_size=100";
    fetchList<{ id: string; name: string; zone_name?: string }>(path).then((v) => {
      if (!cancelled) setVillages(v || []);
    });
    return () => { cancelled = true; };
  }, [districtId]);

  const typeCfg: WizardTypeConfig | null = useMemo(
    () => config?.types.find((t) => t.value === type) || null,
    [config, type],
  );

  const primaryTypes = useMemo(() => config?.types.filter((t) => t.primary) || [], [config]);
  const otherTypes = useMemo(() => config?.types.filter((t) => !t.primary) || [], [config]);

  const remainingExisting = useMemo(
    () => existingMedia.filter((m) => !removeMediaIds.includes(m.id)),
    [existingMedia, removeMediaIds],
  );

  const hasMediaInput = useCallback((field: string): boolean => {
    const still = (kind: string, role?: string) =>
      remainingExisting.some((m) => m.kind === kind && (role ? m.role === role : true));
    switch (field) {
      case "images": return images.length > 0 || still("image");
      case "location_photo": return !!locationPhoto || still("image", "location_photo");
      case "setup_images": return setupImages.length > 0 || still("image", "setup_photo");
      case "species_images": return speciesImages.length > 0 || still("image", "species_photo");
      case "video": return !!video || still("video", "video");
      case "audio": return !!audio || still("audio", "primary_audio");
      case "voice_note": return !!voiceNote || still("audio", "voice_note");
      case "spectrogram": return !!spectrogram || still("image", "spectrogram");
      case "documents": return documents.length > 0 || still("document");
      default: return false;
    }
  }, [images, locationPhoto, setupImages, speciesImages, video, audio, voiceNote, spectrogram, documents, remainingExisting]);

  const existingHas = useCallback(
    (kind: string, role?: string): boolean =>
      remainingExisting.some((m) => m.kind === kind && (role ? m.role === role : true)),
    [remainingExisting],
  );

  const locate = () => {
    setLocError(null);
    setGpsPhotoMsg(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported in this browser. Enter coordinates manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      (err) => {
        setLocError(err.message || "Could not get your location. Enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  };

  const handleGpsPhoto = async (file: File | null) => {
    if (!file) return;
    setLocError(null);
    setGpsPhotoMsg(null);
    setReadingGps(true);
    try {
      const coords = await gps(file);
      if (coords && coords.latitude != null && coords.longitude != null) {
        setLatitude(Number(coords.latitude.toFixed(6)));
        setLongitude(Number(coords.longitude.toFixed(6)));
        setGpsPhotoMsg("GPS coordinates read from the photo.");
      } else {
        setLocError(
          "No GPS data found in this photo. Turn on Location when taking the photo, or enter the coordinates manually.",
        );
      }
    } catch {
      setLocError(
        "Could not read GPS data from this photo. Try another photo or enter the coordinates manually.",
      );
    } finally {
      setReadingGps(false);
      if (gpsPhotoInputRef.current) gpsPhotoInputRef.current.value = "";
    }
  };

  const validateStep = useCallback((index: number): boolean => {
    const errs: Record<string, string> = {};
    if (index === 0 && !type) {
      errs.type = "Please choose a contribution type.";
    }
    if (index === 1 && typeCfg) {
      for (const req of typeCfg.media.required) {
        if (!hasMediaInput(req.field)) errs[req.field] = `${req.label} is required.`;
      }
      if (typeCfg.media.any_of.length > 0 && !typeCfg.media.any_of.some((f) => hasMediaInput(f.field))) {
        const labels = typeCfg.media.any_of.map((f) => f.label).join(" or ");
        errs.media = `${labels} is required.`;
      }
    }
    if (index === 2 && typeCfg?.requires_geotag) {
      if (latitude == null || longitude == null) {
        errs.gps = "GPS coordinates are required for this contribution type.";
      }
    }
    if (index === 3 && typeCfg) {
      if (type === "ocean_sound" && !title.trim()) {
        errs.title = "Name is required — it becomes the sound library entry name.";
      }
      for (const f of typeCfg.fields) {
        if (!f.required) continue;
        if (f.section === "research") continue;
        if (!metadata[f.key]) errs[f.key] = `${f.label} is required.`;
      }
      const level = metadata.species_level;
      if (typeCfg.fields.some((f) => f.key === "species_level")) {
        if (level === "known" && !metadata.species_name) {
          errs.species_name = "Species name is required when the species is known.";
        }
        if (level === "approximate" && !metadata.species_group) {
          errs.species_group = "Species group is required for an approximate identification.";
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [type, typeCfg, hasMediaInput, latitude, longitude, metadata, title]);

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const buildData = (draft: boolean, submit: boolean): ContributionWizardData => {
    const cleanedMeta: Record<string, string> = {};
    for (const [k, v] of Object.entries(metadata)) {
      if (v !== "") cleanedMeta[k] = v;
    }
    return {
      contributorType,
      type,
      title: title.trim(),
      author: author.trim(),
      village: villageId,
      notes,
      description,
      latitude,
      longitude,
      metadata: cleanedMeta,
      images,
      locationPhoto,
      setupImages,
      speciesImages,
      video,
      audio,
      voiceNote,
      spectrogram,
      documents,
      removeMediaIds,
      points: isAdmin && (initialData as any)?.points !== undefined ? (initialData as any).points : undefined,
      draft,
      submit,
    };
  };

  const handleSave = async (draft: boolean) => {
    // Full validation across all steps (drafts skip media/GPS/details requirements).
    if (!draft) {
      for (let i = 0; i < 4; i++) {
        if (!validateStep(i)) {
          setStep(i);
          return;
        }
      }
    } else if (!type) {
      setErrors({ type: "Please choose a contribution type before saving a draft." });
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      await onSave(buildData(draft, !draft));
    } finally {
      setSaving(false);
    }
  };

  const err = (key: string) =>
    errors[key] ? (
      <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {errors[key]}
      </p>
    ) : null;

  if (configError) {
    return (
      <Card className="border-ocean-border">
        <CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-ocean-danger mx-auto" />
          <p className="text-sm text-ocean-text-secondary">{configError}</p>
          <Button variant="outline" onClick={() => {
            setConfig(null);
            setConfigError(null);
            getWizardConfig().then(setConfig).catch((e) => setConfigError(e?.message || "Still failing. Try again later."));
          }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-ocean-border">
      <CardHeader className="bg-ocean-light/50">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg text-ocean-navy">
            {mode === "add" ? "New Contribution" : "Edit Contribution"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-ocean-blue text-white"
                  : i < step
                    ? "bg-ocean-green/15 text-ocean-green hover:bg-ocean-green/25"
                    : "bg-ocean-light text-ocean-text-secondary"
              }`}
            >
              {i < step ? "✓ " : ""}{i + 1}. {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!config ? (
          <div className="py-12 text-center text-ocean-text-secondary text-sm">Loading submission options…</div>
        ) : (
          <>
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-ocean-navy flex items-center gap-2">
                    <Layers className="h-5 w-5 text-ocean-blue" />
                    What are you sharing?
                  </h3>
                  <p className="text-sm text-ocean-text-secondary mt-1">
                    Pick the type that best matches your contribution.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {primaryTypes.map((t) => (
                    <TypeCard key={t.value} t={t} selected={type === t.value} onSelect={() => setType(t.value)} />
                  ))}
                </div>
                <button
                  type="button"
                  className="text-sm text-ocean-blue hover:underline"
                  onClick={() => setShowOtherTypes((v) => !v)}
                >
                  {showOtherTypes ? "Hide other types" : "Other contribution types…"}
                </button>
                {showOtherTypes && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {otherTypes.map((t) => (
                      <TypeCard key={t.value} t={t} selected={type === t.value} onSelect={() => setType(t.value)} />
                    ))}
                  </div>
                )}
                {err("type")}
              </div>
            )}

            {step === 1 && typeCfg && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-ocean-navy flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-ocean-blue" />
                    Add media
                  </h3>
                  <p className="text-sm text-ocean-text-secondary mt-1">
                    Photos, recordings and documents that support your contribution.
                  </p>
                </div>
                {err("media")}
                <MediaField
                  label="Photos"
                  existing={remainingExisting.filter((m) => m.kind === "image" && m.role !== "location_photo" && m.role !== "setup_photo" && m.role !== "species_photo" && m.role !== "spectrogram")}
                  onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                  accept="image/*"
                  multiple
                  files={images}
                  onAdd={(files) => setImages((p) => [...p, ...files].slice(0, 10))}
                  onRemove={(i) => setImages((p) => p.filter((_, j) => j !== i))}
                />
                {typeCfg.media.required.some((f) => f.field === "location_photo") || typeCfg.media.optional.some((f) => f.field === "location_photo") ? (
                  <SingleFileRow
                    label="Location photo"
                    required={typeCfg.media.required.some((f) => f.field === "location_photo")}
                    accept="image/*"
                    file={locationPhoto}
                    onPick={setLocationPhoto}
                    existing={remainingExisting.find((m) => m.role === "location_photo")}
                    onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                  />
                ) : null}
                {typeCfg.media.optional.some((f) => f.field === "setup_images") ? (
                  <MediaField
                    label="Recording setup photo"
                    existing={remainingExisting.filter((m) => m.role === "setup_photo")}
                    onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                    accept="image/*"
                    multiple
                    files={setupImages}
                    onAdd={(files) => setSetupImages((p) => [...p, ...files].slice(0, 5))}
                    onRemove={(i) => setSetupImages((p) => p.filter((_, j) => j !== i))}
                  />
                ) : null}
                {typeCfg.media.optional.some((f) => f.field === "species_images") ? (
                  <MediaField
                    label="Species photo"
                    existing={remainingExisting.filter((m) => m.role === "species_photo")}
                    onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                    accept="image/*"
                    multiple
                    files={speciesImages}
                    onAdd={(files) => setSpeciesImages((p) => [...p, ...files].slice(0, 5))}
                    onRemove={(i) => setSpeciesImages((p) => p.filter((_, j) => j !== i))}
                  />
                ) : null}
                <SingleFileRow
                  label="Video"
                  required={typeCfg.media.required.some((f) => f.field === "video")}
                  accept="video/*"
                  file={video}
                  onPick={setVideo}
                  existing={remainingExisting.find((m) => m.kind === "video")}
                  onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                />
                <SingleFileRow
                  label="Audio file"
                  required={typeCfg.media.required.some((f) => f.field === "audio")}
                  accept="audio/*"
                  file={audio}
                  onPick={setAudio}
                  existing={remainingExisting.find((m) => m.kind === "audio" && m.role !== "voice_note")}
                  onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                />
                <SingleFileRow
                  label="Voice note"
                  required={false}
                  accept="audio/*"
                  file={voiceNote}
                  onPick={setVoiceNote}
                  existing={remainingExisting.find((m) => m.role === "voice_note")}
                  onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                />
                {typeCfg.media.optional.some((f) => f.field === "spectrogram") ? (
                  <SingleFileRow
                    label="Spectrogram image"
                    required={typeCfg.media.required.some((f) => f.field === "spectrogram")}
                    accept="image/*"
                    file={spectrogram}
                    onPick={setSpectrogram}
                    existing={remainingExisting.find((m) => m.role === "spectrogram")}
                    onRemoveExisting={(id) => setRemoveMediaIds((p) => [...p, id])}
                  />
                ) : null}
                <div>
                  <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Documents</Label>
                  <div className="space-y-2">
                    {remainingExisting
                      .filter((m) => m.kind === "document")
                      .map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded border border-ocean-border text-sm">
                          <a href={mediaUrl(m.url)} target="_blank" rel="noreferrer" className="text-ocean-blue hover:underline truncate">
                            {m.display_name}
                          </a>
                          <button type="button" onClick={() => setRemoveMediaIds((p) => [...p, m.id])} className="text-ocean-danger shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    {documents.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 p-2 rounded border border-ocean-border text-sm">
                        <span className="truncate">{f.name}</span>
                        <button type="button" onClick={() => setDocuments((p) => p.filter((_, j) => j !== i))} className="text-ocean-danger shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded border border-dashed border-ocean-border cursor-pointer hover:border-ocean-blue text-sm text-ocean-text-secondary hover:text-ocean-blue">
                      <Upload className="h-4 w-4" />
                      Upload document (PDF, Word, Excel, PPT, TXT)
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.docm,.dot,.dotx,.xls,.xlsx,.xlsm,.xlsb,.csv,.ppt,.pptx,.pps,.ppsx,.txt,.rtf,.odt,.ods,.odp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setDocuments((p) => [...p, ...files].slice(0, 5));
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && typeCfg && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-ocean-navy flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-ocean-blue" />
                    Where did this happen?
                    {typeCfg.requires_geotag && <span className="text-ocean-danger">*</span>}
                  </h3>
                  <p className="text-sm text-ocean-text-secondary mt-1">
                    {typeCfg.requires_geotag
                      ? "GPS coordinates are required for this contribution type."
                      : "GPS coordinates are optional but help place your contribution on the map."}
                  </p>
                </div>
                {err("gps")}
                {locError && (
                  <p className="text-xs text-ocean-danger flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{locError}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={locate} disabled={locating}>
                    <LocateFixed className="h-4 w-4 mr-2" />
                    {locating ? "Locating…" : "Use my current location"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => gpsPhotoInputRef.current?.click()}
                    disabled={readingGps}
                  >
                    <ImageUp className="h-4 w-4 mr-2" />
                    {readingGps ? "Reading…" : "Upload GPS photo"}
                  </Button>
                  <input
                    ref={gpsPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="hidden"
                    onChange={(e) => handleGpsPhoto(e.target.files?.[0] ?? null)}
                  />
                </div>
                <p className="text-[11px] text-ocean-text-secondary">
                  Tip: turn on Location when taking the photo so it saves GPS coordinates. The photo is only
                  used to read the location and is not uploaded.
                </p>
                {gpsPhotoMsg && (
                  <p className="text-xs text-ocean-green flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />{gpsPhotoMsg}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      min={-90}
                      max={90}
                      placeholder="13.0827"
                      value={latitude ?? ""}
                      onChange={(e) => setLatitude(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      min={-180}
                      max={180}
                      placeholder="80.2707"
                      value={longitude ?? ""}
                      onChange={(e) => setLongitude(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </div>
                </div>
                {(latitude != null && longitude != null) && (
                  <p className="text-xs text-ocean-green flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Location set: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </p>
                )}
              </div>
            )}

            {step === 3 && typeCfg && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-ocean-navy flex items-center gap-2">
                    <Eye className="h-5 w-5 text-ocean-blue" />
                    Details
                  </h3>
                  <p className="text-sm text-ocean-text-secondary mt-1">
                    Tell us more about this {typeCfg.label.toLowerCase()}.
                  </p>
                </div>
                <div>
                  <Label htmlFor="w-title" className="text-sm font-medium text-ocean-navy mb-1.5 block">
                    {type === "ocean_sound" ? "Name" : "Title"}
                  </Label>
                  <Input
                    id="w-title"
                    placeholder={type === "ocean_sound"
                      ? "Name for the sound library entry, e.g. Humpback whale moan"
                      : "Optional — auto-generated from your notes if left blank"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={errors.title ? "border-ocean-danger" : ""}
                  />
                  {err("title")}
                </div>
                <div>
                  <Label htmlFor="w-author" className="text-sm font-medium text-ocean-navy mb-1.5 block">Author name</Label>
                  <Input
                    id="w-author"
                    placeholder="Defaults to your account name"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">State</Label>
                    <Select
                      value={stateName}
                      onValueChange={(v) => {
                        setStateName(v);
                        setDistrictId("");
                        setVillageId("");
                        setDistricts([]);
                        setVillages([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">District</Label>
                    <Select
                      value={districtId}
                      onValueChange={(v) => {
                        setDistrictId(v);
                        setVillageId("");
                        setVillages([]);
                      }}
                      disabled={!stateName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={stateName ? "Select district" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Village</Label>
                    <Select value={villageId} onValueChange={setVillageId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select village" />
                      </SelectTrigger>
                      <SelectContent>
                        {villages.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}{v.zone_name ? ` (${v.zone_name})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {typeCfg.fields.some((f) => f.key === "species_level") && (
                  <SpeciesSection metadata={metadata} setMetadata={setMetadata} errors={errors} speciesGroups={config.species_groups} />
                )}

                <div className="space-y-4">
                  {typeCfg.fields
                    .filter((f) => f.section !== "species" && f.section !== "research")
                    .map((f) => (
                      <SchemaField key={f.key} field={f} value={metadata[f.key] || ""} onChange={(v) => setMetadata((p) => ({ ...p, [f.key]: v }))} error={errors[f.key]} />
                    ))}
                </div>

                {typeCfg.fields.some((f) => f.section === "research") && (
                  <div className="rounded-lg border border-ocean-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setResearchOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-ocean-light/40 text-sm font-medium text-ocean-navy hover:bg-ocean-light/70"
                    >
                      Research details
                      <ChevronRight className={`h-4 w-4 transition-transform ${researchOpen ? "rotate-90" : ""}`} />
                    </button>
                    {researchOpen && (
                      <div className="p-4 space-y-4 border-t border-ocean-border">
                        <p className="text-xs text-ocean-text-secondary">
                          Technical fields used by O3L researchers. Optional but appreciated.
                        </p>
                        {typeCfg.fields
                          .filter((f) => f.section === "research")
                          .map((f) => (
                            <SchemaField key={f.key} field={f} value={metadata[f.key] || ""} onChange={(v) => setMetadata((p) => ({ ...p, [f.key]: v }))} error={errors[f.key]} />
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {(typeCfg.text_fields || []).map((tf) => (
                  <div key={tf.key}>
                    <Label htmlFor={`tf-${tf.key}`} className="text-sm font-medium text-ocean-navy mb-1.5 block">
                      {tf.label}
                    </Label>
                    {tf.key === "description" ? (
                      <Textarea
                        id={`tf-${tf.key}`}
                        rows={4}
                        placeholder="Write the full description…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    ) : (
                      <Textarea
                        id={`tf-${tf.key}`}
                        rows={3}
                        placeholder={tf.label}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    )}
                  </div>
                ))}
                {typeCfg.text_fields.length === 0 && (
                  <div>
                    <Label htmlFor="w-notes" className="text-sm font-medium text-ocean-navy mb-1.5 block">Notes</Label>
                    <Textarea id="w-notes" rows={3} placeholder="Short description / notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {step === 4 && typeCfg && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-ocean-navy flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-ocean-green" />
                  Review &amp; submit
                </h3>
                <div className="rounded-lg border border-ocean-border divide-y divide-ocean-border text-sm">
                  {contributorType && (
                    <ReviewRow label="Identity" value={config.contributor_types.find((c) => c.value === contributorType)?.label || contributorType} />
                  )}
                  <ReviewRow label="Type" value={typeCfg.label} />
                  <ReviewRow
                    label={type === "ocean_sound" ? "Name" : "Title"}
                    value={title || "(auto-generated)"}
                  />
                  <ReviewRow label="Village" value={villages.find((v) => v.id === villageId)?.name || villageId || "(not set)"} />
                  <ReviewRow
                    label="GPS"
                    value={latitude != null && longitude != null ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : typeCfg.requires_geotag ? "Missing (required)" : "(not set)"}
                  />
                  <ReviewRow
                    label="Media"
                    value={[
                      images.length + remainingExisting.filter((m) => m.kind === "image").length > 0 ? "photos" : null,
                      locationPhoto || existingHas("image", "location_photo") ? "location photo" : null,
                      setupImages.length > 0 ? "setup" : null,
                      speciesImages.length > 0 ? "species" : null,
                      video ? "video" : null,
                      audio ? "audio" : null,
                      voiceNote ? "voice note" : null,
                      spectrogram || existingHas("image", "spectrogram") ? "spectrogram" : null,
                      documents.length > 0 ? "docs" : null,
                    ].filter(Boolean).join(", ") || "none"}
                  />
                  {Object.entries(metadata).filter(([, v]) => v !== "").map(([k, v]) => {
                    const field = typeCfg.fields.find((f) => f.key === k);
                    const label = field?.label || k;
                    let display = v;
                    if (field?.type === "choice" && field.choices) {
                      display = field.choices.find((c) => c.value === v)?.label || v;
                    }
                    return <ReviewRow key={k} label={label} value={display} />;
                  })}
                </div>
                {metadata.species_level === "unknown" && (
                  <p className="text-xs text-ocean-warning bg-ocean-warning/10 rounded p-2">
                    Species identification is unknown — this will be routed to scientific review for expert ID.
                  </p>
                )}
                <p className="text-xs text-ocean-text-secondary">
                  Submit for review, or save as a draft to finish later. Drafts skip GPS, media and detail requirements.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-6 mt-2 border-t border-ocean-border">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || saving}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => handleSave(true)} disabled={saving}>
                  Save draft
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={goNext} disabled={saving || !config}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="button" onClick={() => handleSave(false)} disabled={saving}>
                    <Save className="h-4 w-4 mr-1.5" />
                    {saving ? "Saving…" : mode === "add" ? "Submit contribution" : "Save changes"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TypeCard({ t, selected, onSelect }: { t: WizardTypeConfig; selected: boolean; onSelect: () => void }) {
  const Icon = TYPE_ICONS[t.value] || BookOpen;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors ${
        selected
          ? "border-ocean-blue bg-ocean-blue/10"
          : "border-ocean-border hover:border-ocean-blue/50"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <Icon className={`h-5 w-5 ${selected ? "text-ocean-blue" : "text-ocean-muted"}`} />
        {selected && <CheckCircle2 className="h-4 w-4 text-ocean-blue" />}
      </div>
      <span className="font-medium text-sm text-ocean-navy">{t.label}</span>
      <span className="text-xs text-ocean-text-secondary leading-snug">{t.description}</span>
    </button>
  );
}

function SpeciesSection({
  metadata, setMetadata, errors, speciesGroups,
}: {
  metadata: Record<string, string>;
  setMetadata: (fn: (p: Record<string, string>) => Record<string, string>) => void;
  errors: Record<string, string>;
  speciesGroups: { value: string; label: string }[];
}) {
  const level = metadata.species_level || "";
  return (
    <div className="rounded-lg border border-ocean-border p-4 space-y-4 bg-ocean-light/20">
      <Label className="text-sm font-medium text-ocean-navy block">
        Species identification <span className="text-ocean-danger">*</span>
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: "known", label: "I know the species" },
          { value: "approximate", label: "I know approximately" },
          { value: "unknown", label: "I don't know" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setMetadata((p) => ({ ...p, species_level: opt.value }))}
            className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${
              level === opt.value
                ? "border-ocean-blue bg-ocean-blue/10 text-ocean-navy"
                : "border-ocean-border text-ocean-text-secondary hover:border-ocean-blue/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {errors.species_level && (
        <p className="text-xs text-ocean-danger flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />{errors.species_level}
        </p>
      )}
      {level === "known" && (
        <div>
          <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">
            Species name <span className="text-ocean-danger">*</span>
          </Label>
          <Input
            placeholder="e.g. Spinner dolphin"
            value={metadata.species_name || ""}
            onChange={(e) => setMetadata((p) => ({ ...p, species_name: e.target.value }))}
            className={errors.species_name ? "border-ocean-danger" : ""}
          />
          {errors.species_name && (
            <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.species_name}
            </p>
          )}
        </div>
      )}
      {level === "approximate" && (
        <div>
          <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">
            Species group <span className="text-ocean-danger">*</span>
          </Label>
          <Select
            value={metadata.species_group || ""}
            onValueChange={(v) => setMetadata((p) => ({ ...p, species_group: v }))}
          >
            <SelectTrigger className={errors.species_group ? "border-ocean-danger" : ""}>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {speciesGroups.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.species_group && (
            <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.species_group}
            </p>
          )}
        </div>
      )}
      {level === "unknown" && (
        <p className="text-xs text-ocean-text-secondary bg-ocean-warning/10 rounded p-2">
          No problem — O3L experts will help identify this. Your submission goes to scientific review.
        </p>
      )}
    </div>
  );
}

function SchemaField({
  field, value, onChange, error,
}: {
  field: WizardField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const id = `sf-${field.key}`;
  if (field.type === "choice" && field.choices) {
    return (
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-ocean-navy mb-1.5 block">
          {field.label}
          {field.required && <span className="text-ocean-danger ml-0.5">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id} className={error ? "border-ocean-danger" : ""}>
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.choices.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.help && <p className="text-xs text-ocean-text-secondary mt-1">{field.help}</p>}
        {error && (
          <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />{error}
          </p>
        )}
      </div>
    );
  }
  if (field.type === "text") {
    return (
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-ocean-navy mb-1.5 block">
          {field.label}
          {field.required && <span className="text-ocean-danger ml-0.5">*</span>}
        </Label>
        <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
        {field.help && <p className="text-xs text-ocean-text-secondary mt-1">{field.help}</p>}
        {error && (
          <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />{error}
          </p>
        )}
      </div>
    );
  }
  const inputType = field.type === "integer" || field.type === "float" ? "number" : field.type === "date" ? "date" : "text";
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-ocean-navy mb-1.5 block">
        {field.label}
        {field.required && <span className="text-ocean-danger ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        type={inputType}
        step={field.type === "float" ? "any" : field.type === "integer" ? "1" : undefined}
        min={field.min}
        max={field.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-ocean-danger" : ""}
      />
      {field.help && <p className="text-xs text-ocean-text-secondary mt-1">{field.help}</p>}
      {error && (
        <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />{error}
        </p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-ocean-text-secondary shrink-0">{label}</span>
      <span className="text-ocean-navy text-right font-medium">{value}</span>
    </div>
  );
}

function MediaField({
  label, existing, onRemoveExisting, accept, multiple, files, onAdd, onRemove,
}: {
  label: string;
  existing: ExistingMediaItem[];
  onRemoveExisting: (id: string) => void;
  accept: string;
  multiple: boolean;
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">{label}</Label>
      <div className="flex flex-wrap gap-3">
        {existing.map((m) => (
            <div key={m.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-ocean-border group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(m.url)} alt={m.display_name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveExisting(m.id)}
                className="absolute top-1 right-1 bg-ocean-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        {files.map((f, i) => (
          <div key={`${f.name}-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-ocean-border group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-ocean-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="w-24 h-24 rounded-lg border-2 border-dashed border-ocean-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-ocean-blue text-ocean-text-secondary hover:text-ocean-blue">
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs">Add</span>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              onAdd(picked);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function SingleFileRow({
  label, required, accept, file, onPick, existing, onRemoveExisting,
}: {
  label: string;
  required: boolean;
  accept: string;
  file: File | null;
  onPick: (f: File | null) => void;
  existing?: ExistingMediaItem;
  onRemoveExisting: (id: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">
        {label}
        {required && <span className="text-ocean-danger ml-0.5">*</span>}
      </Label>
      {existing && (
        <div className="flex items-center justify-between gap-2 p-2 mb-2 rounded border border-ocean-border text-sm">
          <a href={mediaUrl(existing.url)} target="_blank" rel="noreferrer" className="text-ocean-blue hover:underline truncate">
            {existing.display_name}
          </a>
          <button type="button" onClick={() => onRemoveExisting(existing.id)} className="text-ocean-danger shrink-0">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <label className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded border border-dashed border-ocean-border cursor-pointer hover:border-ocean-blue text-sm text-ocean-text-secondary hover:text-ocean-blue">
          <Upload className="h-4 w-4 shrink-0" />
          <span className="truncate">{file ? file.name : `Choose ${label.toLowerCase()}`}</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
        </label>
        {file && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onPick(null)}>
            <Trash2 className="h-4 w-4 text-ocean-danger" />
          </Button>
        )}
      </div>
    </div>
  );
}
