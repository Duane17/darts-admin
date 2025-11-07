"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Fixture } from "@/lib/api-types";
import { updateResult } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type EditResultDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fixture: Fixture | null;                 // must have existing result
  onUpdated?: () => void;
  className?: string;
};

export default function EditResultDialog({
  open,
  onOpenChange,
  fixture,
  onUpdated,
  className,
}: EditResultDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [homeScore, setHomeScore] = React.useState<string>("");
  const [awayScore, setAwayScore] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  const isBye = Boolean(fixture?.isBye || !fixture?.awayTeamId);

  React.useEffect(() => {
    if (!open) return;
    if (fixture?.result) {
      setHomeScore(String(fixture.result.homeScore ?? 0));
      setAwayScore(String(fixture.result.awayScore ?? 0));
      setNotes(fixture.result.notes ?? "");
    } else {
      setHomeScore("");
      setAwayScore("");
      setNotes("");
    }
    setError(null);
  }, [open, fixture]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fixture?.result) return;

    if (isBye) {
      setError("This is a bye fixture. Results cannot be edited.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const hs = Number(homeScore);
      const as = Number(awayScore);
      if (!Number.isInteger(hs) || hs < 0) throw new Error("Enter a valid home score");
      if (!Number.isInteger(as) || as < 0) throw new Error("Enter a valid away score");

      await updateResult(fixture.result.id, {
        homeScore: hs,
        awayScore: as,
        notes: notes.trim() || undefined,
      });

      onUpdated?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.details?.error || err?.message || "Failed to update result");
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
          <DialogTitle>Update score</DialogTitle>
        </DialogHeader>

        {!fixture?.result ? null : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{fixture.title}</div>
              <div className="text-[var(--color-ink-muted)]">
                {homeName} vs {awayName}
              </div>
              {isBye && (
                <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  This is a bye fixture. You cannot edit a score.
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
                />
              </div>
              <div>
                <Label>{awayName}</Label>
                <Input
                  inputMode="numeric"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value.replace(/[^\d]/g, ""))}
                  disabled={isBye}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isBye} />
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
                title={isBye ? "Cannot save a result for a bye" : "Save changes"}
              >
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
