"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listFixturesPage,
  listFixturesAll,
  listAnnouncementsPage,
  listAnnouncementsAll,
  getStandings,
  SEASON,
  getStandingsBy
} from "@/lib/api-client";
import type { Fixture, League, StandingRow } from "@/lib/api-types";
import { toUiFixtureStatus } from "@/lib/api-types";

export function useFixturesQuery() {
  return useQuery({
    queryKey: ["fixtures", "page", 1],
    queryFn: () => listFixturesPage({ page: 1, pageSize: 20, includeResults: true }),
  });
}

export function useAnnouncementsQuery() {
  return useQuery({
    queryKey: ["announcements", "page", 1],
    queryFn: () => listAnnouncementsPage({ page: 1, pageSize: 20 }),
  });
}

export function useFixturesAllQuery() {
  return useQuery({
    queryKey: ["fixtures", "all"],
    queryFn: () => listFixturesAll({ includeResults: true }),
  });
}

export function useAnnouncementsAllQuery() {
  return useQuery({
    queryKey: ["announcements", "all"],
    queryFn: listAnnouncementsAll,
  });
}

/** Standings for a specific season
 * Pass undefined when SEASON is blank so the API returns its default season.
 */
export function useStandingsQuery(seasonEnv: string = SEASON) {
  const season = seasonEnv && seasonEnv.trim().length > 0 ? seasonEnv : undefined;
  return useQuery<StandingRow[]>({
    queryKey: ["standings", season ?? "default"],
    queryFn: () => getStandings(season),
  });
}

export function useStandingsBy(seasonYear: number, league?: League) {
  return useQuery<StandingRow[]>({
    queryKey: ["standings", "by", seasonYear, league ?? "all"],
    queryFn: () => getStandingsBy({ seasonYear, league }),
  });
}

function classifyFixture(f: Fixture): "upcoming" | "completed" {
  return toUiFixtureStatus(f);
}

function fixtureTime(f: Fixture): number {
  const iso = f.kickoff ?? (f as any).date ?? null;
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

export function useDashboardStatsDerived(season: string = SEASON) {
  const fixturesPageQ = useFixturesQuery();
  const announcementsPageQ = useAnnouncementsQuery();

  const fixturesAllQ = useFixturesAllQuery();
  const announcementsAllQ = useAnnouncementsAllQuery();

  const standingsQ = useStandingsQuery(season);

  const loading =
    fixturesPageQ.isLoading ||
    announcementsPageQ.isLoading ||
    fixturesAllQ.isLoading ||
    announcementsAllQ.isLoading ||
    standingsQ.isLoading;

  const error =
    (fixturesPageQ.error as any)?.message ||
    (announcementsPageQ.error as any)?.message ||
    (fixturesAllQ.error as any)?.message ||
    (announcementsAllQ.error as any)?.message ||
    (standingsQ.error as any)?.message ||
    null;

  const stats = useMemo(() => {
    const fx = fixturesAllQ.data;
    const anns = announcementsAllQ.data;
    const table = standingsQ.data;

    if (!anns) return null;

    const announcementsPosted = anns.length;

    let resultsRecorded: number | null = null;
    if (table && table.length > 0) {
      const totalPlayed = table.reduce((acc, r) => acc + r.played, 0);
      resultsRecorded = Math.floor(totalPlayed / 2);
    }

    let fixturesScheduled = 0;
    let completedFromFixtures = 0;
    if (fx) {
      for (const f of fx) {
        const s = classifyFixture(f);
        if (s === "upcoming") fixturesScheduled++;
        else completedFromFixtures++;
      }
    }

    return {
      fixturesScheduled,
      resultsRecorded: resultsRecorded ?? completedFromFixtures,
      announcementsPosted,
    };
  }, [fixturesAllQ.data, announcementsAllQ.data, standingsQ.data]);

  const fixturesQ = {
    isLoading: fixturesPageQ.isLoading,
    data: useMemo(
      () =>
        [...(fixturesPageQ.data?.items ?? [])].sort(
          (a, b) => fixtureTime(b) - fixtureTime(a)
        ),
      [fixturesPageQ.data]
    ),
  };

  const annQ = {
    isLoading: announcementsPageQ.isLoading,
    data: announcementsPageQ.data?.items ?? [],
  };

  const standings = standingsQ.data ?? [];
  const fixturesAll = fixturesAllQ.data ?? null;

  return { stats, loading, error, fixturesQ, annQ, standings, fixturesAll };
}
