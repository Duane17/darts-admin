// src/lib/api-types.ts


/* ===========================
 * Common team and announcement
 * =========================== */

export type TeamRef = {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  city?: string | null;
  homeVenue?: string | null;
  homeCity?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Priority = "gold" | "success" | "error";

export type Announcement = {
  id: string;
  title: string;
  body?: string;
  createdAt?: string;
  priority?: Priority;
};

/* ==================================
 * Results and fixtures used by views
 * ================================== */

export type ResultRef = {
  id: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  notes: string | null;
  createdAt: string; // ISO
};

export type BackendFixtureStatus = "SCHEDULED" | "PLAYED" | "CANCELLED" | "POSTPONED";
export type UiFixtureStatus = "upcoming" | "completed";

/** Mirrors backend FixtureType enum when only string values are needed on the client */
export type BackendFixtureType =
  | "SMK_TRADING_CRDL"
  | "FRIENDLY"
  | "TOURNAMENT"
  | "TRAINING"
  | "COMMUNITY"
  | "WORKSHOP"
  | "SRDL_LEAGUE";

/** Mirrors backend League enum for client code that needs season segmentation */
export type League = "SRDL" | "CRDL";

/**
 * Canonical season key fields. The backend is migrating to these while keeping legacy `season` text.
 * A row may have all or some of these set depending on migration stage.
 */
export type SeasonKey = {
  season?: string;         // legacy like "2025 SRDL" or just "2025"
  seasonYear?: number | null;
  league?: League | null;
  seasonId?: string | null; // "YYYY:LEAGUE" for canonical joins
};

export type Fixture = SeasonKey & {
  id: string;
  week: number;
  title: string;
  date: string;                 // ISO
  endDate: string | null;
  kickoff?: string;             // optional preformatted kickoff for UI if provided
  type: BackendFixtureType | string;
  venue: string | null;
  city: string | null;
  description: string | null;
  venueTBA: boolean;
  kickoffTBA: boolean;
  status: BackendFixtureStatus;
  isBye: boolean;
  homeTeamId: string;
  awayTeamId: string | null;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  result: ResultRef | null;
  createdAt: string;
  updatedAt: string;

  // optional denormalized scores when the API chooses to expose them
  homeScore?: number | null;
  awayScore?: number | null;
};

/**
 * Convert backend status to the simplified UI status union.
 * Used anywhere the UI needs a binary state for badge logic and filtering.
 */
export function toUiFixtureStatus(f: Fixture): UiFixtureStatus {
  if (f.status === "PLAYED") return "completed";
  if (f.status === "SCHEDULED") return "upcoming";

  // Treat cancelled and postponed as upcoming in the UI to avoid counting them as completed
  if (f.status === "CANCELLED" || f.status === "POSTPONED") return "upcoming";

  // Fallback: infer by time and presence of a result or explicit scores
  const t = Date.parse(f.kickoff ?? f.date);
  const hasScores =
    !!f.result ||
    typeof f.homeScore === "number" ||
    typeof f.awayScore === "number";

  if (!Number.isNaN(t) && t < Date.now() && hasScores) {
    return "completed";
  }
  return "upcoming";
}

/* =================
 * Leaders directory
 * ================= */

export type Leader = {
  id: string;
  slug: string;
  name: string;
  title: string;
  photo?: string | null;
  tagline?: string | null;
  profile?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  responsibilities?: string[];
  achievements?: string[];
  education?: string[];
  leadershipSkills?: string[];
  professionalBackground?: string | null;
  sportingJourney?: string | null;
  term?: string | null;
  socials?: unknown;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/* =========================
 * Results with fixture join
 * ========================= */

export type Result = {
  id: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  notes: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  fixture: {
    id: string;
    season: string;
    date: string;
    week: number;
    title: string;
    homeTeam: TeamRef | null;
    awayTeam: TeamRef | null;
  };
};

export type ResultWithFixture = Result;

/* =======================
 * Standings focused types
 * ======================= */

/**
 * BackendStanding mirrors the Prisma Standing model as exposed by the API.
 * It includes both legacy season and the new season keys so the UI can
 * render badges and filters regardless of migration stage.
 */
export type BackendStanding = SeasonKey & {
  id: string;
  teamId: string;

  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;

  group?: string | null;   // "A" | "B" or null
  last5?: string | null;   // compact string "W,D,L,L,W"

  // optional relation projection the API may include
  team?: TeamRef | null;

  updatedAt?: string;      // ISO
  createdAt?: string;      // ISO
};

/**
 * UI StandingRow is the normalized row your tables use.
 * It carries calculated rank, friendly team bits, and parsed last5Array.
 */
export type StandingRow = SeasonKey & {
  rank: number;

  teamId: string;
  teamName: string;
  teamSlug: string;
  teamLogoUrl: string | null;

  season: string; // keep legacy label to avoid breaking existing callers

  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;

  group: string | null;
  last5: string | null;
  last5Array: string[];
};

/* ============================
 * Standings normalization API
 * ============================ */

/**
 * Parse last5 compact string from the backend into an array form
 * for easy rendering of result chips.
 */
export function parseLast5(last5?: string | null): string[] {
  if (!last5) return [];
  // Accept either comma separated "W,D,L" or compact "WDLWL"
  if (last5.includes(",")) {
    return last5
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);
  }
  return last5
    .trim()
    .toUpperCase()
    .split("")
    .filter(ch => ch === "W" || ch === "D" || ch === "L");
}

/**
 * Choose a display season string from new keys with a sensible fallback
 * to the legacy season label already used across the UI.
 */
export function formatSeasonLabel(s: SeasonKey & { season?: string }): string {
  if (s.season && s.season.trim().length > 0) return s.season;
  if (s.seasonYear && s.league) return `${s.seasonYear} ${s.league}`;
  if (s.seasonYear) return String(s.seasonYear);
  return "Season";
}

/**
 * Convert one BackendStanding to a StandingRow that your table expects.
 * This function hides migration details so the table always gets a stable shape.
 */
export function toStandingRow(
  s: BackendStanding,
  teamFromRelation?: TeamRef | null
): StandingRow {
  const team = teamFromRelation ?? s.team ?? null;

  // Flexible logo resolution:
  // try normalized name first, then common alternates that some APIs use.
  // Also allow top-level fallbacks if the backend denormalized a logo alongside standings.
  const teamLogoUrl =
    (team?.logoUrl && String(team.logoUrl).trim()) ||
    ((team as any)?.logo && String((team as any).logo).trim()) ||
    ((team as any)?.photo && String((team as any).photo).trim()) ||
    ((s as any)?.teamLogoUrl && String((s as any).teamLogoUrl).trim()) ||
    ((s as any)?.logoUrl && String((s as any).logoUrl).trim()) ||
    null;

  return {
    // season keys
    season: formatSeasonLabel(s),
    seasonYear: s.seasonYear ?? null,
    league: s.league ?? null,
    seasonId: s.seasonId ?? null,

    // will be set by computeRanks after sorting
    rank: 0,

    // team bits
    teamId: s.teamId,
    teamName: team?.name ?? "",
    teamSlug: team?.slug ?? "",
    teamLogoUrl,

    // stats
    played: s.played,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    goalsFor: s.goalsFor,
    goalsAgainst: s.goalsAgainst,
    goalDiff: s.goalDiff,
    points: s.points,

    // misc
    group: s.group ?? null,
    last5: s.last5 ?? null,
    last5Array: parseLast5(s.last5),
  };
}

/**
 * Stable sort for standings:
 * 1) points desc
 * 2) goalDiff desc
 * 3) goalsFor desc
 * 4) teamName asc (as a human friendly tiebreaker)
 */
export function sortStandings(a: StandingRow, b: StandingRow): number {
  if (a.points !== b.points) return b.points - a.points;
  if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
  if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
  return a.teamName.localeCompare(b.teamName, undefined, { sensitivity: "base" });
}

/**
 * Assign ranks to a sorted array. Ties share the same rank (dense ranking).
 * Example: points [30, 27, 27, 24] yields ranks [1, 2, 2, 3]
 */
export function computeRanks(sorted: StandingRow[]): StandingRow[] {
  let currentRank = 0;
  let lastKey = "";
  return sorted.map((row, idx) => {
    const key = `${row.points}|${row.goalDiff}|${row.goalsFor}`;
    if (idx === 0 || key !== lastKey) {
      currentRank = currentRank + 1;
      lastKey = key;
    }
    return { ...row, rank: currentRank };
  });
}

/**
 * Full pipeline used by the table:
 * 1) map BackendStanding[] to StandingRow[]
 * 2) sort rows by competition rules
 * 3) compute ranks with dense ranking
 */
export function normalizeStandings(
  backendRows: BackendStanding[]
): StandingRow[] {
  const rows = backendRows.map(s => toStandingRow(s));
  const sorted = rows.sort(sortStandings);
  return computeRanks(sorted);
}

/**
 * Optional helper to bucket standings by group while preserving ranking within each group.
 * Useful for two-column A and B tables.
 */
export function groupStandingsByGroup(
  rows: StandingRow[]
): Record<string, StandingRow[]> {
  const groups: Record<string, StandingRow[]> = {};
  for (const r of rows) {
    const g = r.group ?? "Ungrouped";
    if (!groups[g]) groups[g] = [];
    groups[g].push(r);
  }
  for (const g of Object.keys(groups)) {
    groups[g] = computeRanks(groups[g].sort(sortStandings));
  }
  return groups;
}


export type ProgrammeItem = {
  id: string;
  title: string;
  description: string;
  cta: string;
  bgImage: string;
};

export type HomeContent = {
  /** Multi-image hero slideshow (1–4 images). Legacy `heroBg` has been removed. */
  heroBgs: string[];
  ctaBg: string;
  programmes: ProgrammeItem[];
};

export type AboutContent = {
  heroBg: string;
  missionVision: {
    sectionBg: string;
    missionBg: string;
    visionBg: string;
    motto: string;
    mission: string;
    vision: string;
  };
  coreValues: {
    sectionBg: string;
    items: Array<{
      title: string;
      desc: string;
      bgImage: string;
    }>;
  };
};


export type AnnouncementsContent = {
  backgroundImage?: string | null;
};