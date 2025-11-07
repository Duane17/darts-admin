// components/fixtures/fixtures-page.tsx
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";

import { useDashboardStatsDerived } from "@/queries/dashboard";
import type { Fixture, TeamRef, ResultRef } from "@/lib/api-types";
import { SEASON } from "@/lib/api-client";
import { toUiFixtureStatus } from "@/lib/api-types";

import { Button } from "@/components/ui/button";
import FilterBar, { FixturesFilter, UiStatus, TeamOption, UiLeague } from "./filter-bar";
import FixturesTable from "./fixtures-table";
import CreateFixtureDialog from "./create-fixture-dialog";
import EditFixtureDialog from "./edit-fixture-dialog";
import CreateResultDialog from "./create-result-dialog";
import EditResultDialog from "./edit-result-dialog";

/** Convert fixture time to ms since epoch */
function fixtureTime(f: Fixture): number {
  const iso = f.kickoff ?? f.date ?? null;
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

function teamName(t: TeamRef | null | undefined): string {
  return t?.name?.trim() || "TBA";
}

/** New: predicate to check a league match on fixture.type */
function matchesLeague(f: Fixture, league: UiLeague): boolean {
  if (league === "all") return true;
  return String(f.type) === league;
}

export default function FixturesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();

  const { loading, fixturesAll } = useDashboardStatsDerived();

  // Create fixture modal
  const [createOpen, setCreateOpen] = React.useState(false);

  // Edit fixture modal
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Fixture | null>(null);

  // Result modals
  const [createResOpen, setCreateResOpen] = React.useState(false);
  const [editResOpen, setEditResOpen] = React.useState(false);
  const [resFixture, setResFixture] = React.useState<Fixture | null>(null);

  // URL-seeded filters
  const seed: FixturesFilter = React.useMemo(() => {
    const get = (k: string) => params.get(k) ?? "";
    const norm = (v: string, fallback: string) => (v && v.trim().length ? v : fallback);

    const q = get("q");
    const status = (get("status") as UiStatus) || "all";
    const league = (get("league") as UiLeague) || "all"; // New
    const teamId = norm(get("teamId"), "all");
    const dateFrom = get("from");
    const dateTo = get("to");

    return { q, status, league, teamId, dateFrom, dateTo };
  }, [params]);

  const [pending, setPending] = React.useState<FixturesFilter>(seed);
  const [applied, setApplied] = React.useState<FixturesFilter>(seed);

  // Team options (built from existing fixtures to avoid separate query)
  const teamOptions: TeamOption[] = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of fixturesAll ?? []) {
      if (f.homeTeam) map.set(f.homeTeam.id, teamName(f.homeTeam));
      if (f.awayTeam) map.set(f.awayTeam.id, teamName(f.awayTeam));
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fixturesAll]);

  // Filtered list with league support
  const filtered = React.useMemo(() => {
    const list = fixturesAll ?? [];
    if (!list.length) return [];

    const q = applied.q.trim().toLowerCase();
    const team = applied.teamId !== "all" ? applied.teamId : null;

    const from = applied.dateFrom ? Date.parse(applied.dateFrom) : NaN;
    const to = applied.dateTo ? Date.parse(applied.dateTo) : NaN;

    return list
      .filter((f) => matchesLeague(f, applied.league)) // New
      .filter((f) => {
        const ui = toUiFixtureStatus(f);
        if (applied.status === "upcoming" && ui !== "upcoming") return false;
        if (applied.status === "completed" && ui !== "completed") return false;
        if (applied.status === "canceled" && f.status !== "CANCELLED") return false;
        if (applied.status === "postponed" && f.status !== "POSTPONED") return false;

        if (team) {
          const homeId = f.homeTeam?.id ?? f.homeTeamId;
          const awayId = f.awayTeam?.id ?? f.awayTeamId ?? "";
          if (homeId !== team && awayId !== team) return false;
        }

        if (q) {
          const hay = `${teamName(f.homeTeam)} ${teamName(f.awayTeam)} ${f.title ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        const t = fixtureTime(f);
        if (!Number.isNaN(from) && t < from) return false;
        if (!Number.isNaN(to) && t > to + 86_399_000) return false;

        return true;
      })
      .sort((a, b) => fixtureTime(b) - fixtureTime(a));
  }, [fixturesAll, applied]);

  // URL writer for filters
  const apply = React.useCallback(() => {
    setApplied(pending);
    const qs = new URLSearchParams();
    if (pending.q.trim()) qs.set("q", pending.q.trim());
    if (pending.status !== "all") qs.set("status", pending.status);
    if (pending.league !== "all") qs.set("league", pending.league); // New
    if (pending.teamId !== "all") qs.set("teamId", pending.teamId);
    if (pending.dateFrom) qs.set("from", pending.dateFrom);
    if (pending.dateTo) qs.set("to", pending.dateTo);
    router.push(qs.toString() ? `/fixtures?${qs}` : "/fixtures");
  }, [pending, router]);

  const clear = React.useCallback(() => {
    const empty: FixturesFilter = {
      q: "",
      status: "all",
      league: "all", // New
      teamId: "all",
      dateFrom: "",
      dateTo: ""
    };
    setPending(empty);
    setApplied(empty);
    router.push("/fixtures");
  }, [router]);

  // Normalize a newly created fixture so it looks like list items
  function normalizeCreated(created: Fixture): Fixture {
    const ensureTeam = (id?: string, fallback?: TeamRef | null): TeamRef | null => {
      if (!id && fallback) return fallback;
      if (!id) return fallback ?? null;
      const name = teamOptions.find((t) => t.id === id)?.name ?? "TBA";
      return { id, name, slug: undefined, logoUrl: null };
    };

    const home = created.homeTeam ?? ensureTeam(created.homeTeamId, created.homeTeam);
    const away =
      created.isBye ? null : created.awayTeam ?? ensureTeam(created.awayTeamId ?? undefined, created.awayTeam);

    return {
      ...created,
      homeTeam: home,
      awayTeam: away,
      date: created.date,
      kickoff: created.kickoff ?? created.date,
    } as Fixture;
  }

  // Invalidate all fixture queries powering this page
  const refetchFixtures = React.useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["fixtures"] });
  }, [qc]);

  // Helper to patch a single fixture in cache (used for optimistic result UI)
  function patchFixtureResultInCache(fixId: string, updater: (f: Fixture) => Fixture) {
    qc.setQueryData<Fixture[]>(["fixtures", "all"], (old) =>
      (old ?? []).map((f) => (f.id === fixId ? updater(f) : f))
    );
    qc.setQueryData<{ items: Fixture[]; page: number; pageSize: number }>(
      ["fixtures", "page", 1],
      (old) => (old ? { ...old, items: old.items.map((f) => (f.id === fixId ? updater(f) : f)) } : old)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Fixtures</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Manage all fixtures, schedules, and match results
          </p>
        </div>

        <Button
          className="flex items-center gap-2 bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
          onClick={() => setCreateOpen(true)}
        >
          Add Fixture
          <IconPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <FilterBar
        value={pending}
        onChange={setPending}
        onApply={apply}
        onClear={clear}
        teams={teamOptions}
      />

      {/* Results table */}
      <FixturesTable
        fixtures={filtered}
        loading={loading}
        onEdit={(f) => {
          setEditing(f);
          setEditOpen(true);
        }}
        onRecordResult={(f) => {
          if (f.result || f.status === "PLAYED") {
            setResFixture(f);
            setEditResOpen(true);
          } else {
            setResFixture(f);
            setCreateResOpen(true);
          }
        }}
        onDelete={(f) => {}}
      />

      {/* Create fixture modal */}
      <CreateFixtureDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        teams={teamOptions}
        defaultSeason={SEASON}
        onCreated={async (created) => {
          setCreateOpen(false);

          // Optimistic: insert into cache so it appears immediately
          qc.setQueryData<Fixture[]>(["fixtures", "all"], (old) => {
            const next = [normalizeCreated(created), ...(old ?? [])];
            return next.sort((a, b) => fixtureTime(b) - fixtureTime(a));
          });
          qc.setQueryData<{ items: Fixture[]; page: number; pageSize: number }>(
            ["fixtures", "page", 1],
            (old) => {
              if (!old) return old;
              const items = [normalizeCreated(created), ...old.items];
              return { ...old, items };
            }
          );

          // Ensure server truth
          await refetchFixtures();
        }}
      />

      {/* Edit fixture modal */}
      <EditFixtureDialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditing(null);
        }}
        teams={teamOptions}
        fixture={editing}
        onUpdated={async () => {
          setEditOpen(false);
          setEditing(null);
          await refetchFixtures();
        }}
      />

      {/* Create result modal */}
      <CreateResultDialog
        open={createResOpen}
        onOpenChange={(v) => {
          setCreateResOpen(v);
          if (!v) setResFixture(null);
        }}
        fixture={resFixture}
        onCreated={async () => {
          if (resFixture) {
            const nowIso = new Date().toISOString();
            patchFixtureResultInCache(resFixture.id, (f) => ({
              ...f,
              status: "PLAYED",
              result:
                f.result ??
                ({
                  id: "temp",
                  fixtureId: f.id,
                  homeScore: 0,
                  awayScore: 0,
                  notes: null,
                  createdAt: nowIso,
                } as ResultRef),
            }));
          }
          await refetchFixtures();
        }}
      />

      {/* Edit result modal */}
      <EditResultDialog
        open={editResOpen}
        onOpenChange={(v) => {
          setEditResOpen(v);
          if (!v) setResFixture(null);
        }}
        fixture={resFixture}
        onUpdated={async () => {
          await refetchFixtures();
        }}
      />
    </div>
  );
}
