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
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

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

  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setError(null);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAnnouncement({
        title: title.trim(),
        body: (body || "").trim(),
        // no priority sent—server default will apply
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
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div data-color-mode="light">
            <Label className="mb-2 block">Body</Label>
            <MDEditor
              value={body}
              onChange={(v) => setBody(v || "")}
              height={380}
              previewOptions={{
                // Keep things tidy inside dialogs
                style: { background: "transparent" },
              }}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
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
              {submitting ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
