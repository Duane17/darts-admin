"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeaderEditPage from "@/components/leaders/leader-detail-page";

export default function DetailPageClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const slug = sp.get("slug") || "";

  useEffect(() => {
    if (!slug.trim()) {
      router.replace("/leaders");
    }
  }, [slug, router]);

  if (!slug.trim()) return null;
  return <LeaderEditPage slug={slug} />;
}
