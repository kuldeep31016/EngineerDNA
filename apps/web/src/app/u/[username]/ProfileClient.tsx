"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  ExternalLink,
  FileDown,
  Github,
  Globe,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import type { PublicProfile } from "@engineerdna/shared";
import { getPublicProfile } from "@/services/public-profile";
import { Logo } from "@/components/Logo";

function scoreColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}

export default function ProfileClient() {
  const params = useParams<{ username: string }>();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getPublicProfile(params.username)
      .then(setP)
      .catch(() => setMissing(true));
  }, [params.username]);

  if (missing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <Logo href="/" />
        <p className="mt-4 text-lg font-semibold">Profile not found</p>
        <p className="text-sm text-muted-foreground">
          This profile is private or doesn&apos;t exist.
        </p>
      </main>
    );
  }
  if (!p) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo href="/" />
          <div className="flex items-center gap-2">
            <Link
              href={`/u/${p.username}/print`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get your verified profile
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Hero */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
          <div className="flex flex-wrap items-start gap-4">
            {p.profileImage ? (
              <img src={p.profileImage} alt={p.name} className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary">
                {p.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified Engineer
                </span>
              </div>
              {p.headline && <p className="mt-0.5 text-sm text-muted-foreground">{p.headline}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {p.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {p.location}
                  </span>
                )}
                <span>{p.verifiedSkillCount} verified skills</span>
                <span>{p.publicRepoCount} public repos</span>
                {p.githubUsername && (
                  <a href={`https://github.com/${p.githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Github className="h-3.5 w-3.5" /> @{p.githubUsername}
                  </a>
                )}
                {p.portfolioSlug && (
                  <a href={`/p/${p.portfolioSlug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </a>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold tabular-nums ${scoreColor(p.overall)}`}>{p.overall}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Engineering score</p>
            </div>
          </div>
          {p.topStrengths.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Strongest in <span className="font-medium text-foreground">{p.topStrengths.join(" · ")}</span>
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {p.about && (
            <Section title="About" className="md:col-span-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{p.about}</p>
            </Section>
          )}

          <Section title="Verified skills" className="md:col-span-2">
            {p.verifiedSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No verified skills yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {p.verifiedSkills.map((s) => (
                  <span key={s.technology} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                    <BadgeCheck className="h-3 w-3" /> {s.technology}
                    <span className="text-emerald-300/60">· {s.repositoryCount}</span>
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section title="Developer DNA">
            <div className="space-y-2.5">
              {p.scores.slice(0, 8).map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{s.label}</span>
                    <span className={`font-medium tabular-nums ${scoreColor(s.value)}`}>{s.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Top repositories">
            {p.topRepos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public repositories.</p>
            ) : (
              <div className="space-y-2">
                {p.topRepos.map((r) => (
                  <a key={r.name} href={r.htmlUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Github className="h-3.5 w-3.5 text-muted-foreground" /> {r.name}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {r.language && <span>{r.language}</span>}
                        {r.stars > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {r.stars}</span>}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                    {r.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</p>}
                  </a>
                ))}
              </div>
            )}
          </Section>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Every skill here is proven by real public code — no resume, no unverified claims. Verified by{" "}
          <Link href="/" className="text-primary hover:underline">EngineerDNA</Link>.
        </p>
      </div>
    </main>
  );
}

function Section({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
