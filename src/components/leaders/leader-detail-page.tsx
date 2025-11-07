// src/components/leaders/leader-detail-page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLeaderBySlug, deleteLeader } from "@/lib/api-client";
import { http } from "@/lib/http";
import { mediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconTrash,
  IconPlus,
  IconX,
  IconUpload,
  IconPhoto,
} from "@tabler/icons-react";
import type { Leader } from "@/lib/api-types";

/* ----------------------------- helpers ----------------------------- */

function buildLeaderForm(
  patch: Partial<Leader> & {
    photoFile?: File | null;
    education?: string[];
    achievements?: string[];
    responsibilities?: string[];
  }
) {
  const fd = new FormData();
  if (patch.slug != null) fd.set("slug", patch.slug);
  if (patch.name != null) fd.set("name", patch.name);
  if (patch.title != null) fd.set("title", patch.title);
  if ((patch as any).tagline != null) fd.set("tagline", String((patch as any).tagline));
  if ((patch as any).profile != null) fd.set("profile", String((patch as any).profile));
  if ((patch as any).email != null) fd.set("email", String((patch as any).email));
  if ((patch as any).phone != null) fd.set("phone", String((patch as any).phone));
  if ((patch as any).location != null) fd.set("location", String((patch as any).location));
  if ((patch as any).bio != null) fd.set("bio", String((patch as any).bio));
  if (typeof patch.active === "boolean") fd.set("active", String(patch.active));

  const appendArray = (key: string, arr?: string[]) => {
    if (!Array.isArray(arr)) return;
    for (const v of arr) {
      const val = v?.trim();
      if (val) fd.append(key, val);
    }
  };
  appendArray("education", patch.education);
  appendArray("achievements", patch.achievements);
  appendArray("responsibilities", patch.responsibilities);

  if (patch.photoFile) fd.set("photo", patch.photoFile);
  return fd;
}

/* ------------------------- Photo uploader UI ------------------------ */

type PhotoUploaderProps = {
  currentUrl?: string | null;
  file: File | null;
  onFileChange: (f: File | null) => void;
  className?: string;
  note?: string;
};

function PhotoUploader({ currentUrl, file, onFileChange, className, note }: PhotoUploaderProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function validateAndSet(files?: FileList | null) {
    setError(null);
    if (!files || !files.length) return;
    const f = files[0];
    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!okTypes.includes(f.type)) {
      setError("Only JPEG, PNG, WEBP, GIF are allowed.");
      return;
    }
    const max = 3 * 1024 * 1024;
    if (f.size > max) {
      setError("Image must be 3MB or smaller.");
      return;
    }
    onFileChange(f);
  }

  return (
    <div className={className}>
      <Label>Photo</Label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          validateAndSet(e.dataTransfer.files);
        }}
        className={[
          "mt-2 group relative overflow-hidden rounded-xl border border-dashed",
          dragOver ? "border-[var(--color-green)] bg-[var(--color-green)]/5" : "border-[var(--color-border)] bg-white",
          "transition-colors",
        ].join(" ")}
      >
        {preview ? (
          <div className="relative aspect-square w-full max-w-[240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          </div>
        ) : currentUrl ? (
          <div className="relative aspect-square w-full max-w-[240px]">
            <Image
              src={mediaUrl(currentUrl)}
              alt="Current photo"
              fill
              sizes="240px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full max-w-[240px] items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-[var(--color-ink-muted)]">
              <IconPhoto className="h-8 w-8" />
              <span className="text-sm">No photo</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 hidden items-end justify-between gap-2 p-2 group-hover:flex">
          <div className="pointer-events-none" />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              <IconUpload className="mr-1 h-4 w-4" />
              {preview || currentUrl ? "Replace" : "Upload"}
            </Button>
            {(preview || currentUrl) && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => onFileChange(null)}
                title="Remove"
              >
                <IconX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2 sm:hidden">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <IconUpload className="mr-1 h-4 w-4" />
          {preview || currentUrl ? "Replace photo" : "Upload photo"}
        </Button>
        {(preview || currentUrl) && (
          <Button type="button" variant="outline" onClick={() => onFileChange(null)}>
            <IconX className="mr-1 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        id="photo"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files)}
      />

      <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{note ?? "JPG/PNG/WEBP/GIF · max 3MB"}</p>

      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- main page ---------------------------- */

export default function LeaderEditPage({ slug }: { slug: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  const leaderQ = useQuery({
    queryKey: ["leader", slug],
    queryFn: () => getLeaderBySlug(slug),
  });

  // Form state
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [profile, setProfile] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);

  // Arrays
  const [education, setEducation] = React.useState<string[]>([]);
  const [achievements, setAchievements] = React.useState<string[]>([]);
  const [responsibilities, setResponsibilities] = React.useState<string[]>([]);
  const [eduInput, setEduInput] = React.useState("");
  const [achInput, setAchInput] = React.useState("");
  const [respInput, setRespInput] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const l = leaderQ.data as any;
    if (!l) return;
    setName(l.name ?? "");
    setTitle(l.title ?? "");
    setTagline(l.tagline ?? "");
    setProfile(l.profile ?? "");
    setBio(l.bio ?? "");
    setActive(Boolean(l.active));
    setPhotoFile(null);

    setEducation(Array.isArray(l.education) ? l.education : []);
    setAchievements(Array.isArray(l.achievements) ? l.achievements : []);
    setResponsibilities(Array.isArray(l.responsibilities) ? l.responsibilities : []);

    setEduInput("");
    setAchInput("");
    setRespInput("");
    setError(null);
  }, [leaderQ.data]);

  const addTo = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    const v = value.trim();
    if (!v) return;
    setter((prev) => [...prev, v]);
  };
  const removeFrom = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  async function onSave() {
    if (!leaderQ.data) return;
    setSaving(true);
    setError(null);
    try {
      const fd = buildLeaderForm({
        name: name.trim(),
        title: title.trim(),
        tagline: tagline.trim(),
        profile: profile.trim(),
        bio: bio.trim(),
        active,
        photoFile,
        education,
        achievements,
        responsibilities,
      });

      await http.patch<Leader>(`/leaders/${encodeURIComponent((leaderQ.data as any).id)}`, fd);

      qc.invalidateQueries({ queryKey: ["leaders"] });
      qc.invalidateQueries({ queryKey: ["leader", slug] });
    } catch (err: any) {
      setError(err?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!leaderQ.data) return;
    if (!confirm("Delete this leader?")) return;
    await deleteLeader((leaderQ.data as any).id);
    qc.invalidateQueries({ queryKey: ["leaders"] });
    router.push("/leaders");
  }

  if (leaderQ.isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-[var(--color-ink-muted)]">Loading…</div>;
  }
  if (leaderQ.error || !leaderQ.data) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-red-600">Leader not found</div>;
  }

  const l = leaderQ.data as any;

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-ink)]">Edit leader</h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{l.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={onDelete}>
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90" onClick={onSave} disabled={saving}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <PhotoUploader
              currentUrl={l.photo}
              file={photoFile}
              onFileChange={setPhotoFile}
              note="JPG/PNG/WEBP/GIF · max 3MB"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
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

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] bg-white/60 px-5 md:px-6 py-4 rounded-b-2xl">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90" onClick={onSave} disabled={saving}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- small list editor --------------------------- */

function ListEditor(props: {
  label: string;
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (idx: number) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  placeholder?: string;
}) {
  const { label, items, onAdd, onRemove, inputValue, onInputChange, placeholder } = props;

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
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(idx)} title="Remove">
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
