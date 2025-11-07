// components/fixtures/create-fixture-dialog.tsx
"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { createFixture, type FixtureTypeApi } from "@/lib/api-client";
import type { Fixture } from "@/lib/api-types";

export type TeamOption = { id: string; name: string };

export type CreateFixtureDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teams: TeamOption[];
  defaultSeason: string;
  onCreated?: (f: Fixture) => void;
  className?: string;
};

type FormState = {
  season: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  week: string;          // numeric string
  type: FixtureTypeApi;
  venue: string;
  city: string;
  isBye: boolean;
  homeTeamId: string;
  awayTeamId: string;
};

const FIXTURE_TYPES: FixtureTypeApi[] = [
  "SMK_TRADING_CRDL",
  "SRDL_LEAGUE",
  "FRIENDLY",
  "TOURNAMENT",
  "TRAINING",
  "COMMUNITY",
  "WORKSHOP",
];

// Build ISO from local date and time with basic validation
function toIsoFromDateAndTimeLocal(dateStr: string, timeStr: string): string {
  const m = (timeStr || "").match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) throw new Error("Invalid time selected");
  const hh = String(Number(m[1])).padStart(2, "0");
  const mm = m[2];

  const [y, mo, d] = (dateStr || "").split("-").map(Number);
  if (!y || !mo || !d) throw new Error("Invalid date selected");

  const dt = new Date(y, mo - 1, d, Number(hh), Number(mm), 0, 0);
  if (Number.isNaN(dt.getTime())) throw new Error("Invalid date selected");
  return dt.toISOString();
}

export default function CreateFixtureDialog({
  open, onOpenChange, teams, defaultSeason, onCreated, className,
}: CreateFixtureDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const emptyForm: FormState = React.useMemo(() => ({
    season: defaultSeason,
    date: "",
    time: "14:30",        // sensible default to match backend convention
    week: "",
    type: "SMK_TRADING_CRDL",
    venue: "",
    city: "",
    isBye: false,
    homeTeamId: "",
    awayTeamId: "",
  }), [defaultSeason]);

  const [form, setForm] = React.useState<FormState>(emptyForm);

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setForm(emptyForm);
    }
  }, [open, emptyForm]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const sortedTeams = React.useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)),
    [teams]
  );

  const awayTeamChoices = React.useMemo(
    () => sortedTeams.filter((t) => t.id !== form.homeTeamId),
    [sortedTeams, form.homeTeamId]
  );

  const homeName = React.useMemo(
    () => sortedTeams.find((t) => t.id === form.homeTeamId)?.name ?? "",
    [sortedTeams, form.homeTeamId]
  );

  const awayName = React.useMemo(
    () => sortedTeams.find((t) => t.id === form.awayTeamId)?.name ?? "",
    [sortedTeams, form.awayTeamId]
  );

  const titlePreview = React.useMemo(() => {
    if (!homeName) return "";
    if (form.isBye) return `${homeName} Bye`;
    if (!awayName) return "";
    return `${homeName} vs ${awayName}`;
  }, [homeName, awayName, form.isBye]);

  const descriptionPreview = React.useMemo(() => {
    if (form.isBye && homeName) return `${homeName} has a bye this week`;
    return "";
  }, [form.isBye, homeName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const season = form.season.trim();
      const weekNum = Number(form.week);
      const venue = form.venue.trim();
      const city = form.city.trim();

      if (!season) throw new Error("Season is required");
      if (!form.date) throw new Error("Date is required");
      if (!form.time) throw new Error("Time is required");
      if (!weekNum) throw new Error("Week is required");
      if (!venue) throw new Error("Venue is required");
      if (!form.homeTeamId) throw new Error("Home team is required");
      if (!form.isBye && !form.awayTeamId) throw new Error("Away team is required");

      const dateIso = toIsoFromDateAndTimeLocal(form.date, form.time);
      const title = titlePreview || "Fixture";
      const description = descriptionPreview || "";

      const payload = {
        season,
        week: weekNum,
        title,
        date: dateIso,
        type: form.type,
        venue,
        city: city || undefined,
        description: description || undefined,
        isBye: form.isBye,
        homeTeamId: form.homeTeamId,
        ...(form.isBye ? {} : { awayTeamId: form.awayTeamId }),
      };

      const created = await createFixture(payload as any);
      onCreated?.(created);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.details?.error || err?.message || "Failed to create fixture");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent
        className={cn(
          "sm:max-w-[640px] max-h-[90vh] overflow-y-auto",
          "rounded-lg p-6",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>Create fixture</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* season, week, type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                value={form.season}
                onChange={(e) => set("season", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="week">Week</Label>
              <Input
                id="week"
                inputMode="numeric"
                value={form.week}
                onChange={(e) => set("week", e.target.value.replace(/[^\d]/g, ""))}
                placeholder="eg. 10"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={form.type} onValueChange={(v: FixtureTypeApi) => set("type", v)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Fixture type" />
                </SelectTrigger>
                <SelectContent>
                  {FIXTURE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* date + time + venue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                step={60}
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
              />
            </div>
          </div>

          {/* city */}
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>

          {/* teams + bye */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Home team</Label>
              <Select
                value={form.homeTeamId}
                onValueChange={(v) => {
                  set("homeTeamId", v);
                  if (v === form.awayTeamId) set("awayTeamId", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select home team" />
                </SelectTrigger>
                <SelectContent>
                  {sortedTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Away team</Label>
                <Select
                  value={form.awayTeamId}
                  onValueChange={(v) => set("awayTeamId", v)}
                  disabled={form.isBye}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={form.isBye ? "Bye selected" : "Select away team"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {awayTeamChoices.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pb-2">
                <Label className="sr-only" htmlFor="isBye">Bye</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isBye"
                    checked={form.isBye}
                    onCheckedChange={(v) => {
                      const bye = Boolean(v);
                      set("isBye", bye);
                      if (bye) set("awayTeamId", "");
                    }}
                  />
                  <span className="text-sm">Bye</span>
                </div>
              </div>
            </div>
          </div>

          {/* computed title/description (read only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Title (auto)</Label>
              <Input value={titlePreview} disabled placeholder="Will be auto generated" />
            </div>
            <div>
              <Label>Description (auto)</Label>
              <Input value={descriptionPreview} disabled placeholder="Empty unless bye" />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter className="mt-2">
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
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
