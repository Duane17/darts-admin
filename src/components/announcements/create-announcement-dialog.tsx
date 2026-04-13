"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAnnouncement } from "@/lib/api-client";
import { type Announcement } from "@/lib/api-types";
import { cn } from "@/lib/utils";

// Ensure this matches the export in your rich-text-editor.tsx file
import { RichTextEditor, type RichTextEditorRef } from "@/components/common/rich-text-editor";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (a: Announcement) => void;
  className?: string;
};

export default function CreateAnnouncementDialog({
  open,
  onOpenChange,
  onCreated,
  className,
}: Props) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reference to the editor to trigger the final image uploads
  const editorRef = React.useRef<RichTextEditorRef>(null);

  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setError(null);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Get the final HTML (this triggers any pending image uploads)
      const finalBodyHtml = editorRef.current 
        ? await editorRef.current.getFinalHtml() 
        : body;

      // 2. Submit the cleaned HTML to the server
      const created = await createAnnouncement({
        title: title.trim(),
        body: finalBodyHtml.trim(),
      });

      onCreated?.(created);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className={cn("sm:max-w-[760px]", className)}>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter announcement title"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label className="block">Body Content</Label>
            <RichTextEditor 
              ref={editorRef}
              value={body} 
              onChange={setBody} 
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Post Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}