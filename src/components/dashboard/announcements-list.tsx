"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconBroadcast, IconArrowRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface AnnouncementItem {
  id: string;
  title: string;
  dateLabel: string;
  priority: "gold" | "success" | "error";
}

export interface AnnouncementsListProps {
  items: AnnouncementItem[];
  loading?: boolean;
  className?: string;
  title?: string;
}

export default function AnnouncementsList({
  items,
  loading,
  className,
  title = "Announcements",
}: AnnouncementsListProps) {
  return (
    <Card className={cn("glass-panel border border-[var(--color-border)] shadow-sm", className)}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xl font-semibold text-[var(--color-ink)] flex items-center gap-2">
          {title}
          <span className="ml-2 h-0.5 flex-1 rounded-full bg-[var(--color-gold)]" />
        </CardTitle>

        {/* See more link */}
        <Link
          href="/announcements"
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
              <div key={i} className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-black/[0.03]"
              >
                <IconBroadcast className="mt-0.5 h-5 w-5 text-[var(--color-ink-muted)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{a.title}</p>
                  <p className="mt-0.5 text-xs text-[color:var(--color-ink-muted)]">{a.dateLabel}</p>
                </div>
                <PriorityBadge priority={a.priority} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: "gold" | "success" | "error" }) {
  if (priority === "success") {
    return (
      <Badge className="[background:color-mix(in_oklab,var(--color-green)_15%,white_85%)] text-[var(--color-green)] border-transparent px-2 py-0.5 text-xs">
        success
      </Badge>
    );
  }
  if (priority === "error") {
    return (
      <Badge className="[background:color-mix(in_oklab,var(--color-red)_15%,white_85%)] text-[var(--color-red)] border-transparent px-2 py-0.5 text-xs">
        error
      </Badge>
    );
  }
  return (
    <Badge className="[background:color-mix(in_oklab,var(--color-gold)_18%,white_82%)] text-[var(--color-ink)] border-transparent px-2 py-0.5 text-xs">
      gold
    </Badge>
  );
}
