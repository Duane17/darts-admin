"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { deleteAnnouncement } from "@/lib/api-client";
import { type Announcement } from "@/lib/api-types";

export type AnnouncementsTableProps = {
  items: Announcement[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  onChanged?: () => void;
  className?: string;
};

function getPlainText(content: string) {
  if (!content) return "";

  // Simple check: if it contains < and >, treat as HTML
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    return content
      .replace(/<[^>]*>/g, " ") // Replace tags with spaces
      .replace(/&nbsp;/g, " ")   // Handle common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")      // Collapse multiple spaces/newlines
      .trim();
  }

  // If it's old Markdown or Plain text, just clean up whitespace
  return content.replace(/\s+/g, " ").trim();
}

function priorityBadge(p?: Announcement["priority"]) {
  const clsBase = "border-transparent";
  if (p === "success")
    return <Badge className={cn(clsBase, "[background:color-mix(in_oklab,var(--color-green)_15%,white_85%)] text-[var(--color-green)]")}>Success</Badge>;
  if (p === "error")
    return <Badge className={cn(clsBase, "[background:color-mix(in_oklab,crimson_18%,white_82%)] text-[crimson]")}>Alert</Badge>;
  if (p === "gold")
    return <Badge className={cn(clsBase, "[background:color-mix(in_oklab,var(--color-gold)_18%,white_82%)] text-[var(--color-ink)]")}>Priority</Badge>;
  return <Badge variant="secondary">Normal</Badge>;
}

export default function AnnouncementsTable({
  items,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onChanged,
  className,
}: AnnouncementsTableProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-white shadow-sm p-4 md:p-6", className)}>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
        <div className="px-4 md:px-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 min-w-[280px]">Title</TableHead>
                <TableHead className="py-4 min-w-[160px]">Published</TableHead>
                <TableHead className="py-4 w-[80px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i} className="opacity-60">
                    {Array.from({ length: 3 }).map((__, j) => (
                      <TableCell key={j} className="py-4">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-[var(--color-ink-muted)]">
                    No announcements yet
                  </TableCell>
                </TableRow>
              ) : (
                items.map((a) => {
                  const when = a.createdAt
                    ? format(new Date(a.createdAt), "dd MMM yyyy, HH:mm")
                    : "-";
                  const href = `/announcements/detail/?id=${encodeURIComponent(a.id)}`;
                  
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="py-3">
                        <Link
                          href={href}
                          className="text-[var(--color-ink)] hover:underline font-medium"
                          title="Edit announcement"
                        >
                          {a.title || "Untitled Announcement"}
                        </Link>
                        {a.body ? (
                          <div className="mt-1 line-clamp-1 text-xs text-[var(--color-ink-muted)]">
                            {getPlainText(a.body)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-3">{when}</TableCell>
                      <TableCell className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={href}>
                                <IconPencil className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={async () => {
                                if (!confirm(`Delete announcement "${a.title}"?`)) return;
                                try {
                                  await deleteAnnouncement(a.id);
                                  onChanged?.();
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                            >
                              <IconTrash className="mr-2 h-4 w-4" /> Delete
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
          Page {page} of {pages}
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