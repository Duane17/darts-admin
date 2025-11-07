"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuickActionsPanelProps {
  onRecordResult: () => void;
  onScheduleFixture?: () => void;
  onViewReports?: () => void;
  title?: string;
  loading?: boolean;
  className?: string;
}

export default function QuickActionsPanel({
  onRecordResult,
  onScheduleFixture,
  onViewReports,
  title = "Quick Actions",
  loading,
  className,
}: QuickActionsPanelProps) {
  return (
    <Card className={cn("glass-panel border border-[var(--color-border)] shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-[var(--color-ink)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={onRecordResult}
          disabled={loading}
          className="w-full btn btn-secondary-green focus-gold"
        >
          Record Result
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onScheduleFixture}
          disabled={loading}
          className="w-full btn btn-outline-gold focus-gold"
        >
          Manage Teams
        </Button>
      </CardContent>
    </Card>
  );
}
