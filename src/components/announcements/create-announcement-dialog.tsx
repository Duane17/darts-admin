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
      const finalBodyHtml = editorRef.current 
        ? await editorRef.current.getFinalHtml() 
        : body;

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
      <DialogContent 
        className={cn(
          "sm:max-w-[760px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden", 
          className
        )}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
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
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
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