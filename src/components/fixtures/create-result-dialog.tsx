"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Fixture } from "@/lib/api-types";
import { createResult } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type CreateResultDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fixture: Fixture | null;
  onCreated?: () => void;
  className?: string;
};

export default function CreateResultDialog({
  open,
  onOpenChange,
  fixture,
  onCreated,
  className,
}: CreateResultDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [homeScore, setHomeScore] = React.useState<string>("");
  const [awayScore, setAwayScore] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  const isBye = Boolean(fixture?.isBye || !fixture?.awayTeamId);

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setHomeScore("");
      setAwayScore("");
      setNotes("");
    } else if (isBye) {
      // For bye fixtures, force away score blank and keep the control disabled
      setAwayScore("");
    }
  }, [open, isBye]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fixture) return;

    if (isBye) {
      setError("This is a bye fixture. Results cannot be recorded.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const hs = Number(homeScore);
      const as = Number(awayScore);
      if (!Number.isInteger(hs) || hs < 0) throw new Error("Enter a valid home score");
      if (!Number.isInteger(as) || as < 0) throw new Error("Enter a valid away score");

      await createResult({
        fixtureId: fixture.id,
        homeScore: hs,
        awayScore: as,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      onCreated?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.details?.error || err?.message || "Failed to record result");
    } finally {
      setSubmitting(false);
    }
  }

  const homeName = fixture?.homeTeam?.name ?? "Home";
  const awayName = isBye ? "Bye" : fixture?.awayTeam?.name ?? "Away";

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className={cn("sm:max-w-[520px] max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle>Record score</DialogTitle>
        </DialogHeader>

        {!fixture ? null : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{fixture.title}</div>
              <div className="text-[var(--color-ink-muted)]">
                {homeName} vs {awayName}
              </div>
              {isBye && (
                <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  This is a bye fixture. You cannot record a score.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{homeName}</Label>
                <Input
                  inputMode="numeric"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>{awayName}</Label>
                <Input
                  inputMode="numeric"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={isBye ? "N/A" : "0"}
                  disabled={isBye}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., overtime, penalties…"
                disabled={isBye}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
                disabled={submitting || isBye}
                title={isBye ? "Cannot save a result for a bye" : "Save score"}
              >
                {submitting ? "Saving..." : "Save score"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
