"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface QuickResultDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: { fixtureId: string; homeScore: number; awayScore: number; notes?: string }) => Promise<void> | void;
}

export default function QuickResultDialog({ open, onOpenChange, onSubmit }: QuickResultDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      fixtureId: String(fd.get("fixtureId") || ""),
      homeScore: Number(fd.get("homeScore") || 0),
      awayScore: Number(fd.get("awayScore") || 0),
      notes: String(fd.get("notes") || ""),
    };
    setSubmitting(true);
    try {
      await onSubmit(payload);
      onOpenChange(false);
      formRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border border-[var(--color-border)]">
        <DialogHeader>
          <DialogTitle>Record Result</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fixtureId">Fixture ID</Label>
              <Input id="fixtureId" name="fixtureId" placeholder="e.g. FIX-001" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="homeScore">Home</Label>
                <Input id="homeScore" name="homeScore" type="number" min={0} inputMode="numeric" required />
              </div>
              <div>
                <Label htmlFor="awayScore">Away</Label>
                <Input id="awayScore" name="awayScore" type="number" min={0} inputMode="numeric" required />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Optional notes" rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn btn-secondary-green focus-gold" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
