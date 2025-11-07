"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type DeltaTone = "up" | "down" | "neutral";
type Variant = "glass" | "solid";

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; tone: DeltaTone };
  icon?: React.ReactNode;
  action?: { label: string; href: string };
  loading?: boolean;
  variant?: Variant; // default glass
  className?: string;
}

/**
 * StatCard
 * Single KPI tile with metric, label, optional delta and CTA.
 * Visual:
 * - glass-panel by default
 * - value in green text-[var(--color-green)]
 * - delta rendered as a small badge
 * A11y:
 * - value wrapped in aria-live="polite"
 * React Query:
 * - caller supplies data, no internal fetch
 */
export default function StatCard({
  label,
  value,
  delta,
  icon,
  action,
  loading,
  variant = "glass",
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card
        className={cn(
          variant === "glass"
            ? "glass-panel border border-[var(--color-border)]"
            : "bg-white",
          "shadow-sm",
          className
        )}
      >
        <CardHeader className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
        {action ? (
          <CardFooter>
            <Skeleton className="h-9 w-28" />
          </CardFooter>
        ) : null}
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        variant === "glass"
          ? "glass-panel border border-[var(--color-border)]"
          : "bg-white",
        "shadow-sm",
        className
      )}
      role="region"
      aria-label={`${label} card`}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-sm font-medium text-[color:var(--color-ink-muted)]">
            {label}
          </CardTitle>
        </div>
        {icon ? (
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-md",
              "h-8 w-8",
              // icon can inherit color; default to ink with slight green tint on glass
              variant === "glass"
                ? "[background:color-mix(in_oklab,var(--color-green)_8%,white_92%)] text-[var(--color-ink)]"
                : "bg-white text-[var(--color-ink)]"
            )}
            aria-hidden="true"
          >
            {/* icons from Tabler or any React node */}
            {icon}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Live region for metric updates */}
        <div
          className="text-2xl font-semibold leading-none tracking-tight text-[var(--color-green)]"
          aria-live="polite"
        >
          {value}
        </div>

        {delta ? (
          <Badge className={cn("border-transparent px-2 py-0.5 text-xs", badgeClass(delta.tone))}>
            {deltaLabel(delta.tone)} {delta.value}
          </Badge>
        ) : null}
      </CardContent>

      {action ? (
        <CardFooter>
          <Button asChild variant="outline" className="btn btn-outline-gold focus-gold">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function badgeClass(tone: DeltaTone) {
  switch (tone) {
    case "up":
      return cn(
        "text-[var(--color-green)]",
        "[background:color-mix(in_oklab,var(--color-green)_15%,white_85%)]"
      );
    case "down":
      return cn(
        "text-[var(--color-red)]",
        "[background:color-mix(in_oklab,var(--color-red)_15%,white_85%)]"
      );
    case "neutral":
      return cn(
        "text-[var(--color-ink)]",
        "[background:color-mix(in_oklab,var(--color-ink-muted)_15%,white_85%)]"
      );
  }
}

function deltaLabel(tone: DeltaTone) {
  if (tone === "up") return "Up";
  if (tone === "down") return "Down";
  return "No change";
}
