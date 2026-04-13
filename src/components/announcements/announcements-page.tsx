"use client";

import * as React from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAnnouncementsPage, type Paginated } from "@/lib/api-client";
import { type Announcement } from "@/lib/api-types";
import AnnouncementsTable from "@/components/announcements/announcements-table";
import CreateAnnouncementDialog from "@/components/announcements/create-announcement-dialog";

export default function AnnouncementsPage() {
  const qc = useQueryClient();

  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [createOpen, setCreateOpen] = React.useState(false);

  const annsQ = useQuery<Paginated<Announcement>>({
    queryKey: ["announcements", { q, page, pageSize }],
    queryFn: () =>
      listAnnouncementsPage({
        page,
        pageSize,
        // Server supports q, but if your api-client doesn't pass it through yet,
        // we also filter client-side below so the UX feels instant.
      }),
    placeholderData: keepPreviousData,
  });

  // quick client-side filter for snappy typing
  const filtered = React.useMemo(() => {
    const items = annsQ.data?.items ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((a) => {
      const titleMatch = (a.title ?? "").toLowerCase().includes(term);
      const bodyMatch = (a.body ?? "").toLowerCase().includes(term);
      return titleMatch || bodyMatch;
    });
  }, [annsQ.data?.items, q]);

  const onCreated = () => {
    setCreateOpen(false);
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Announcements</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Post updates and news for your league
          </p>
        </div>

        <Button
          className="flex items-center gap-2 bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
          onClick={() => setCreateOpen(true)}
        >
          <IconPlus className="h-4 w-4" />
          New post
        </Button>
      </div>

      {/* Sleek search bar */}
      <div className="rounded-xl bg-white shadow-sm border border-[var(--color-border)] p-0">
        <div className="flex items-center gap-2 px-3 py-2">
          <IconSearch className="h-4 w-4 text-[var(--color-ink-muted)]" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search announcements…"
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Table */}
      <AnnouncementsTable
        items={filtered}
        loading={annsQ.isLoading}
        page={annsQ.data?.page ?? page}
        pageSize={annsQ.data?.pageSize ?? pageSize}
        total={annsQ.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        onChanged={() => qc.invalidateQueries({ queryKey: ["announcements"] })}
      />

      {/* Create dialog */}
      <CreateAnnouncementDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onCreated}
      />
    </div>
  );
}
