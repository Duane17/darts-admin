"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IconArrowLeft, IconDeviceFloppy, IconPlus, IconX } from "@tabler/icons-react";
import { PhotoUploader } from "@/components/leaders/photo-uploader";
import type { Leader } from "@/lib/api-types";

export default function NewLeaderPage() {
  const router = useRouter();
  const qc = useQueryClient();

  // form state
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [profile, setProfile] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);

  const [education, setEducation] = React.useState<string[]>([]);
  const [achievements, setAchievements] = React.useState<string[]>([]);
  const [responsibilities, setResponsibilities] = React.useState<string[]>([]);
  const [eduInput, setEduInput] = React.useState("");
  const [achInput, setAchInput] = React.useState("");
  const [respInput, setRespInput] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addTo = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    const v = value.trim();
    if (!v) return;
    setter((prev) => [...prev, v]);
  };

  const removeFrom = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("title", title.trim());
      fd.set("tagline", tagline.trim());
      fd.set("profile", profile.trim());
      fd.set("bio", bio.trim());
      fd.set("active", String(active));
      education.forEach((v) => fd.append("education", v));
      achievements.forEach((v) => fd.append("achievements", v));
      responsibilities.forEach((v) => fd.append("responsibilities", v));
      if (photoFile) fd.set("photo", photoFile);

      await http.post<Leader>("/leaders", fd);
      qc.invalidateQueries({ queryKey: ["leaders"] });
      router.push("/leaders");
    } catch (err: any) {
      setError(err?.message || "Failed to create leader");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-ink)]">
            Add New Leader
          </h1>
        </div>

        <Button
          className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
          onClick={onSave}
          disabled={saving}
        >
          <IconDeviceFloppy className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save Leader"}
        </Button>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm p-6 space-y-4">
        <PhotoUploader file={photoFile} onFileChange={setPhotoFile} note="JPG/PNG/WEBP/GIF · max 3MB" />

        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="profile">Profile</Label>
          <Textarea id="profile" rows={4} value={profile} onChange={(e) => setProfile(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={6} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>

        {/* List editors */}
        <ListEditor
          label="Education"
          items={education}
          onAdd={(v) => addTo(setEducation, v)}
          onRemove={(i) => removeFrom(setEducation, i)}
          inputValue={eduInput}
          onInputChange={setEduInput}
          placeholder="Add degree, institution, year…"
        />

        <ListEditor
          label="Achievements"
          items={achievements}
          onAdd={(v) => addTo(setAchievements, v)}
          onRemove={(i) => removeFrom(setAchievements, i)}
          inputValue={achInput}
          onInputChange={setAchInput}
          placeholder="Add award, milestone…"
        />

        <ListEditor
          label="Responsibilities"
          items={responsibilities}
          onAdd={(v) => addTo(setResponsibilities, v)}
          onRemove={(i) => removeFrom(setResponsibilities, i)}
          inputValue={respInput}
          onInputChange={setRespInput}
          placeholder="Add responsibility…"
        />

        <div className="flex items-center gap-2 pt-1">
          <Checkbox id="active" checked={active} onCheckedChange={(v) => setActive(Boolean(v))} />
          <Label htmlFor="active">Active</Label>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function ListEditor({
  label,
  items,
  onAdd,
  onRemove,
  inputValue,
  onInputChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (idx: number) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd(inputValue);
              onInputChange("");
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onAdd(inputValue);
            onInputChange("");
          }}
        >
          <IconPlus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="mt-1 space-y-2">
          {items.map((item, idx) => (
            <li
              key={`${item}-${idx}`}
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-white px-3 py-2"
            >
              <span className="truncate">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(idx)}
                title="Remove"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">No {label.toLowerCase()} added.</p>
      )}
    </div>
  );
}
