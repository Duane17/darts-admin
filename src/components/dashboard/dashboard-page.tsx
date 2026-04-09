"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCalendarEvent, IconTrophy, IconBell } from "@tabler/icons-react";

import DashboardHeader from "./dashboard-header";
import StatGrid from "./stat-grid";
import RecentFixturesCard from "./recent-fixtures-card";
import QuickActionsPanel from "./quick-actions-panel";
import StandingsMini from "./standings-mini";
import AnnouncementsList from "./announcements-list";

import { useDashboardStatsDerived } from "@/queries/dashboard";
import type { Fixture, TeamRef } from "@/lib/api-types";
import { toUiFixtureStatus } from "@/lib/api-types";
import { mediaUrl } from "@/lib/media";

type FxItem = {
  id: string;
  home: string;
  away: string;
  dateLabel: string;
  status: "upcoming" | "completed";
};

type AnnItem = {
  id: string;
  title: string;
  dateLabel: string;
  priority: "gold" | "success" | "error";
};

type MiniStandingRow = {
  id?: string;
  teamId?: string;
  position: number;
  team: string;
  played: number;
  points: number;
  logoUrl?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { stats, loading, error, fixturesQ, annQ, standings, fixturesAll } =
    useDashboardStatsDerived();

  const [resultOpen, setResultOpen] = useState(false);

  const statItems = useMemo(() => {
    const fixturesScheduled = stats?.fixturesScheduled ?? 0;
    const resultsRecorded = stats?.resultsRecorded ?? 0;
    const announcementsPosted = stats?.announcementsPosted ?? 0;

    return [
      {
        label: "Fixtures scheduled",
        value: String(fixturesScheduled),
        icon: <IconCalendarEvent className="h-5 w-5" />,
        loading,
        variant: "glass" as const,
        action: { label: "View fixtures", href: "/fixtures" },
      },
      {
        label: "Announcements posted",
        value: String(announcementsPosted),
        icon: <IconBell className="h-5 w-5" />,
        loading,
        variant: "glass" as const,
        action: { label: "View all", href: "/announcements" },
      },
    ];
  }, [stats, loading]);

  const teamName = (t: Fixture["homeTeam"]) => {
    const obj = t as TeamRef | null;
    return obj?.name?.trim() || "TBA";
  };

  const toDateLabel = (f: Fixture): string => {
    const iso = f.kickoff ?? f.date ?? null;
    const dt = iso ? new Date(iso) : null;
    return dt
      ? dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" })
      : "TBA";
  };

  const fixtureTime = (f: Fixture): number => {
    const iso = f.kickoff ?? f.date ?? null;
    const t = iso ? Date.parse(iso) : NaN;
    return Number.isNaN(t) ? -Infinity : t;
  };

  const isCompletedBeforeNow = (f: Fixture) => {
    const status = toUiFixtureStatus(f);
    const t = fixtureTime(f);
    const now = Date.now();
    const hasScores =
      !!(f as any).result ||
      typeof (f as any).homeScore === "number" ||
      typeof (f as any).awayScore === "number";
    const completedByStatus = status === "completed";
    const completedByInference = hasScores && t <= now;
    return t <= now && (completedByStatus || completedByInference);
  };

  const recentFixtures: FxItem[] = useMemo(() => {
    const source: Fixture[] | undefined =
      fixturesAll && fixturesAll.length ? fixturesAll : fixturesQ.data;

    if (!source || source.length === 0) return [];

    const items = source
      .filter((f) => !f.isBye && !!f.awayTeamId)
      .filter(isCompletedBeforeNow)
      .sort((a, b) => fixtureTime(b) - fixtureTime(a))
      .slice(0, 5)
      .map((f) => ({
        id: f.id,
        home: teamName(f.homeTeam),
        away: teamName(f.awayTeam),
        dateLabel: toDateLabel(f),
        status: "completed" as const,
      }));

    if (items.length === 0 && fixturesQ.data?.length) {
      return [...fixturesQ.data]
        .sort((a, b) => fixtureTime(b) - fixtureTime(a))
        .slice(0, 5)
        .map((f) => ({
          id: f.id,
          home: teamName(f.homeTeam),
          away: f.isBye || !f.awayTeamId ? "Bye" : teamName(f.awayTeam),
          dateLabel: toDateLabel(f),
          status: toUiFixtureStatus(f),
        }));
    }

    return items;
  }, [fixturesAll, fixturesQ.data]);

  const recentAnnouncements: AnnItem[] = useMemo(() => {
    if (!annQ.data) return [];
    return annQ.data.slice(0, 5).map((x): AnnItem => ({
      id: x.id,
      title: x.title,
      dateLabel: x.createdAt
        ? new Date(x.createdAt).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
          })
        : "Today",
      priority: (x.priority ?? "gold") as AnnItem["priority"],
    }));
  }, [annQ.data]);

  // Build mini rows from normalized StandingRow[]
  const miniStandingRows: MiniStandingRow[] = useMemo(() => {
    if (!standings || standings.length === 0) return [];
    return standings.map((r, idx) => {
      const pos = Number.isFinite(r.rank) && r.rank > 0 ? r.rank : idx + 1;
      return {
        id: r.teamId,
        teamId: r.teamId,
        position: pos,
        team: r.teamName || "TBA",
        played: Number(r.played) || 0,
        points: Number(r.points) || 0,
        logoUrl: r.teamLogoUrl ? mediaUrl(r.teamLogoUrl) : null,
      };
    });
  }, [standings]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Dashboard"
        subtitle="Quick overview of the league"
      />

      <StatGrid items={statItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentFixturesCard
          title="Recent fixtures"
          loading={fixturesQ.isLoading}
          fixtures={recentFixtures}
          className="lg:col-span-2"
        />
        <QuickActionsPanel
          loading={loading}
          onRecordResult={() => router.push("/fixtures")}
          onScheduleFixture={() => router.push("/teams")}
          onViewReports={() => router.push("/reports")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StandingsMini rows={miniStandingRows} loading={loading} className="lg:col-span-2" />
        <AnnouncementsList items={recentAnnouncements} loading={annQ.isLoading} />
      </div>
    </div>
  );
}
