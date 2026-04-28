// src/app/(dashboard)/content/home/page-client.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconTrash,
  IconDeviceFloppy,
  IconUpload,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
  IconPhotoPlus,
} from "@tabler/icons-react";
import { mediaUrl } from "@/lib/media";
import { uploadImage, getHomeContent, putHomeContent } from "@/lib/api-client";
import type { HomeContent, ProgrammeItem } from "@/lib/api-types";

const HERO_MAX = 4;

function uid() {
  return Math.random().toString(36).slice(2);
}

function isItemComplete(p: ProgrammeItem) {
  return !!(p.id && p.title && p.description && p.bgImage);
}

/** Reusable image upload field with 16/9 preview */
function ImageField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  uploadName: string;
  helper?: string;
  category: "home" | "about" | "teams" | "leaders" | "posts" | "announcements" | "misc";
}) {
  const [busy, setBusy] = useState(false);

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadImage({ file, category: props.category, name: props.uploadName });
      props.onChange(path);
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <div className="grid gap-3 md:grid-cols-[1fr,auto]">
        <div className="space-y-2">
          {props.value ? (
            <div className="rounded-md border bg-white p-2">
              <div className="w-full rounded overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img
                  src={mediaUrl(props.value)}
                  alt={`${props.label} preview`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-[var(--color-ink-muted)]">
              No image selected
            </div>
          )}
          {!!props.helper && (
            <p className="text-xs text-[var(--color-ink-muted)]">{props.helper}</p>
          )}
        </div>
        <div className="flex md:flex-col gap-2">
          <label className="btn btn-outline-gold cursor-pointer inline-flex items-center gap-2">
            <IconUpload className="h-4 w-4" />
            <span>{busy ? "Uploading..." : "Upload"}</span>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await handleUpload(f);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

/** A single numbered hero slideshow slot with reorder and remove controls */
function HeroSlide(props: {
  index: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const { index, total, value, onChange, onRemove, onMove } = props;

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-white/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge badge-gold">Slide {index + 1}</span>
          {index === 0 && (
            <span className="text-xs text-[var(--color-ink-muted)]">(shown first)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            className="btn btn-ghost"
            onClick={() => onMove("up")}
            disabled={index === 0}
            title="Move up"
          >
            <IconArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            className="btn btn-ghost"
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            title="Move down"
          >
            <IconArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            className="btn btn-ghost text-red-500 hover:text-red-700"
            onClick={onRemove}
            title="Remove slide"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ImageField
        label="Slide image"
        value={value}
        onChange={onChange}
        uploadName={`hero-slide-${index + 1}`}
        category="home"
        helper={
          index === 0
            ? "First slide — displayed immediately on page load. Use a high-contrast image."
            : "Use a wide 16:9 image with strong contrast for overlay text."
        }
      />
    </div>
  );
}

export default function HomeContentForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [heroBgs, setHeroBgs] = useState<string[]>([]);
  const [ctaBg, setCtaBg] = useState("");
  const [programmes, setProgrammes] = useState<ProgrammeItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHomeContent();
        if (mounted && data) {
          // Backwards compat: server may return legacy { heroBg } or canonical { heroBgs }
          const raw = data as any;
          const images: string[] =
            Array.isArray(raw.heroBgs) && raw.heroBgs.length > 0
              ? raw.heroBgs
              : raw.heroBg
              ? [raw.heroBg]
              : [];
          setHeroBgs(images);
          setCtaBg(data.ctaBg || "");
          setProgrammes((data.programmes || []).map((p) => ({ ...p })));
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load content");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const canSave = useMemo(() => {
    if (heroBgs.length === 0 || heroBgs.some((v) => !v)) return false;
    if (!ctaBg) return false;
    return programmes.every(isItemComplete);
  }, [heroBgs, ctaBg, programmes]);

  // Hero slide mutations
  const addHeroSlide = useCallback(() => {
    setHeroBgs((prev) => (prev.length < HERO_MAX ? [...prev, ""] : prev));
  }, []);

  const removeHeroSlide = useCallback((idx: number) => {
    setHeroBgs((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateHeroSlide = useCallback((idx: number, value: string) => {
    setHeroBgs((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }, []);

  const moveHeroSlide = useCallback((idx: number, dir: "up" | "down") => {
    setHeroBgs((prev) => {
      const next = prev.slice();
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  // Programme mutations
  const removeProgramme = (id: string) =>
    setProgrammes((prev) => prev.filter((p) => p.id !== id));

  const updateProgramme = (id: string, patch: Partial<ProgrammeItem>) =>
    setProgrammes((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const moveProgramme = (id: string, dir: "up" | "down") => {
    setProgrammes((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const next = prev.slice();
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Note: cast needed until HomeContent in api-types.ts is updated to use heroBgs
      const payload = { heroBgs, ctaBg, programmes } as unknown as HomeContent;
      const saved = await putHomeContent(payload);
      const raw = saved as any;
      setHeroBgs(Array.isArray(raw.heroBgs) ? raw.heroBgs : []);
      setCtaBg(saved.ctaBg);
      setProgrammes(saved.programmes.slice());
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-[var(--radius-panel)] p-4 text-[var(--text-body)]">
        Loading content...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="section-title text-[var(--text-section)] md:text-[var(--text-page)] font-semibold">
          Home content
        </h1>
        <div className="text-sm text-[var(--color-ink-muted)]">
          Update hero slideshow, CTA band, and profile sections
        </div>
      </div>

      {!!error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <IconAlertCircle className="h-4 w-4 mt-0.5" />
          <span>{String(error)}</span>
        </div>
      )}

      {/* Hero slideshow */}
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hero slideshow</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-ink-muted)]">
                {heroBgs.length} / {HERO_MAX} slides
              </span>
              <Button
                type="button"
                className="btn btn-outline-gold inline-flex items-center gap-2"
                onClick={addHeroSlide}
                disabled={heroBgs.length >= HERO_MAX}
              >
                <IconPhotoPlus className="h-4 w-4" />
                Add slide
              </Button>
            </div>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Up to {HERO_MAX} images. The first slide is shown on page load — reorder using the arrows.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {heroBgs.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center space-y-3">
              <p className="text-sm text-[var(--color-ink-muted)]">No slides added yet.</p>
              <Button
                type="button"
                className="btn btn-outline-gold inline-flex items-center gap-2"
                onClick={addHeroSlide}
              >
                <IconPhotoPlus className="h-4 w-4" />
                Add first slide
              </Button>
            </div>
          ) : (
            heroBgs.map((img, idx) => (
              <HeroSlide
                key={idx}
                index={idx}
                total={heroBgs.length}
                value={img}
                onChange={(v) => updateHeroSlide(idx, v)}
                onRemove={() => removeHeroSlide(idx)}
                onMove={(dir) => moveHeroSlide(idx, dir)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* CTA band */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>CTA band background</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageField
            label="CTA image"
            value={ctaBg}
            onChange={setCtaBg}
            uploadName="cta"
            category="home"
            helper="Shown behind the call-to-action band."
          />
        </CardContent>
      </Card>

      {/* Profile sections */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Profile sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {programmes.map((p, idx) => {
              const complete = isItemComplete(p);
              return (
                <div key={p.id || idx} className="rounded-lg border p-4 space-y-4 bg-white/60">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="badge badge-gold">Section {idx + 1}</span>{" "}
                      {!complete && <span className="badge badge-red ml-2">Incomplete</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => moveProgramme(p.id, "up")}
                        title="Move up"
                      >
                        <IconArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => moveProgramme(p.id, "down")}
                        title="Move down"
                      >
                        <IconArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${p.id}`}>Title</Label>
                      <Input
                        id={`title-${p.id}`}
                        value={p.title}
                        onChange={(e) => updateProgramme(p.id, { title: e.target.value })}
                        placeholder="Section title"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <ImageField
                        label="Background image"
                        value={p.bgImage}
                        onChange={(v) => updateProgramme(p.id, { bgImage: v })}
                        uploadName={`profile-${p.title || "item"}`}
                        category="home"
                        helper="Shown behind this section on the home page."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 mx-auto max-w-5xl">
        <div className="glass-panel rounded-[var(--radius-panel)] border p-3 flex items-center justify-between">
          <div className="text-sm text-[var(--color-ink-muted)]">
            {canSave ? "All fields look good" : "Fill all required fields before saving"}
          </div>
          <Button
            onClick={onSave}
            disabled={!canSave || saving}
            className="btn btn-secondary-green inline-flex items-center gap-2"
          >
            <IconDeviceFloppy className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save changes"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}