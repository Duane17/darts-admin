// src/lib/api-client.ts
import { http, HttpError } from "./http";
import type {
  Announcement,
  Fixture,
  Leader,
  StandingRow,
  Result,
  Team,
  BackendStanding,
  League,
  HomeContent,
  AboutContent,
  AnnouncementsContent
} from "./api-types";
import { normalizeStandings } from "./api-types";

/** Pagination shapes used by the server */
export type PageParams = { page?: number; pageSize?: number };
export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};



export type FixtureTypeApi =
  | "SMK_TRADING_CRDL"
  | "SRDL_LEAGUE"
  | "FRIENDLY"
  | "TOURNAMENT"
  | "TRAINING"
  | "COMMUNITY"
  | "WORKSHOP";

export type BackendFixtureStatus = "SCHEDULED" | "PLAYED" | "POSTPONED" | "CANCELLED";

export type ListLeadersParams = {
  q?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  sort?: "name_asc" | "name_desc" | "title_asc" | "title_desc" | "newest" | "oldest";
};


/** Normalizer helpers */
function asArray<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  const any = input as any;
  if (Array.isArray(any?.items)) return any.items as T[];
  if (Array.isArray(any?.data)) return any.data as T[];
  return [];
}

function toStandingRows(items: any[]): StandingRow[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (typeof items[0]?.teamName === "string" && "rank" in items[0]) {
    return items as StandingRow[];
  }
  return normalizeStandings(items as BackendStanding[]);
}

function toQS(params?: Record<string, string | number | boolean | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) q.set(k, String(v));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Fetch all pages utility used for accurate stats */
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
  hardCap = 1000
): Promise<T[]> {
  let page = 1;
  const out: T[] = [];
  for (; page <= hardCap; page++) {
    const res = await fetchPage(page);
    out.push(...res.items);
    if (page >= res.pages) break;
  }
  return out;
}

/** Announcements: single page and fetch all */
// Announcements
export async function listAnnouncementsPage(
  params: PageParams = {}
): Promise<Paginated<Announcement>> {
  const qs = toQS({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    limit: params.pageSize ?? 20,
  });

  const res = await http.get(`/announcements${qs}`);
  const any = res as any;

  const items = asArray<Announcement>(any);
  const page = Number(any?.page ?? 1) || 1;
  const pageSize = Number((any?.pageSize ?? any?.limit ?? items.length) || 20) || 20;
  const total = Number((any?.total ?? items.length) || 0) || items.length;
  const pages = Number(any?.pages ?? Math.max(1, Math.ceil(total / pageSize))) || 1;

  return { items, page, pageSize, total, pages };
}


export async function listAnnouncementsAll(): Promise<Announcement[]> {
  return fetchAllPages<Announcement>((p) => listAnnouncementsPage({ page: p, pageSize: 100 }));
}

export async function listAnnouncements(): Promise<Announcement[]> {
  // For callers that want an array and do not care about pages
  const page1 = await listAnnouncementsPage({ page: 1, pageSize: 100 });
  return page1.items;
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  return http.get(`/announcements/${encodeURIComponent(id)}`);
}

// Admin only
export async function createAnnouncement(input: {
  title: string;
  body?: string;
  priority?: "gold" | "success" | "error";
}): Promise<Announcement> {
  return http.post("/announcements", input);
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<Announcement>
): Promise<Announcement> {
  return http.patch(`/announcements/${encodeURIComponent(id)}`, patch);
}

export async function deleteAnnouncement(id: string): Promise<{ ok: true }> {
  return http.delete(`/announcements/${encodeURIComponent(id)}`);
}

/** Fixtures: single page and fetch all */
export type ListFixturesParams = PageParams & {
  league?: "SRDL_LEAGUE" | "SMK_TRADING_CRDL";
  type?: "SRDL_LEAGUE" | "SMK_TRADING_CRDL" | "FRIENDLY" | "TOURNAMENT" | "TRAINING" | "COMMUNITY" | "WORKSHOP";
  season?: string;
  teamId?: string;
  status?: "SCHEDULED" | "PLAYED" | "POSTPONED" | "CANCELLED";
  week?: number;
  weekFrom?: number;
  weekTo?: number;
  includeResults?: boolean; // <- new
};

// Fixtures
export async function listFixturesPage(
  params: ListFixturesParams = {}
): Promise<Paginated<Fixture>> {
  const qs = toQS({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    league: params.league,
    type: params.type,
    season: params.season,
    teamId: params.teamId,
    status: params.status,
    week: params.week,
    weekFrom: params.weekFrom,
    weekTo: params.weekTo,
    includeResults: params.includeResults ?? true,
  });

  const res = await http.get(`/fixtures${qs}`);
  const any = res as any;

  const items = asArray<Fixture>(any);
  const page = Number(any?.page ?? 1) || 1;
  const pageSize = Number((any?.pageSize ?? items.length) || 20) || 20;
  const total = Number(any?.total ?? items.length) || 0 || items.length;
  const pages = Number(any?.pages ?? Math.max(1, Math.ceil(total / pageSize))) || 1;

  return { items, page, pageSize, total, pages };
}


