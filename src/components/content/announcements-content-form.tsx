"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconDeviceFloppy,
  IconUpload,
  IconAlertCircle,
  IconTrash,
} from "@tabler/icons-react";
import { mediaUrl } from "@/lib/media";
import {
  uploadImage,
  getAnnouncementsContent,
  putAnnouncementsContent,
  deleteAnnouncementsContent,
} from "@/lib/api-client";
import type { AnnouncementsContent } from "@/lib/api-types";

/** Image field with preview and upload */
function ImageField(props: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
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
              <div
                className="w-full rounded overflow-hidden"
                style={{ aspectRatio: "16/9" }}
              >
                <img
                  src={mediaUrl(props.value)}
                  alt={`${props.label} preview`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-[var(--color-ink-muted)]">
              No background image set
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
          {props.value && (
            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => props.onChange(null)}
            >
              <IconTrash className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsContentForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAnnouncementsContent();
        if (mounted) {
          setBackgroundImage(data.backgroundImage ?? null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load content");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: AnnouncementsContent = { backgroundImage };
      const saved = await putAnnouncementsContent(payload);
      setBackgroundImage(saved.backgroundImage ?? null);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Remove the background image? The page will have no custom background.")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAnnouncementsContent();
      setBackgroundImage(null);
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-[var(--radius-panel)] p-4 text-[var(--text-body)]">
        Loading announcements page settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-[var(--text-section)] md:text-[var(--text-page)] font-semibold">
          Announcements Page Background
        </h1>
        <div className="text-sm text-[var(--color-ink-muted)]">
          Set a global background for the /announcements page
        </div>
      </div>

      {!!error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <IconAlertCircle className="h-4 w-4 mt-0.5" />
          <span>{String(error)}</span>
        </div>
      )}

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Background Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageField
            label="Page background"
            value={backgroundImage}
            onChange={setBackgroundImage}
            uploadName="announcements-bg"
            category="announcements"
            helper="Recommended width: 1920px. The image will cover the entire page behind the content."
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              disabled={deleting || !backgroundImage}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <IconTrash className="h-4 w-4 mr-1" />
              {deleting ? "Removing..." : "Remove background"}
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              className="btn btn-secondary-green inline-flex items-center gap-2"
            >
              <IconDeviceFloppy className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save changes"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}