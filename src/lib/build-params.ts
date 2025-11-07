// src/lib/build-params.ts
// Minimal build-time helpers for static export

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:4000";

type LeaderRef = { slug: string };
type AnnouncementRef = { id: string };

// Fetch all leader slugs for /leaders/[slug]
export async function getAllLeaderSlugs(): Promise<LeaderRef[]> {
  // Example: GET /leaders/refs returns [{ slug: "john-doe" }, ...]
  const res = await fetch(`${API_BASE}/leaders/refs`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as LeaderRef[] | { items: LeaderRef[] };
  return Array.isArray(data) ? data : data.items ?? [];
}

// Fetch all announcement ids for /announcements/[id]
export async function getAllAnnouncementIds(): Promise<AnnouncementRef[]> {
  // Example: GET /announcements/refs returns [{ id: "uuid" }, ...]
  const res = await fetch(`${API_BASE}/announcements/refs`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as AnnouncementRef[] | { items: AnnouncementRef[] };
  return Array.isArray(data) ? data : data.items ?? [];
}
