"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listLeadersPage } from "@/lib/api-client";
import type { Leader } from "@/lib/api-types";
import LeadershipTable from "./leadership-table";

export default function LeadershipPage() {
  const qc = useQueryClient();
  const router = useRouter();

  // UI state
  const [q, setQ] = React.useState("");
  const [limit, setLimit] = React.useState(20);
  const [page, setPage] = React.useState(1);

  const offset = (page - 1) * limit;

  const leadersQ = useQuery({
    queryKey: ["leaders", { q, limit, offset }],
    queryFn: () => listLeadersPage({ q: q || undefined, limit, offset }),
    placeholderData: keepPreviousData,
  });

  const items: Leader[] = leadersQ.data?.items ?? [];
  const total = leadersQ.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Leadership</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Meet the people leading the organization
          </p>
        </div>

        {/* Add New Leader */}
        <Button
          className="bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
          onClick={() => router.push("/leaders/new")}
        >
          <IconPlus className="mr-2 h-4 w-4" />
          Add New Leader
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
            placeholder="Search leaders by name or title…"
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Table */}
      <LeadershipTable
        items={items}
        loading={leadersQ.isLoading}
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
    </div>
  );
}
