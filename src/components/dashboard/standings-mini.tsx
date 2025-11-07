"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@tabler/icons-react";
import { useStandingsBy } from "@/queries/dashboard";
import type { League } from "@/lib/api-types";
import { mediaUrl } from "@/lib/media";

export interface MiniStandingRow {
  id?: string;
  teamId?: string;
  position: number;
  team: string;
  points: number;
  played: number;
  logoUrl?: string | null;
}

export interface StandingsMiniProps {
  /** If you supply rows, they win and no fetch occurs */
  rows?: MiniStandingRow[];
  loading?: boolean;
  className?: string;
  title?: string;

  /** Optional overrides, otherwise defaults to CRDL and current year */
  seasonYear?: number;
  league?: League; // "CRDL" | "SRDL"
}

function safeKey(row: MiniStandingRow, idx: number) {
  const base =
    row.id ??
    row.teamId ??
    `${String(row.team || "TBA")}-${Number.isFinite(row.position) ? row.position : "pos"}`;
  return `${base}-${idx}`;
}

/** Map StandingRow to the minimal card shape, guarding nulls. */
function mapToMiniRows(rows: any[]): MiniStandingRow[] {
  return rows.map((r: any, idx: number) => {
    const name =
      typeof r.teamName === "string" && r.teamName.trim().length > 0
        ? r.teamName
        : r.team?.name ?? r.teamSlug ?? "TBA";

    const teamId = r.teamId ?? r.team?.id ?? undefined;
    const position = Number.isFinite(r.rank) && r.rank > 0 ? Number(r.rank) : idx + 1;
    const logo = r.teamLogoUrl ?? r.team?.logoUrl ?? null;
    const resolvedLogo = logo ? mediaUrl(logo) : null;

    return {
      id: teamId,
      teamId,
      position,
      team: String(name),
      played: Number(r.played) || 0,
      points: Number(r.points) || 0,
      logoUrl: resolvedLogo,
    };
  });
}

export default function StandingsMini({
  rows,
  loading,
  className,
  title = "Standings",
  seasonYear,
  league,
}: StandingsMiniProps) {
  // Defaults: CRDL and current year
  const year = Number.isFinite(seasonYear as number)
    ? (seasonYear as number)
    : new Date().getFullYear();
  const lg: League | undefined = league ?? "CRDL";

  // Only fetch if caller did not provide rows
  const shouldFetch = !rows || rows.length === 0;
  const standingsQ = useStandingsBy(year, lg);
  const fetched = standingsQ.data ? mapToMiniRows(standingsQ.data) : [];

  const effectiveLoading = loading || (shouldFetch && standingsQ.isLoading);
  const data = rows && rows.length > 0 ? rows : fetched;

  const sorted = React.useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.position || 0) - (b.position || 0)),
    [data]
  );

  return (
    <Card className={cn("glass-panel border border-[var(--color-border)] shadow-sm", className)}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xl font-semibold text-[var(--color-ink)] flex items-center gap-2">
          {title}
          <span className="ml-2 h-0.5 flex-1 rounded-full bg-[var(--color-gold)]" />
        </CardTitle>

        <Link
          href="/standings"
          className="group flex items-center gap-1 text-sm font-medium text-[var(--color-gold)] hover:text-[var(--color-green)] transition-colors"
        >
          See more
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </CardHeader>

      <CardContent>
        {effectiveLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg p-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-6 text-sm text-[var(--color-ink-muted)]">
            No standings to display
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.slice(0, 6).map((t, idx) => {
              const pos = Number.isFinite(t.position) ? t.position : 0;
              const team = (t.team ?? "").trim() || "TBA";
              const points = Number.isFinite(t.points) ? t.points : 0;

              return (
                <div
                  key={safeKey(t, idx)}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-black/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        pos === 1 ? "bg-[var(--color-gold)] text-white" : "bg-gray-100 text-[var(--color-ink-muted)]"
                      )}
                    >
                      {pos}
                    </span>

                    {t.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.logoUrl}
                        alt=""
                        className="h-6 w-6 rounded object-contain bg-gray-50"
                      />
                    ) : null}

                    <span className="text-sm font-semibold text-[var(--color-ink)]">{team}</span>
                  </div>

                  <span className="text-sm font-bold text-[var(--color-ink)]">{points} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
