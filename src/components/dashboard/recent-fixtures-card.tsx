"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconUsers, IconArrowRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type FixtureStatus = "upcoming" | "completed";

export interface FixtureItem {
  id: string;
  home: string;
  away: string;
  dateLabel: string;
  status: FixtureStatus;
}

export interface RecentFixturesCardProps {
  fixtures: FixtureItem[];
  loading?: boolean;
  className?: string;
  title?: string;
}

export default function RecentFixturesCard({
  fixtures,
  loading,
  className,
  title = "Recent Fixtures",
}: RecentFixturesCardProps) {
  return (
    <Card
      className={cn(
        "glass-panel border border-[var(--color-border)] shadow-sm",
        className
      )}
    >
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xl font-semibold text-[var(--color-ink)] flex items-center gap-2">
          {title}
          <span className="ml-2 h-0.5 flex-1 rounded-full bg-[var(--color-gold)]" />
        </CardTitle>

        {/* See more link */}
        <Link
          href="/fixtures"
          className="group flex items-center gap-1 text-sm font-medium text-[var(--color-gold)] hover:text-[var(--color-green)] transition-colors"
        >
          See more
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {fixtures.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-black/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <IconUsers className="h-5 w-5 text-[var(--color-ink-muted)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                      {f.home} vs {f.away}
                    </p>
                    <p className="mt-0.5 text-xs text-[color:var(--color-ink-muted)]">
                      {f.dateLabel}
                    </p>
                  </div>
                </div>
                <StatusBadge status={f.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: FixtureStatus }) {
  if (status === "upcoming") {
    return (
      <Badge className="[background:color-mix(in_oklab,var(--color-gold)_18%,white_82%)] text-[var(--color-ink)] border-transparent px-2 py-0.5 text-xs">
        upcoming
      </Badge>
    );
  }
  return (
    <Badge className="[background:color-mix(in_oklab,var(--color-green)_15%,white_85%)] text-[var(--color-green)] border-transparent px-2 py-0.5 text-xs">
      completed
    </Badge>
  );
}