export async function listFixturesAll(params: Omit<ListFixturesParams, "page" | "pageSize"> = {}): Promise<Fixture[]> {
  async function fetchPage(page: number) {
    return listFixturesPage({ ...params, page, pageSize: 100, includeResults: params.includeResults ?? true });
  }

  let p = 1;
  const out: Fixture[] = [];
  for (;; p++) {
    const res = await fetchPage(p);
    out.push(...res.items);
    if (p >= res.pages) break;
  }
  return out;
}


export async function listFixtures(): Promise<Fixture[]> {
  // For callers that want an array and do not care about pages
  const page1 = await listFixturesPage({ page: 1, pageSize: 100 });
  return page1.items;
}

// Admin only
export async function createFixture(input: {
  season: string;
  week: number;
  title: string;
  date: string;
  type: FixtureTypeApi;
  venue: string;
  city?: string;
  status?: BackendFixtureStatus;
  isBye?: boolean;
  homeTeamId: string;
  awayTeamId?: string;
  description?: string;
}): Promise<Fixture> {
  const payload = {
    season: input.season,
    week: input.week,
    title: input.title ?? "",
    date: input.date,
    endDate: null,
    type: input.type,
    venue: input.venue,
    city: input.city ?? null,
    description: input.description ?? null,
    venueTBA: false,
    kickoffTBA: false,
    status: input.status ?? "SCHEDULED",
    isBye: Boolean(input.isBye),
    homeTeamId: input.homeTeamId,
    ...(input.isBye ? {} : { awayTeamId: input.awayTeamId }),
  };

  return http.post("/fixtures", payload);
}


export async function updateFixture(
  id: string,
  patch: Partial<Fixture>
): Promise<Fixture> {
  return http.patch(`/fixtures/${encodeURIComponent(id)}`, patch);
}

export async function deleteFixture(id: string): Promise<{ ok: true }> {
  return http.delete(`/fixtures/${encodeURIComponent(id)}`);
}

/** Leaders */

// Leaders
export async function listLeadersPage(
  params: ListLeadersParams = {}
): Promise<{ items: Leader[]; limit: number; offset: number; total: number; hasMore: boolean }> {
  const qs = toQS({
    q: params.q,
    activeOnly: params.activeOnly,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? "name_asc",
  });

  const res = await http.get(`/leaders${qs}`);
  const any = res as any;

  const items = asArray<Leader>(any);
  const limit = Number(any?.limit ?? items.length ?? 20) || 20;
  const offset = Number(any?.offset ?? 0) || 0;
  const total = Number(any?.total ?? items.length ?? 0) || items.length;
  const hasMore = Boolean(any?.hasMore ?? offset + items.length < total);

  return { items, limit, offset, total, hasMore };
}


export async function listLeaders(params: Omit<ListLeadersParams, "limit" | "offset"> = {}): Promise<Leader[]> {
  const page1 = await listLeadersPage({ ...params, limit: 100, offset: 0 });
  return page1.items;
}

export async function getLeaderBySlug(slug: string): Promise<Leader> {
  return http.get(`/leaders/${encodeURIComponent(slug)}`);
}

// Admin only
export async function createLeader(input: {
  slug: string;
  name: string;
  title: string;
  photo?: string;
  tagline?: string;
  profile?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  responsibilities?: string[];
  achievements?: string[];
  education?: string[];
  leadershipSkills?: string[];
  professionalBackground?: string;
  sportingJourney?: string;
  term?: string;
  socials?: unknown;
  active?: boolean;
}): Promise<Leader> {
  return http.post("/leaders", input);
}

export async function updateLeader(
  id: string,
  patch: Partial<Leader>
): Promise<Leader> {
  return http.patch(`/leaders/${encodeURIComponent(id)}`, patch);
}

export async function deleteLeader(id: string): Promise<{ ok: true }> {
  return http.delete(`/leaders/${encodeURIComponent(id)}`);
}

/** Standings */
export const SEASON =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SEASON
    ? String(process.env.NEXT_PUBLIC_SEASON)
    : ""; // empty means "no filter"

