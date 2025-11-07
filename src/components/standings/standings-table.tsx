// components/standings/standings-table.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StandingRow } from "@/lib/api-types";
import { parseLast5 } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

export type StandingsTableProps = {
  rows: StandingRow[];
  loading?: boolean;
  className?: string;
  showGroup?: boolean;
  showLast5?: boolean;
};

/**
 * Resolve a displayable logo URL for a row.
 * 1) prefer normalized teamLogoUrl
 * 2) try any nested relation that might be present
 * Return null when nothing usable exists.
 */
function getLogoSrc(r: StandingRow): string | null {
  const direct = r.teamLogoUrl?.trim();
  if (direct) return mediaUrl(direct);

  // Some APIs might still return a nested team projection during transition
  const nestedAny = (r as unknown as { team?: { logoUrl?: string | null } })?.team?.logoUrl;
  if (nestedAny && nestedAny.trim()) return mediaUrl(nestedAny);

  return null;
}

/** Small colored chip for W/D/L */
function last5Chip(ch: string) {
  const base =
    "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white";
  if (ch === "W") return cn(base, "bg-emerald-600");
  if (ch === "D") return cn(base, "bg-amber-500");
  return cn(base, "bg-rose-500"); // L
}

/** Robustly resolve last 5 letters from either array or compact string */
function getLast5(row: StandingRow): string[] {
  if (Array.isArray(row.last5Array) && row.last5Array.length > 0) {
    return row.last5Array.slice(0, 5);
  }
  return parseLast5(row.last5).slice(0, 5);
}

