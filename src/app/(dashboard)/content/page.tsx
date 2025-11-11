// src/app/(dashboard)/content/page.tsx
import Link from "next/link";
import {
  IconHome,
  IconInfoCircle,
  IconFileAnalytics,
  IconArrowRight,
} from "@tabler/icons-react";

type ContentCardProps = {
  href: string;
  title: string;
  blurb: string;
  points: string[];
  Icon: typeof IconHome;
};

function ContentCard({ href, title, blurb, points, Icon }: ContentCardProps) {
  return (
    <div className="group glass-panel rounded-[var(--radius-card)] p-5 transition hover:shadow-lg">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--color-green)_15%,white)]">
          <Icon className="h-5 w-5 text-[var(--color-green)]" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[var(--text-section)] font-semibold leading-tight">
            {title}
          </h3>
          <p className="mt-1 text-[color-mix(in_oklab,var(--color-ink-muted),black_0%)]">
            {blurb}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid list-disc gap-1 pl-5 text-[var(--text-body)] marker:text-[var(--color-gold)]">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>

      <div className="mt-5">
        <Link
          href={href}
          className="btn btn-outline-gold focus-gold inline-flex items-center gap-2"
          aria-label={`Open editor for ${title}`}
        >
          Open editor
          <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

export default function ContentIndexPage() {
  return (
    <section className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="section-title text-[var(--text-page)] font-semibold">
          Website Content
        </h1>
      </div>

      {/* Gentle helper banner */}
      <div className="glass-panel rounded-[var(--radius-panel)] border border-[var(--color-border)] p-4">
        <div className="flex items-start gap-3">
          <IconInfoCircle className="mt-0.5 h-5 w-5 text-[var(--color-green)]" />
          <p className="text-[var(--text-body)]">
            Manage background images used on public pages.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ContentCard
          href="/content/home"
          title="Home"
          blurb="Hero, CTA band, and Programmes."
          points={[
            "Hero background image",
            "CTA band background image",
            "Programmes list with title and copy",
          ]}
          Icon={IconHome}
        />

        <ContentCard
          href="/content/about"
          title="About"
          blurb="Hero plus mission, vision, and core values."
          points={[
            "Hero background image",
            "Mission and Vision text with section art",
            "Core values grid with images",
          ]}
          Icon={IconFileAnalytics}
        />
      </div>
    </section>
  );
}
