// src/components/announcements/edit-announcement-client.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconTrash,
  IconDeviceFloppy,
  IconArrowLeft,
} from "@tabler/icons-react";

// Import the Ref type along with the component
import { RichTextEditor, type RichTextEditorRef } from "@/components/common/rich-text-editor";

export default function EditAnnouncementClient({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  const annQ = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => getAnnouncement(id),
  });

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [initialized, setInitialized] = React.useState(false);

  // Reference to access the editor's upload logic
  const editorRef = React.useRef<RichTextEditorRef>(null);

  React.useEffect(() => {
    if (annQ.data && !initialized) {
      setTitle(annQ.data.title ?? "");
      setBody(annQ.data.body ?? "");
      setError(null);
      setInitialized(true);
    }
  }, [annQ.data, initialized]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      // 1. Trigger the editor to upload any pending images and get the clean HTML
      const finalBodyHtml = editorRef.current 
        ? await editorRef.current.getFinalHtml() 
        : body;

      // 2. Send the cleaned HTML (with real backend URLs) to the server
      await updateAnnouncement(id, {
        title: title.trim(),
        body: finalBodyHtml.trim(),
      });

      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", id] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      qc.invalidateQueries({ queryKey: ["announcements"] });
      router.push("/announcements");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      setError(msg);
    }
  }

  if (annQ.isLoading || !initialized) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 text-[var(--color-ink-muted)]">
        Loading…
      </div>
    );
  }
  
  if (annQ.error || !annQ.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 text-red-600">
        Announcement not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-ink)]">
            Edit announcement
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Make changes and save
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
            onClick={onSave}
            disabled={saving}
          >
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="p-5 md:p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="mt-1"
              placeholder="Announcement title"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label className="block">Body Content</Label>
            <RichTextEditor 
              ref={editorRef} // Attach ref to access getFinalHtml
              value={body} 
              onChange={setBody} 
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* bottom actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] bg-white/60 px-5 md:px-6 py-4 rounded-b-2xl">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
            onClick={onSave}
            disabled={saving}
          >
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}