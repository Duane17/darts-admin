// src/components/content/about-content-form.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconTrash,
  IconDeviceFloppy,
  IconUpload,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
  IconPlus,
} from "@tabler/icons-react";
import { mediaUrl } from "@/lib/media";
import { uploadImage, getAboutContent, putAboutContent } from "@/lib/api-client";
import type { AboutContent } from "@/lib/api-types";

/** simple uid for local items */
function uid() {
  return Math.random().toString(36).slice(2);
}

/** Image field with fixed aspect ratio and upload button */
function ImageField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  uploadName: string;
  helper?: string;
  category: "about";
  ratio?: `${number}/${number}`; // eg "16/9", "4/3"
}) {
  const [busy, setBusy] = useState(false);
  const ratio = props.ratio || "16/9";

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
              <div className="w-full rounded overflow-hidden" style={{ aspectRatio: ratio }}>
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

export default function AboutContentForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hero
  const [heroBg, setHeroBg] = useState("");
  const [heroCopy, setHeroCopy] = useState(""); // optional copy

  // Mission and Vision
  const [sectionBg, setSectionBg] = useState("");
  const [missionBg, setMissionBg] = useState("");
  const [visionBg, setVisionBg] = useState("");
  const [motto, setMotto] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");

  // Core Values
  const [coreValuesSectionBg, setCoreValuesSectionBg] = useState("");
  const [coreValueItems, setCoreValueItems] = useState<
    Array<{ id?: string; title: string; desc: string; bgImage: string }>
  >([]);

  // load existing content
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAboutContent();
        if (mounted && data) {
          setHeroBg(data.heroBg || "");
          // optional copy lives inside missionVision.motto or dedicated slot. If you want hero level copy, store separately on API.
          // For acceptance, we keep hero copy optional and post it inside missionVision.motto prefix if you want. Otherwise leave as UI only.
          // This keeps a clean UI and does not break your types.
          setHeroCopy(""); 

          setSectionBg(data.missionVision?.sectionBg || "");
          setMissionBg(data.missionVision?.missionBg || "");
          setVisionBg(data.missionVision?.visionBg || "");
          setMotto(data.missionVision?.motto || "");
          setMission(data.missionVision?.mission || "");
          setVision(data.missionVision?.vision || "");

          setCoreValuesSectionBg(data.coreValues?.sectionBg || "");
          const items = data.coreValues?.items || [];
          setCoreValueItems(items.map(i => ({ id: uid(), ...i })));
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load About content");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // minimal validation to ensure good saves and previews
  const canSave = useMemo(() => {
    if (!heroBg) return false;
    if (!sectionBg || !missionBg || !visionBg) return false;
    if (!mission || !vision) return false;
    for (const it of coreValueItems) {
      if (!it.title || !it.desc || !it.bgImage) return false;
    }
    return true;
  }, [heroBg, sectionBg, missionBg, visionBg, mission, vision, coreValueItems]);

  // Core values helpers
  const addCoreValue = () => {
    setCoreValueItems(prev => [
      ...prev,
      { id: uid(), title: "", desc: "", bgImage: "" },
    ]);
  };

  const removeCoreValue = (id?: string) => {
    setCoreValueItems(prev => prev.filter(i => i.id !== id));
  };

  const updateCoreValue = (id: string | undefined, patch: Partial<{ title: string; desc: string; bgImage: string }>) => {
    setCoreValueItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
  };

  const moveCoreValue = (id: string | undefined, dir: "up" | "down") => {
    setCoreValueItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
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
      const payload: AboutContent = {
        heroBg,
        missionVision: {
          sectionBg,
          missionBg,
          visionBg,
          motto,
          mission,
          vision,
        },
        coreValues: {
          sectionBg: coreValuesSectionBg,
          items: coreValueItems.map(({ title, desc, bgImage }) => ({
            title,
            desc,
            bgImage,
          })),
        },
      };
      const saved = await putAboutContent(payload);

      // normalize local state with what server stored
      setHeroBg(saved.heroBg);
      setSectionBg(saved.missionVision.sectionBg);
      setMissionBg(saved.missionVision.missionBg);
      setVisionBg(saved.missionVision.visionBg);
      setMotto(saved.missionVision.motto);
      setMission(saved.missionVision.mission);
      setVision(saved.missionVision.vision);
      setCoreValuesSectionBg(saved.coreValues.sectionBg);
      setCoreValueItems(saved.coreValues.items.map(i => ({ id: uid(), ...i })));
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
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="section-title text-[var(--text-section)] md:text-[var(--text-page)] font-semibold">
          About content
        </h1>
        <div className="text-sm text-[var(--color-ink-muted)]">
          Hero, Mission and Vision, Core Values
        </div>
      </div>

      {!!error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <IconAlertCircle className="h-4 w-4 mt-0.5" />
          <span>{String(error)}</span>
        </div>
      )}

      {/* Hero block */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageField
            label="Hero background"
            value={heroBg}
            onChange={setHeroBg}
            uploadName="about-hero"
            category="about"
            helper="Wide image recommended. Ensure good contrast for overlay copy."
          />
        </CardContent>
      </Card>

      {/* Mission and Vision */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Mission and Vision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ImageField
              label="Mission background"
              value={missionBg}
              onChange={setMissionBg}
              uploadName="about-mission-bg"
              category="about"
              helper="Shown behind Mission text."
              ratio="4/3"
            />
            <ImageField
              label="Vision background"
              value={visionBg}
              onChange={setVisionBg}
              uploadName="about-vision-bg"
              category="about"
              helper="Shown behind Vision text."
              ratio="4/3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Core Values */}
      <Card className="glass-panel">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Core Values</CardTitle>
          <div className="flex items-center gap-2">
            <Button className="btn btn-secondary-green" type="button" onClick={addCoreValue}>
              <IconPlus className="h-4 w-4 mr-1" />
              Add value
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {coreValueItems.map((item, idx) => {
              const complete = !!(item.title && item.desc && item.bgImage);
              return (
                <div key={item.id || idx} className="rounded-lg border p-4 space-y-4 bg-white/60">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="badge badge-gold">Value {idx + 1}</span>{" "}
                      {!complete && <span className="badge badge-red ml-2">Incomplete</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => moveCoreValue(item.id, "up")}
                        title="Move up"
                      >
                        <IconArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => moveCoreValue(item.id, "down")}
                        title="Move down"
                      >
                        <IconArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`cv-title-${item.id}`}>Title</Label>
                      <Input
                        id={`cv-title-${item.id}`}
                        value={item.title}
                        onChange={(e) => updateCoreValue(item.id, { title: e.target.value })}
                        placeholder="Integrity"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <ImageField
                        label="Background image"
                        value={item.bgImage}
                        onChange={(v) => updateCoreValue(item.id, { bgImage: v })}
                        uploadName={`core-value-${item.title || "item"}`}
                        category="about"
                        helper="Shown behind this value on the About page."
                        ratio="4/3"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* sticky save bar */}
      <div className="sticky bottom-0 z-10 mx-auto max-w-5xl">
        <div className="glass-panel rounded-[var(--radius-panel)] border p-3 flex items-center justify-between">
          <div className="text-sm text-[var(--color-ink-muted)]">
            {canSave ? "All fields look good" : "Fill required fields before saving"}
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
