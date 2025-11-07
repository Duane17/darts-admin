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
import { createTeamApi } from "@/lib/api-client";
import { type Team } from "@/lib/api-types";

function toSlug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateTeamDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (t: Team) => void;
}) {
  // Visible fields
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [homeVenue, setHomeVenue] = React.useState("");
  const [homeCity, setHomeCity] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);

  // Hidden slug state that stays in sync with the name
  const [slug, setSlug] = React.useState("");

  // Preview and request state
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Keep slug derived from name at all times
  React.useEffect(() => {
    setSlug(toSlug(name));
  }, [name]);

  // Reset on dialog close
  React.useEffect(() => {
    if (!open) {
      setName("");
      setCity("");
      setHomeVenue("");
      setHomeCity("");
      setActive(true);
      setLogoFile(null);
      setLogoPreview(null);
      setError(null);
      setSlug("");
    }
  }, [open]);

  // File preview
  React.useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Team name is required");

      const finalSlug = slug || toSlug(trimmedName);
      if (!finalSlug) throw new Error("Slug could not be derived from the name");

      const created = await createTeamApi({
        name: trimmedName,
        slug: finalSlug,
        city: city.trim() || undefined,
        homeVenue: homeVenue.trim() || undefined,
        homeCity: (homeCity || city).trim() || undefined,
        active,
        logoFile,
      });

      onCreated?.(created);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Add team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Team name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* City, Home Venue, Home City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div>
              <Label htmlFor="homeCity">Home city</Label>
              <Input
                id="homeCity"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                placeholder="defaults to City if empty"
              />
            </div>
          </div>

          {/* Active and Logo */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={active}
                onCheckedChange={(v) => setActive(Boolean(v))}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex-1">
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-12 w-12 rounded object-cover border"
              />
            ) : null}
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
              disabled={submitting || !name.trim()}
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
