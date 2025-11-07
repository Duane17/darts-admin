"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconFilter, IconX, IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UiStatus = "all" | "upcoming" | "completed" | "canceled" | "postponed";

/** New: UI league type. Maps to backend FixtureType values. */
export type UiLeague = "all" | "SRDL_LEAGUE" | "SMK_TRADING_CRDL";

export type FixturesFilter = {
  q: string;
  status: UiStatus;
  league: UiLeague;     // New
  teamId: string;       // "all" or a real id
  dateFrom: string;     // yyyy-mm-dd or ""
  dateTo: string;       // yyyy-mm-dd or ""
};

export type TeamOption = { id: string; name: string };

export function FilterBar(props: {
  value: FixturesFilter;
  onChange: (next: FixturesFilter) => void;
  onApply: () => void;
  onClear: () => void;
  teams: TeamOption[];
  className?: string;
}) {
  const { value, onChange, onApply, onClear, teams, className } = props;

  const set = <K extends keyof FixturesFilter>(k: K, v: FixturesFilter[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-white/70 p-4 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-[var(--color-ink)]">
        <IconFilter className="h-5 w-5" />
        <div className="text-lg font-semibold">Filters</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        {/* Search */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Search</label>
          <Input
            placeholder="Search fixtures..."
            value={value.q}
            onChange={(e) => set("q", e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Status</label>
          <Select value={value.status} onValueChange={(v) => set("status", v as FixturesFilter["status"])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="postponed">Postponed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* League - New */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">League</label>
          <Select value={value.league} onValueChange={(v) => set("league", v as UiLeague)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All leagues</SelectItem>
              <SelectItem value="SRDL_LEAGUE">SRDL</SelectItem>
              <SelectItem value="SMK_TRADING_CRDL">CRDL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Team */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Team</label>
          <Select value={value.teamId} onValueChange={(v) => set("teamId", v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Date From</label>
          <Input
            type="date"
            placeholder="dd/mm/yyyy"
            value={value.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Date To</label>
          <Input
            type="date"
            placeholder="dd/mm/yyyy"
            value={value.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onClear}
          className="flex items-center gap-1"
        >
          <IconX className="h-4 w-4" />
          Clear
        </Button>
        <Button onClick={onApply} className="flex items-center gap-1">
          <IconAdjustmentsHorizontal className="h-4 w-4" />
          Apply
        </Button>
      </div>
    </div>
  );
}

export default FilterBar;
