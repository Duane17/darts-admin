"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import StatCard from "@/components/dashboard/stat-card";

export type StatGridItem = React.ComponentProps<typeof StatCard>;

export interface StatGridProps {
  items: StatGridItem[];
  className?: string;
}

/**
 * StatGrid
 * Responsive layout for multiple StatCard tiles.
 * - 1 column on mobile
 * - 2 columns at md
 * - 3 columns at lg
 * Skeleton behavior:
 * - If items is empty, render 3 skeleton StatCards as a loading placeholder
 * - If items are provided with loading=true, StatCard will render its own skeleton
 */
export default function StatGrid({ items, className }: StatGridProps) {
  const shouldShowFallbackSkeletons = items.length === 0;
  const skeletonCount = 3;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {shouldShowFallbackSkeletons
        ? Array.from({ length: skeletonCount }).map((_, idx) => (
            <StatCard
              key={`stat-skel-${idx}`}
              label="Loading"
              value="—"
              loading
            />
          ))
        : items.map((props, idx) => <StatCard key={idx} {...props} />)}
    </div>
  );
}
