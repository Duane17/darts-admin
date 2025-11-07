"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Leader } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

export type LeadershipTableProps = {
  items: Leader[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  className?: string;
};

export default function LeadershipTable({
  items,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
}: LeadershipTableProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const router = useRouter();

  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-white shadow-sm p-4 md:p-6", className)}>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
        <div className="px-4 md:px-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 w-[64px]">Photo</TableHead>
                <TableHead className="py-4 min-w-[220px]">Name</TableHead>
                <TableHead className="py-4 min-w-[220px]">Title</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="opacity-60">
                    {Array.from({ length: 3 }).map((__, j) => (
                      <TableCell key={j} className="py-4">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-[var(--color-ink-muted)]">
                    No leaders found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((l) => {
                  const go = () =>
                    router.push(`/leaders/detail?slug=${encodeURIComponent(l.slug)}`);
                  return (
                    <TableRow
                      key={l.id}
                      onClick={go}
                      className="cursor-pointer transition-colors hover:bg-gray-50/70 active:bg-gray-50"
                    >
                      <TableCell className="py-3" onClick={go}>
                        <div className="relative h-10 w-10 overflow-hidden rounded bg-gray-50">
                          {l.photo ? (
                            <Image
                              src={mediaUrl(l.photo)}
                              alt={l.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-100" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-medium" onClick={go}>
                        {l.name}
                      </TableCell>
                      <TableCell className="py-3 text-[var(--color-ink-muted)]" onClick={go}>
                        {l.title}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] px-4 md:px-6 py-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-ink-muted)]">Rows per page:</span>
          <select
            className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) || 20)}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="text-[var(--color-ink-muted)]">
          Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
