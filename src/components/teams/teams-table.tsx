// components/teams/teams-table.tsx
"use client";

import * as React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { deleteTeamApi } from "@/lib/api-client";
import { type Team } from "@/lib/api-types";
import { mediaUrl } from "@/lib/media";

export type TeamsTableProps = {
  items: Team[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  onEdit: (t: Team) => void;
  onChanged?: () => void;
  className?: string;
};

export default function TeamsTable({
  items,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onChanged,
  className,
}: TeamsTableProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  // Debug: log and expose the first few items so we can inspect fields in the browser
  React.useEffect(() => {
    const sample = items.slice(0, 5).map((t) => {
      const anyT = t as any;
      const logoPath: string | null | undefined =
        t.logoUrl ?? anyT.logo ?? anyT.photo ?? null;
      const final = logoPath ? mediaUrl(logoPath) : "";
      return { id: t.id, name: t.name, rawLogo: logoPath, resolved: final };
    });
    if (sample.length) {
      // eslint-disable-next-line no-console
      (globalThis as any).__teams = items;
    }
  }, [items]);

  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-white shadow-sm p-4 md:p-6", className)}>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
        <div className="px-4 md:px-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 w-[64px]">Logo</TableHead>
                <TableHead className="py-4 min-w-[220px]">Name</TableHead>
                <TableHead className="py-4 min-w-[160px]">City</TableHead>
                <TableHead className="py-4 min-w-[160px]">Home Venue</TableHead>
                <TableHead className="py-4 w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i} className="opacity-60">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j} className="py-4">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-[var(--color-ink-muted)]">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((t) => {
                  const anyT = t as any;
                  const logoPath: string | null | undefined =
                    t.logoUrl ?? anyT.logo ?? anyT.photo ?? null;
                  const src = logoPath ? mediaUrl(logoPath) : "";

                  return (
                    <TableRow key={t.id}>
                      <TableCell className="py-3">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={t.name}
                            className="h-8 w-8 rounded object-cover"
                            data-logo-src={src}
                            data-logo-raw={logoPath ?? ""}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-100" />
                        )}
                      </TableCell>
                      <TableCell className="py-3 font-medium">{t.name}</TableCell>
                      <TableCell className="py-3">
                        {t.city ?? <span className="text-[var(--color-ink-muted)]">-</span>}
                      </TableCell>
                      <TableCell className="py-3">
                        {t.homeVenue ?? <span className="text-[var(--color-ink-muted)]">-</span>}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(t)}>
                              <IconPencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={async () => {
                                if (!confirm(`Delete team "${t.name}"?`)) return;
                                await deleteTeamApi(t.id);
                                onChanged?.();
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

      {/* Footer: pagination */}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(pages, page + 1))}
            disabled={page >= pages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
