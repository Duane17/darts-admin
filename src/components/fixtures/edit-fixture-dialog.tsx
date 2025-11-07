"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { updateFixture } from "@/lib/api-client";
import type { Fixture } from "@/lib/api-types";

export type TeamOption = { id: string; name: string };

export type EditFixtureDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teams: TeamOption[];
  fixture: Fixture | null;
  onUpdated?: (f: Fixture) => void;
  className?: string;
};

type FormState = {
  season: string;
  week: string;
  date: string;
  time: string;
  type: Fixture["type"];
  venue: string;
  city: string;
  isBye: boolean;
  homeTeamId: string;
  awayTeamId: string;
  title: string;
  description: string;
};

function fromIsoToLocalParts(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

// default kickoff 14:30 when time is missing to align with backend rule
function defaultTimeIfEmpty(t: string) {
  return t && /^\d{2}:\d{2}$/.test(t) ? t : "14:30";
}

function toIsoFromDateAndTimeLocal(dateStr: string, timeStr: string): string {
  const [y, m, d] = (dateStr || "").split("-").map(Number);
  const [hh, mm] = (timeStr || "").split(":").map(Number);
  if (!y || !m || !d || (hh ?? -1) < 0 || (mm ?? -1) < 0 || mm > 59 || hh > 23) {
    throw new Error("Invalid time selected");
  }
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(dt.getTime())) throw new Error("Invalid time selected");
  return dt.toISOString();
}

export default function EditFixtureDialog({
  open,
  onOpenChange,
  teams,
  fixture,
  onUpdated,
  className,
}: EditFixtureDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initial = React.useMemo<FormState>(() => {
    if (!fixture) {
      return {
        season: "",
        week: "",
        date: "",
        time: "14:30",
        type: "SMK_TRADING_CRDL",
        venue: "",
        city: "",
        isBye: false,
        homeTeamId: "",
        awayTeamId: "",
        title: "",
        description: "",
      };
    }
    const { date, time } = fromIsoToLocalParts(fixture.kickoff ?? fixture.date);
    return {
      season: fixture.season ?? "",
      week: String(fixture.week ?? ""),
      date,
      time: defaultTimeIfEmpty(time),
      type: fixture.type ?? "SMK_TRADING_CRDL",
      venue: fixture.venue ?? "",
      city: fixture.city ?? "",
      isBye: Boolean(fixture.isBye || !fixture.awayTeamId),
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId ?? "",
      title: fixture.title ?? "",
      description: fixture.description ?? "",
    };
  }, [fixture]);

  const [form, setForm] = React.useState<FormState>(initial);
  React.useEffect(() => setForm(initial), [initial, open]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const sortedTeams = React.useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)),
    [teams]
  );

  // Compute the automatic values from current form controls
  const homeName = sortedTeams.find((t) => t.id === form.homeTeamId)?.name ?? "";
  const awayName = sortedTeams.find((t) => t.id === form.awayTeamId)?.name ?? "";

  const autoTitle =
    form.isBye && homeName
      ? `${homeName} Bye`
      : homeName && awayName
      ? `${homeName} vs ${awayName}`
      : "";

  const autoDescription =
    form.isBye && homeName ? `${homeName} has a bye this week` : "";

  // Keep title/description in sync with inputs (automatic for now)
  React.useEffect(() => {
    if (form.title !== autoTitle || form.description !== autoDescription) {
      setForm((s) => ({
        ...s,
        title: autoTitle,
        description: autoDescription,
      }));
    }
  }, [autoTitle, autoDescription]); // eslint-disable-line

  // Prevent selecting same team
  const awayChoices = React.useMemo(
    () => sortedTeams.filter((t) => t.id !== form.homeTeamId),
    [sortedTeams, form.homeTeamId]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fixture) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!form.season.trim()) throw new Error("Season is required");
      if (!form.week) throw new Error("Week is required");
      if (!form.date) throw new Error("Date is required");
      if (!form.time) throw new Error("Time is required");
      if (!form.venue.trim()) throw new Error("Venue is required");
      if (!form.homeTeamId) throw new Error("Home team is required");
      if (!form.isBye && !form.awayTeamId) throw new Error("Away team is required");

      const iso = toIsoFromDateAndTimeLocal(form.date, defaultTimeIfEmpty(form.time));

      const patch: Parameters<typeof updateFixture>[1] = {
        season: form.season.trim(),
        week: Number(form.week),
        title: form.title || "Fixture",
        description: form.isBye ? autoDescription : form.description || undefined,
        date: iso,
        type: form.type,
        venue: form.venue.trim(),
        city: form.city.trim() || null,
        isBye: form.isBye,
        homeTeamId: form.homeTeamId,
        awayTeamId: form.isBye ? null : form.awayTeamId || null,
      };

      const updated = await updateFixture(fixture.id, patch);
      onUpdated?.(updated);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.details?.error || err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent
        className={cn("sm:max-w-[680px] max-h-[90vh] overflow-y-auto", className)}
      >
        <DialogHeader className="sticky top-0 bg-background z-10 pb-2">
          <DialogTitle>Edit fixture</DialogTitle>
        </DialogHeader>

        {!fixture ? null : (
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
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v as Fixture["type"])}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "SMK_TRADING_CRDL",
                      "SRDL_LEAGUE",
                      "FRIENDLY",
                      "TOURNAMENT",
                      "TRAINING",
                      "COMMUNITY",
                      "WORKSHOP",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* date / time / venue */}
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
                      {awayChoices.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pb-2">
                  <Label className="sr-only" htmlFor="isBye">
                    Bye
                  </Label>
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

            {/* auto-synced title/description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Auto: Home vs Away / Team Bye"
                />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Optional (auto for Bye)"
                />
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
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