export async function getStandings(season: string = SEASON): Promise<StandingRow[]> {
  const qs = season && season.trim().length > 0
    ? `?season=${encodeURIComponent(season)}`
    : "";

  const res = await http.get(`/standings${qs}`);
  const items = asArray<any>(res);

  if (items.length === 0) return [];

  const looksLikeStandingRow = typeof items[0]?.teamName === "string";
  if (looksLikeStandingRow) {
    const hasAllKeys = items[0].teamId && typeof items[0].points === "number" && ("teamLogoUrl" in items[0]);
    if (hasAllKeys) return items as StandingRow[];
    const backAsStanding = items.map((r: any): BackendStanding => ({
      id: r.id ?? r.teamId,
      teamId: r.teamId,
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDiff: r.goalDiff,
      points: r.points,
      last5: r.last5 ?? null,
      group: r.group ?? null,
      season: r.season,
      seasonYear: r.seasonYear ?? null,
      league: r.league ?? null,
      seasonId: r.seasonId ?? null,
      team: r.team ?? {
        id: r.teamId,
        name: r.teamName,
        slug: r.teamSlug ?? "",
        logoUrl: r.teamLogoUrl ?? null,
      },
    }));
    return normalizeStandings(backAsStanding);
  }

  return normalizeStandings(items as BackendStanding[]);
}

// Fetch standings by explicit year and optional league, normalize if needed.
export async function getStandingsBy(params: { seasonYear: number; league?: League }): Promise<StandingRow[]> {
  const tryOnce = async (qs: string) => {
    const res = await http.get(`/standings?${qs}`);
    const items = Array.isArray(res) ? res : (res as any)?.items ?? [];
    return toStandingRows(items);
  };

  const q1 = new URLSearchParams();
  q1.set("seasonYear", String(params.seasonYear));
  if (params.league) q1.set("league", params.league);

  try {
    return await tryOnce(q1.toString());
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 0;
    // fall through on common validation errors
    if (status !== 400 && status !== 404 && status !== 422) throw err;
  }

  if (params.league) {
    const q2 = new URLSearchParams();
    q2.set("season", `${params.seasonYear} ${params.league}`);
    try {
      return await tryOnce(q2.toString());
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 0;
      if (status !== 400 && status !== 404 && status !== 422) throw err;
    }
  }

  const q3 = new URLSearchParams();
  q3.set("season", String(params.seasonYear));
  return tryOnce(q3.toString());
}


// Recompute table
export async function recomputeStandings(input: {
  seasonId?: string;
  teamIds?: string[];
}): Promise<{ ok: true }> {
  return http.post("/standings/recompute", input);
}


export type ResultSort = "date_asc" | "date_desc" | "created_asc" | "created_desc";


export type ListResultsParams = PageParams & {
  fixtureId?: string;
  season?: string;
  teamId?: string;
  from?: string | Date;
  to?: string | Date;
  sort?: ResultSort;
};


export async function listResultsPage(
  params: ListResultsParams = {}
): Promise<Paginated<Result>> {
  const qs = toQS({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    fixtureId: params.fixtureId,
    season: params.season,
    teamId: params.teamId,
    from: params.from instanceof Date ? params.from.toISOString() : params.from,
    to: params.to instanceof Date ? params.to.toISOString() : params.to,
    sort: params.sort ?? "date_desc",
  });

  const res = await http.get(`/results${qs}`);
  const any = res as any;

  const items = asArray<Result>(any);
  const page = Number(any?.page ?? 1) || 1;
  const pageSize = Number(any?.pageSize ?? items.length ?? 20) || 20;
  const total = Number(any?.total ?? items.length ?? 0) || items.length;
  const pages =
    Number(any?.pages ?? Math.max(1, Math.ceil(total / pageSize))) || 1;

  return { items, page, pageSize, total, pages };
}


export async function listResultsAll(
  params: Omit<ListResultsParams, "page" | "pageSize"> = {}
): Promise<Result[]> {
  return fetchAllPages<Result>((p) =>
    listResultsPage({ ...params, page: p, pageSize: 100 })
  );
}

export async function listResults(
  params?: Omit<ListResultsParams, "page" | "pageSize">
): Promise<Result[]> {
  const page1 = await listResultsPage({ ...(params ?? {}), page: 1, pageSize: 100 });
  return page1.items;
}

export async function getResult(id: string): Promise<Result> {
  return http.get(`/results/${encodeURIComponent(id)}`);
}

export type CreateResultInput = {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  notes?: string;
  [key: string]: unknown;
};

export type UpdateResultInput = {
  homeScore?: number;
  awayScore?: number;
  notes?: string;
  [key: string]: unknown;
};

export async function createResult(input: CreateResultInput): Promise<Result> {
  return http.post("/results", input);
}

export async function updateResult(id: string, patch: UpdateResultInput): Promise<Result> {
  return http.patch(`/results/${encodeURIComponent(id)}`, patch);
}

export type ListTeamsParams = PageParams & {
  q?: string;
  active?: boolean;
  season?: string;
  league?: League;
};



