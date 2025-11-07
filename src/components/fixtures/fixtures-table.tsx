"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { IconDots, IconPencil, IconTrophy, IconTrash } from "@tabler/icons-react";

import type { Fixture, TeamRef } from "@/lib/api-types";
import { toUiFixtureStatus } from "@/lib/api-types";

/** Helpers */

function teamName(t: TeamRef | null | undefined): string {
  return t?.name?.trim() || "TBA";
}

function fixtureDate(f: Fixture): string {
  const d = f.kickoff ?? f.date ?? null;
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function fixtureTime(f: Fixture): string {
  const d = f.kickoff ?? f.date ?? null;
  if (!d) return "TBA";
  return new Date(d).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(f: Fixture): React.ReactNode {
  const s = toUiFixtureStatus(f);
  if (s === "completed") {
    return (
      <Badge className="[background:color-mix(in_oklab,var(--color-green)_15%,white_85%)] text-[var(--color-green)] border-transparent">
        Played
      </Badge>
    );
  }
  if (f.status === "POSTPONED") {
    return (
      <Badge className="[background:color-mix(in_oklab,var(--color-gold)_18%,white_82%)] text-[var(--color-ink)] border-transparent">
        Postponed
      </Badge>
    );
  }
  if (f.status === "CANCELLED") {
    return (
      <Badge className="[background:color-mix(in_oklab,var(--color-ink)_12%,white_88%)] text-[var(--color-ink-muted)] border-transparent">
        Canceled
      </Badge>
    );
  }
  return (
    <Badge className="[background:color-mix(in_oklab,var(--color-gold)_18%,white_82%)] text-[var(--color-ink)] border-transparent">
      Scheduled
    </Badge>
  );
}

function scoreLabel(f: Fixture): string {
  const hs = typeof (f as any).homeScore === "number" ? (f as any).homeScore : f.result?.homeScore;
  const as = typeof (f as any).awayScore === "number" ? (f as any).awayScore : f.result?.awayScore;
  if (typeof hs === "number" && typeof as === "number") return `${hs} - ${as}`;
  return "-";
}



/** Sorting */

type SortKey = "date" | "home" | "away" | "venue" | "status" | "score";
type SortDir = "asc" | "desc";

function byKey(a: Fixture, b: Fixture, key: SortKey, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  switch (key) {
    case "date": {
      const ta = Date.parse(a.kickoff ?? a.date ?? "");
      const tb = Date.parse(b.kickoff ?? b.date ?? "");
      return mul * ((tb || 0) - (ta || 0));
    }
    case "home":
      return mul * teamName(a.homeTeam).localeCompare(teamName(b.homeTeam));
    case "away":
      return mul * teamName(a.awayTeam).localeCompare(teamName(b.awayTeam));
    case "venue":
      return mul * String(a.venue ?? "").localeCompare(String(b.venue ?? ""));
    case "status": {
      const sa = toUiFixtureStatus(a);
      const sb = toUiFixtureStatus(b);
      return mul * sa.localeCompare(sb);
    }
    case "score": {
      const ah = a.result?.homeScore ?? (typeof a.homeScore === "number" ? a.homeScore : -1);
      const aa = a.result?.awayScore ?? (typeof a.awayScore === "number" ? a.awayScore : -1);
      const bh = b.result?.homeScore ?? (typeof b.homeScore === "number" ? b.homeScore : -1);
      const ba = b.result?.awayScore ?? (typeof b.awayScore === "number" ? b.awayScore : -1);
      const as = ah >= 0 && aa >= 0 ? ah + aa : -1;
      const bs = bh >= 0 && ba >= 0 ? bh + ba : -1;
      return mul * (as - bs);
    }
  }
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Props */

export type FixturesTableProps = {
  fixtures: Fixture[];
  loading?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;

  onEdit?: (f: Fixture) => void;
  onRecordResult?: (f: Fixture) => void;
  onDelete?: (f: Fixture) => void;

  className?: string;
};

export default function FixturesTable({
  fixtures,
  loading,
  onEdit,
  onRecordResult,
  onDelete,
  className,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
}: FixturesTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);

  React.useEffect(() => setPage(1), [fixtures]);

  const sorted = React.useMemo(() => {
    const copy = [...fixtures];
    copy.sort((a, b) => byKey(a, b, sortKey, sortDir));
    return copy;
  }, [fixtures, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = React.useMemo(() => paginate(sorted, page, pageSize), [sorted, page, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const renderSort = (key: SortKey, label: string) => {
    const active = sortKey === key;
    const arrow = !active ? "" : sortDir === "asc" ? "↑" : "↓";
    return (
      <button
        onClick={() => toggleSort(key)}
        className={cn(
          "inline-flex items-center gap-1 text-left font-medium",
          active ? "text-[var(--color-ink)]" : "text-[var(--color-ink)]/80"
        )}
        title="Sort"
      >
        {label} {arrow}
      </button>
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-white shadow-sm p-4 md:p-6",
        className
      )}
    >
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
        <div className="px-4 md:px-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 min-w-[120px]">{renderSort("date", "Date")}</TableHead>
                <TableHead className="py-4 min-w-[90px]">{renderSort("date", "Time")}</TableHead>
                <TableHead className="py-4 min-w-[200px]">{renderSort("home", "Home Team")}</TableHead>
                <TableHead className="py-4 min-w-[200px]">{renderSort("away", "Away Team")}</TableHead>
                <TableHead className="py-4 min-w-[220px]">{renderSort("venue", "Venue")}</TableHead>
                <TableHead className="py-4 min-w-[130px]">{renderSort("status", "Status")}</TableHead>
                <TableHead className="py-4 min-w-[100px]">{renderSort("score", "Score")}</TableHead>
                <TableHead className="py-4 w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i} className="opacity-60">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j} className="py-4">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-[var(--color-ink-muted)]">
                    No fixtures found
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((f) => {
                  const s = toUiFixtureStatus(f);
                  const canEditScore = s !== "completed";

                  return (
                    <TableRow key={f.id}>
                      <TableCell className="py-4 whitespace-nowrap">{fixtureDate(f)}</TableCell>
                      <TableCell className="py-4 whitespace-nowrap">{fixtureTime(f)}</TableCell>
                      <TableCell className="py-4 max-w-[260px] truncate">{teamName(f.homeTeam)}</TableCell>
                      <TableCell className="py-4 max-w-[260px] truncate">
                        {f.isBye || !f.awayTeamId ? "Bye" : teamName(f.awayTeam)}
                      </TableCell>
                      <TableCell className="py-4 max-w-[280px] truncate">
                        {f.venue || <span className="text-[var(--color-ink-muted)]">TBA</span>}
                      </TableCell>
                      <TableCell className="py-4">{statusBadge(f)}</TableCell>
                      <TableCell className="py-4 font-semibold">{scoreLabel(f)}</TableCell>

                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Actions" className="ml-auto">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => onEdit?.(f)}>
                              <IconPencil className="mr-2 h-4 w-4" />
                              Edit fixture
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onRecordResult?.(f)}>
                              <IconTrophy className="mr-2 h-4 w-4" />
                              {canEditScore ? "Record score" : "Update score"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => onDelete?.(f)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer: pagination and page size */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] px-4 md:px-6 py-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-ink-muted)]">Rows per page:</span>
          <select
            className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1"
            value={pageSize}
            onChange={(e) => {
              const n = Number(e.target.value) || 10;
              setPageSize(n);
              setPage(1);
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[var(--color-ink-muted)]">
          Page {page} of {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
