import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusTone = "ok" | "warn" | "down";

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  status?: { label: string; tone: StatusTone };
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * DashboardHeader
 * Top section title and subtext with optional status badge.
 * - Large title using token var(--text-page)
 * - Subtitle in muted ink
 * - Gold underline applied via .section-title::after
 * - Optional rightSlot for controls like date pickers or links
 */
export default function DashboardHeader({
  title,
  subtitle,
  status,
  rightSlot,
  className,
}: DashboardHeaderProps) {
  const statusClass = toneToBadgeClass(status?.tone);

  return (
    <header className={cn("mb-4 flex flex-col gap-2 md:mb-6", className)}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1
            className={cn(
              "section-title truncate text-[length:var(--text-page)] font-bold text-[var(--color-ink)]"
            )}
          >
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-1 text-[length:var(--text-body)] text-[color:var(--color-ink-muted)]">
              {subtitle}
            </p>
          ) : null}

          {status ? (
            <div className="mt-2">
              {/* ShadCN Badge with token-tinted backgrounds */}
              <Badge
                className={cn(
                  "border-transparent",
                  // Base badge reset to match project scale
                  "px-2 py-0.5 text-xs font-medium",
                  statusClass
                )}
              >
                {status.label}
              </Badge>
            </div>
          ) : null}
        </div>

        {/* Right aligned actions or filters */}
        {rightSlot ? (
          <div className="shrink-0">{rightSlot}</div>
        ) : null}
      </div>
    </header>
  );
}

/**
 * toneToBadgeClass
 * Maps status tone to green, gold, or red styles using project tokens.
 * Uses Tailwind v4 arbitrary properties so we can mix colors with tokens.
 */
function toneToBadgeClass(tone?: StatusTone) {
  switch (tone) {
    case "ok":
      return cn(
        // light green background, green text
        "[background:color-mix(in_oklab,var(--color-green)_15%,white_85%)]",
        "text-[var(--color-green)]"
      );
    case "warn":
      return cn(
        // light gold background, ink text for readability
        "[background:color-mix(in_oklab,var(--color-gold)_18%,white_82%)]",
        "text-[var(--color-ink)]"
      );
    case "down":
      return cn(
        // light red background, red text
        "[background:color-mix(in_oklab,var(--color-red)_15%,white_85%)]",
        "text-[var(--color-red)]"
      );
    default:
      return "";
  }
}