/** Mobile card used below md */
function MobileRow({
  r,
  showGroup,
  showLast5,
}: {
  r: StandingRow;
  showGroup: boolean;
  showLast5: boolean;
}) {
  const last5 = getLast5(r);
  const logoSrc = getLogoSrc(r);

  return (
    <li className="rounded-lg border border-[var(--color-border)] p-3">
      <div className="flex items-center gap-3">
        {/* Rank pill */}
        <div className="flex h-7 w-7 items-center justify-center rounded bg-gray-100 text-sm font-semibold text-[var(--color-ink)]">
          {r.rank}
        </div>

        {/* Logo + name */}
        <div className="relative h-8 w-8 overflow-hidden rounded bg-gray-50 shrink-0">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={`${r.teamName} logo`}
              fill
              sizes="32px"
              className="object-contain"
              priority={false}
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="truncate font-medium text-[var(--color-ink)]">
            {r.teamName}
          </div>
          <div className="text-xs text-[var(--color-ink-muted)]">
            {showGroup && r.group ? `Group ${r.group}` : null}
          </div>
        </div>

        {/* Points badge on the right */}
        <div className="ml-auto rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
          {r.points} pts
        </div>
      </div>

      {/* Key stats grid */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-md border border-[var(--color-border)] py-1">
          <div className="text-[var(--color-ink-muted)]">P</div>
          <div className="font-semibold text-[var(--color-ink)]">{r.played}</div>
        </div>
        <div className="rounded-md border border-[var(--color-border)] py-1">
          <div className="text-[var(--color-ink-muted)]">W</div>
          <div className="font-semibold text-[var(--color-ink)]">{r.won}</div>
        </div>
        <div className="rounded-md border border-[var(--color-border)] py-1">
          <div className="text-[var(--color-ink-muted)]">GD</div>
          <div className="font-semibold text-[var(--color-ink)]">{r.goalDiff}</div>
        </div>
        <div className="rounded-md border border-[var(--color-border)] py-1">
          <div className="text-[var(--color-ink-muted)]">GF</div>
          <div className="font-semibold text-[var(--color-ink)]">{r.goalsFor}</div>
        </div>
      </div>

      {/* Optional Last 5 */}
      {showLast5 && (
        <div className="mt-3 flex items-center gap-1">
          <span className="text-xs text-[var(--color-ink-muted)]">Last 5</span>
          <div className="ml-1 flex items-center gap-1">
            {last5.length > 0 ? (
              last5.map((ch, idx) => (
                <span key={`${r.teamId}-m-l5-${idx}`} className={last5Chip(ch)}>
                  {ch}
                </span>
              ))
            ) : (
              <span className="text-xs text-[var(--color-ink-muted)]">None</span>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function StandingsTable({
  rows,
  loading,
  className,
  showGroup = false,
  showLast5 = true,
}: StandingsTableProps) {
  // Desktop col count for skeleton and empty state
  const colCount = 10 + (showGroup ? 1 : 0) + (showLast5 ? 1 : 0);

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-white shadow-sm",
        className
      )}
    >
      {/* Mobile list view */}
      <div className="p-3 md:hidden">
        {loading ? (
          <ul className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={`mobile-skel-${i}`}
                className="h-20 rounded-lg border border-[var(--color-border)] bg-gray-100/60"
              />
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-[var(--color-ink-muted)]">
            No standings to display
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <MobileRow
                key={r.teamId}
                r={r}
                showGroup={showGroup}
                showLast5={showLast5}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden w-full overflow-x-auto md:block lg:overflow-visible">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center px-2">#</TableHead>

              {/* Team column */}
              <TableHead className="min-w-[200px] md:min-w-[240px] px-3">
                Team
              </TableHead>

              {/* Optional Group column. Shown from lg to save space */}
              {showGroup && (
                <TableHead className="w-14 text-center px-2 whitespace-nowrap hidden lg:table-cell">
                  Group
                </TableHead>
              )}

              {/* Show P always. W/D/L appear from lg. */}
              <TableHead className="w-12 text-center px-2">P</TableHead>
              <TableHead className="w-12 text-center px-2 hidden lg:table-cell">
                W
              </TableHead>
              <TableHead className="w-12 text-center px-2 hidden lg:table-cell">
                D
              </TableHead>
              <TableHead className="w-12 text-center px-2 hidden lg:table-cell">
                L
              </TableHead>

              {/* GF and GA appear from lg. GD and Pts always shown */}
              <TableHead className="w-14 text-center px-2 whitespace-nowrap hidden lg:table-cell">
                GF
              </TableHead>
              <TableHead className="w-14 text-center px-2 whitespace-nowrap hidden lg:table-cell">
                GA
              </TableHead>
              <TableHead className="w-14 text-center px-2 whitespace-nowrap">
                GD
              </TableHead>
              <TableHead className="w-16 text-center px-2 whitespace-nowrap">
                Pts
              </TableHead>

              {/* Optional Last 5 column only from xl */}
              {showLast5 && (
                <TableHead className="w-[120px] text-center px-2 whitespace-nowrap hidden xl:table-cell">
                  Last 5
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="opacity-60">
                    {Array.from({ length: colCount }).map((__, j) => (
                      <TableCell key={j} className="px-3 py-2.5">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.length === 0
              ? (
                <TableRow>
                  <TableCell
                    colSpan={colCount}
                    className="py-10 text-center text-[var(--color-ink-muted)]"
                  >
                    No standings to display
                  </TableCell>
                </TableRow>
              )
              : rows.map((r) => {
                  const last5 = getLast5(r);
                  const logoSrc = getLogoSrc(r);

                  return (
                    <TableRow key={r.teamId} className="align-middle">
                      <TableCell
                        className="text-center font-medium px-2 py-2.5"
                        aria-label="Rank"
                      >
                        {r.rank}
                      </TableCell>

                      <TableCell className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="relative h-7 w-7 overflow-hidden rounded bg-gray-50"
                            aria-hidden
                          >
                            {logoSrc ? (
                              <Image
                                src={logoSrc}
                                alt={`${r.teamName} logo`}
                                fill
                                sizes="28px"
                                className="object-contain"
                                priority={false}
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-[var(--color-ink)]">
                              {r.teamName}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {showGroup && (
                        <TableCell className="text-center px-2 py-2.5 hidden lg:table-cell">
                          {r.group ?? ""}
                        </TableCell>
                      )}

                      <TableCell className="text-center px-2 py-2.5">
                        {r.played}
                      </TableCell>
                      <TableCell className="text-center px-2 py-2.5 hidden lg:table-cell">
                        {r.won}
                      </TableCell>
                      <TableCell className="text-center px-2 py-2.5 hidden lg:table-cell">
                        {r.drawn}
                      </TableCell>
                      <TableCell className="text-center px-2 py-2.5 hidden lg:table-cell">
                        {r.lost}
                      </TableCell>
                      <TableCell className="text-center px-2 py-2.5 hidden lg:table-cell">
                        {r.goalsFor}
                      </TableCell>
                      <TableCell className="text-center px-2 py-2.5 hidden lg:table-cell">
                        {r.goalsAgainst}
                      </TableCell>
                      <TableCell className="text-center font-medium px-2 py-2.5">
                        {r.goalDiff}
                      </TableCell>
                      <TableCell className="text-center font-semibold px-2 py-2.5">
                        {r.points}
                      </TableCell>

                      {showLast5 && (
                        <TableCell className="px-2 py-2.5 hidden xl:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {last5.length > 0 ? (
                              last5.map((ch, idx) => (
                                <span
                                  key={`${r.teamId}-l5-${idx}`}
                                  className={last5Chip(ch)}
                                  aria-label={ch === "W" ? "Win" : ch === "D" ? "Draw" : "Loss"}
                                  title={ch === "W" ? "Win" : ch === "D" ? "Draw" : "Loss"}
                                >
                                  {ch}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[var(--color-ink-muted)]">
                                None
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
