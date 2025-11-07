// src/lib/use-dashboard-stats.ts
import { useEffect, useMemo, useState } from "react";
import {
  listFixturesAll,
  listAnnouncementsAll,
  getStandings,
  SEASON, // import season default
} from "./api-client";
import type { Fixture, StandingRow } from "./api-types";
import { toUiFixtureStatus } from "./api-types";

type AsyncState<T> = { data: T | null; loading: boolean; error: string | null; };

export type DashboardStats = {
  fixturesScheduled: number;
  resultsRecorded: number;
  announcementsPosted: number;
};

function classifyFixture(f: Fixture): "upcoming" | "completed" {
  return toUiFixtureStatus(f);
}

function totalResultsFromStandings(table: StandingRow[] | null): number | null {
  if (!table || table.length === 0) return null;
  const totalPlayed = table.reduce((acc, r) => acc + r.played, 0);
  return Math.floor(totalPlayed / 2);
}

export function useDashboardStats(season: string = SEASON) {
  const [fixtures, setFixtures] = useState<AsyncState<Fixture[]>>({
    data: null, loading: true, error: null,
  });
  const [annCount, setAnnCount] = useState<AsyncState<number>>({
    data: null, loading: true, error: null,
  });
  const [standings, setStandings] = useState<AsyncState<StandingRow[]>>({
    data: null, loading: true, error: null,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const fx = await listFixturesAll();
        if (!mounted) return;
        setFixtures({ data: fx, loading: false, error: null });
      } catch (e: any) {
        if (!mounted) return;
        setFixtures({ data: null, loading: false, error: e?.message || "Failed to load fixtures" });
      }
    })();

    (async () => {
      try {
        const a = await listAnnouncementsAll();
        if (!mounted) return;
        setAnnCount({ data: a.length, loading: false, error: null });
      } catch (e: any) {
        if (!mounted) return;
        setAnnCount({ data: null, loading: false, error: e?.message || "Failed to load announcements" });
      }
    })();

    (async () => {
      try {
        const table = await getStandings(season); // pass the season
        if (!mounted) return;
        setStandings({ data: table, loading: false, error: null });
      } catch (e: any) {
        if (!mounted) return;
        setStandings({ data: null, loading: false, error: e?.message || "Failed to load standings" });
      }
    })();

    return () => { mounted = false; };
  }, [season]);

  const loading = fixtures.loading || annCount.loading || standings.loading;
  const error = fixtures.error || annCount.error || standings.error;

  const stats: DashboardStats | null = useMemo(() => {
    if (!annCount.data) return null;

    const announcementsPosted = annCount.data;
    const resultsFromTable = totalResultsFromStandings(standings.data);

    let fixturesScheduled = 0;
    let resultsRecorded = resultsFromTable ?? 0;

    if (fixtures.data) {
      let upcoming = 0;
      let completed = 0;
      for (const f of fixtures.data) {
        const s = classifyFixture(f);
        if (s === "upcoming") upcoming++;
        else completed++;
      }
      fixturesScheduled = upcoming;
      if (resultsFromTable == null) resultsRecorded = completed;
    }

    return { fixturesScheduled, resultsRecorded, announcementsPosted };
  }, [fixtures.data, standings.data, annCount.data]);

  return { stats, loading, error, standings: standings.data };
}
