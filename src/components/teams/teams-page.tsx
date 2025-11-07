// components/teams/teams-page.tsx
"use client";

import * as React from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { listTeamsPage, type Paginated } from "@/lib/api-client";
import { type Team } from "@/lib/api-types";
import TeamsTable from "./teams-table";
import CreateTeamDialog from "./create-team-dialog";
import EditTeamDialog from "./edit-team-dialog";

const LEAGUES = ["ALL", "CRDL", "SRDL"] as const;
type LeagueOption = typeof LEAGUES[number];

const YEARS_BACK = 5;
const YEARS_AHEAD = 1;

function seasonYearsAround(current: number) {
  const out: string[] = [];
  for (let y = current + YEARS_AHEAD; y >= current - YEARS_BACK; y--) out.push(String(y));
  return out;
}

function parseDefaultYear() {
  const raw = process.env.NEXT_PUBLIC_SEASON ?? "";
  const m = raw.match(/\b(20\d{2})\b/);
  if (m) return Number(m[1]);
  return new Date().getFullYear();
}

export default function TeamsPage() {
  const qc = useQueryClient();

  // Filters and UI state
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const defYear = React.useMemo(() => parseDefaultYear(), []);
  const [year, setYear] = React.useState(String(defYear));

  // Default to ALL so we show everything until a league is chosen
  const [league, setLeague] = React.useState<LeagueOption>("ALL");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Team | null>(null);

  // Only send season and league to the API when a concrete league is selected
  const seasonParam = league === "ALL" ? undefined : `${year} ${league}`;
  const leagueParam = league === "ALL" ? undefined : league;

  const teamsQ = useQuery<Paginated<Team>>({
    queryKey: [
      "teams",
      { q: search, page, pageSize, season: seasonParam, league: leagueParam },
    ],
    queryFn: () =>
      listTeamsPage({
        q: search || undefined,
        page,
        pageSize,
        season: seasonParam,
        league: leagueParam,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const onCreated = () => {
    setCreateOpen(false);
    qc.invalidateQueries({ queryKey: ["teams"] });
  };

  const onUpdated = () => {
    setEditOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["teams"] });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Teams</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Manage teams, logos and details
          </p>
        </div>
        <Button
          className="flex items-center gap-2 bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
          onClick={() => setCreateOpen(true)}
        >
          Add Team
          <IconPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <Input
            id="search"
            placeholder="Search teams by name or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(
              "pl-9 pr-3 h-10 rounded-lg border border-[var(--color-border)] bg-white/90 text-sm shadow-sm",
              "focus:ring-2 focus:ring-[var(--color-green)] focus:border-transparent transition-all"
            )}
          />
        </div>

        {/* Year */}
        <div className="min-w-[140px]">
          <Label className="mb-1 block">Year</Label>
          <Select
            value={year}
            onValueChange={(v) => {
              setYear(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {seasonYearsAround(defYear).map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* League: All, CRDL, SRDL */}
        <div className="min-w-[160px]">
          <Label className="mb-1 block">League</Label>
          <Select
            value={league}
            onValueChange={(v) => {
              setLeague(v as LeagueOption);
              setPage(1);
            }}
          >
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
      </div>

      {/* Table */}
      <TeamsTable
        loading={teamsQ.isLoading}
        items={teamsQ.data?.items ?? []}
        page={teamsQ.data?.page ?? page}
        pageSize={teamsQ.data?.pageSize ?? pageSize}
        total={teamsQ.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        onEdit={(t) => {
          setEditing(t);
          setEditOpen(true);
        }}
        onChanged={() => qc.invalidateQueries({ queryKey: ["teams"] })}
      />

      {/* Dialogs */}
      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={onCreated} />
      {editing && (
        <EditTeamDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          team={editing}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
