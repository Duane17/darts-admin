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
import { Checkbox } from "@/components/ui/checkbox";
import { updateTeamApi } from "@/lib/api-client";
import { type Team } from "@/lib/api-types";

export default function EditTeamDialog({
  open,
  onOpenChange,
  team,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team: Team;
  onUpdated?: (t: Team) => void;
}) {
  const [name, setName] = React.useState(team.name);
  const [city, setCity] = React.useState(team.city ?? "");
  const [homeVenue, setHomeVenue] = React.useState(team.homeVenue ?? "");
  const [active, setActive] = React.useState(Boolean(team.active));
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(team.name);
      setCity(team.city ?? "");
      setHomeVenue(team.homeVenue ?? "");
      setActive(Boolean(team.active));
      setLogoFile(null);
      setError(null);
    }
  }, [open, team]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Default homeCity to match city when updating
      const updated = await updateTeamApi(team.id, {
        name,
        city,
        homeVenue,
        homeCity: city,
        active,
        logoFile,
      });
      onUpdated?.(updated);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to update team");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="homeVenue">Home venue</Label>
              <Input
                id="homeVenue"
                value={homeVenue}
                onChange={(e) => setHomeVenue(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={active}
              onCheckedChange={(v) => setActive(Boolean(v))}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div>
            <Label htmlFor="logo">Replace logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
