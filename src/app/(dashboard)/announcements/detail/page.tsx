"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EditAnnouncementClient from "@/components/announcements/edit-announcement-page-client";
/**
 * Client wrapper:
 * - Reads ?id=... from the URL on the client
 * - Redirects to /announcements if id is missing
 * - Renders your existing client editor with the id prop
 */
export default function AnnouncementDetailClientPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") || "";

  useEffect(() => {
    if (!id.trim()) {
      router.replace("/announcements");
    }
  }, [id, router]);

  if (!id.trim()) return null; // avoid flicker during redirect
  return <EditAnnouncementClient id={id} />;
}
