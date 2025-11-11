// src/components/common/BackToContent.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

type Props = { className?: string };

export default function BackToContent({ className = "" }: Props) {
  return (
    <div className={className}>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="pl-2 pr-3 gap-2 rounded-xl border shadow-sm hover:shadow-md transition"
      >
        <Link href="/content" aria-label="Back to Content">
          <IconArrowLeft className="size-4" />
          <span>Back</span>
        </Link>
      </Button>
    </div>
  );
}