export async function listTeamsPage(
  params: ListTeamsParams = {}
): Promise<Paginated<Team>> {
  const qs = toQS({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    q: params.q,
    activeOnly: params.active,
    season: params.season,
    league: params.league,
  });

  const res = await http.get(`/teams${qs}`);
  const any = res as any;

  const items = asArray<Team>(any);
  const page = Number(any?.page ?? 1) || 1;
  const pageSize = Number(any?.pageSize ?? items.length ?? 20) || 20;
  const total = Number(any?.total ?? items.length ?? 0) || items.length;
  const pages =
    Number(any?.pages ?? Math.max(1, Math.ceil(total / pageSize))) || 1;

  return { items, page, pageSize, total, pages };
}



export async function listTeamsAll(
  params: Omit<ListTeamsParams, "page" | "pageSize"> = {}
): Promise<Team[]> {
  return fetchAllPages<Team>((p) =>
    listTeamsPage({ ...params, page: p, pageSize: 100 })
  );
}


export async function getTeam(id: string): Promise<Team> {
  return http.get(`/teams/${encodeURIComponent(id)}`);
}

export async function getTeamBySlugApi(slug: string): Promise<Team> {
  return http.get(`/teams/slug/${encodeURIComponent(slug)}`);
}

// FormData helpers
function buildTeamForm(input: {
  name?: string;
  slug?: string;
  city?: string;
  homeVenue?: string;
  homeCity?: string;
  active?: boolean;
  logoFile?: File | null;
}) {
  const fd = new FormData();
  if (input.name != null) fd.set("name", input.name);
  if (input.slug != null) fd.set("slug", input.slug);
  if (input.city) fd.set("city", input.city);
  if (input.homeVenue) fd.set("homeVenue", input.homeVenue);
  if (input.homeCity) fd.set("homeCity", input.homeCity);
  if (typeof input.active === "boolean") fd.set("active", String(input.active));
  if (input.logoFile) fd.set("logo", input.logoFile); // field name must match multer.single("logo")
  return fd;
}

// Admin
export async function createTeamApi(input: {
  name: string;
  slug: string;
  city?: string;
  homeVenue?: string;
  homeCity?: string;
  active?: boolean;
  logoFile?: File | null;
}): Promise<Team> {
  const fd = buildTeamForm(input);
  return http.post("/teams", fd);
}

export async function updateTeamApi(
  id: string,
  patch: {
    name?: string;
    city?: string;
    homeVenue?: string;
    homeCity?: string;
    active?: boolean;
    logoFile?: File | null;
  }
): Promise<Team> {
  const fd = buildTeamForm(patch);
  return http.patch(`/teams/${encodeURIComponent(id)}`, fd);
}

export async function deleteTeamApi(id: string): Promise<{ ok: true }> {
  return http.delete(`/teams/${encodeURIComponent(id)}`);
}


// --- Auth ---
export async function authRegister(input: { email: string; password: string }) {
  return http.post<{ token: string; user: unknown }>("/auth/register", input, {
    credentials: "include",
  });
}

export async function authLogin(input: { email: string; password: string }) {
  return http.post<{ token: string; user: unknown }>("/auth/login", input, {
    credentials: "include",
  });
}

export async function authLogout() {
  return http.post<{ ok: true }>("/auth/logout", undefined, {
    credentials: "include",
  });
}


// content reads
export async function getHomeContent(): Promise<HomeContent> {
  return http.get("/content/home");
}
export async function getAboutContent(): Promise<AboutContent> {
  return http.get("/content/about");
}

export async function getAnnouncementsContent(): Promise<AnnouncementsContent> {
  return http.get("/content/announcements");
}


// content writes
export async function putHomeContent(payload: HomeContent): Promise<HomeContent> {
  return http.put("/content/home", payload);
}

export async function putAboutContent(payload: AboutContent): Promise<AboutContent> {
  return http.put("/content/about", payload);
}

export async function putAnnouncementsContent(
  payload: AnnouncementsContent
): Promise<AnnouncementsContent> {
  return http.put("/content/announcements", payload);
}

export async function deleteAnnouncementsContent(): Promise<{ ok: true }> {
  return http.delete("/content/announcements");
}

// uploads
export async function uploadImage(args: {
  file: File;
  category: "home" | "about" | "teams" | "leaders" | "posts" | "announcements" | "misc";
  name?: string;
}): Promise<string> {
  const fd = new FormData();
  fd.append("image", args.file);
  fd.append("category", args.category);
  if (args.name) fd.append("name", args.name);

  const res = await http.post<{ path: string }>("/uploads/image", fd);
  const p = String(res?.path || "");
  if (!p.startsWith("/uploads/")) throw new Error("Upload succeeded but returned an invalid path");
  return p;
}