// components/standings/standings-page.tsx
"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getStandings, SEASON } from "@/lib/api-client";
import type { StandingRow } from "@/lib/api-types";
import StandingsTable from "./standings-table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const YEARS_AHEAD = 1;
const YEARS_BACK = 5;
const LEAGUES = ["CRDL", "SRDL"] as const;

type LeagueOption = typeof LEAGUES[number];

function parseDefaultSeason(input: string): { year: string; league: LeagueOption } {
  // Accept "2025", "2025 SRDL", "2025 CRDL"
  const m = input.match(/\b(20\d{2})\b/);
  const year = m ? m[1] : String(new Date().getFullYear());

  const lower = input.toLowerCase();
  let league: LeagueOption = "CRDL";
  if (/\bsrdl\b/.test(lower)) league = "SRDL";
  if (/\bcrdl\b/.test(lower)) league = "CRDL";

  return { year, league };
}

function seasonOptions(currentYear: string): string[] {
  const now = Number(currentYear);
  const opts: string[] = [];
  for (let y = now + YEARS_AHEAD; y >= now - YEARS_BACK; y--) {
    opts.push(String(y));
  }
  return opts;
}

function groupRows(rows: StandingRow[]) {
  const hasGroup = rows.some((r) => r.group && r.group.trim().length > 0);
  if (!hasGroup) return null;

  const A = rows.filter((r) => r.group === "A");
  const B = rows.filter((r) => r.group === "B");
  return { A, B };
}

export default function StandingsPage() {
  const { year: defYear, league: defLeague } = React.useMemo(
    () => parseDefaultSeason(SEASON),
    []
  );

  const [year, setYear] = React.useState(defYear);
  const [league, setLeague] = React.useState<LeagueOption>(defLeague);
  const [showLast5, setShowLast5] = React.useState(true);

  // Compose a canonical legacy label for maximum compatibility with the API
  // Example: "2025 CRDL" or "2025 SRDL"
  const seasonLabel = `${year} ${league}`;

  const { data, isLoading, isError, refetch, isFetching } = useQuery<StandingRow[]>({
    queryKey: ["standings", seasonLabel],
    queryFn: () => getStandings(seasonLabel),
    staleTime: 60_000,
  });

  const grouped = React.useMemo(() => groupRows(data ?? []), [data]);
  const years = React.useMemo(() => seasonOptions(defYear), [defYear]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Standings</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            League table for {seasonLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[140px]">
            <Label className="mb-1 block">Year</Label>
            <Select value={year} onValueChange={(v) => setYear(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((yr) => (
                  <SelectItem key={yr} value={yr}>
                    {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px]">
            <Label className="mb-1 block">League</Label>
            <Select value={league} onValueChange={(v) => setLeague(v as LeagueOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Select league" />
              </SelectTrigger>
              <SelectContent>
                {LEAGUES.map((lg) => (
                  <SelectItem key={lg} value={lg}>
                    {lg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={() => setShowLast5((s) => !s)}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-gray-50"
            title="Toggle last 5 form column"
          >
            {showLast5 ? "Hide Last 5" : "Show Last 5"}
          </button>

          <button
            onClick={() => refetch()}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-gray-50"
            disabled={isFetching}
            title="Refresh standings"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load standings. Try refreshing.
        </div>
      ) : grouped ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-medium text-[var(--color-ink-muted)]">Group A</h2>
            <StandingsTable
              rows={grouped.A}
              loading={isLoading}
              showGroup={false}
              showLast5={showLast5}
            />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium text-[var(--color-ink-muted)]">Group B</h2>
            <StandingsTable
              rows={grouped.B}
              loading={isLoading}
              showGroup={false}
              showLast5={showLast5}
            />
          </div>
        </div>
      ) : (
        <StandingsTable
          rows={data ?? []}
          loading={isLoading}
          showGroup={true}
          showLast5={showLast5}
        />
      )}
    </div>
  );
}
