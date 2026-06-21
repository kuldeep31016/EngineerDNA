"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Briefcase, ExternalLink, Globe, Loader2, MapPin } from "lucide-react";
import { JOB_TYPES, JOB_WORK_MODES, type PublicCompany } from "@engineerdna/shared";
import { getPublicCompany } from "@/services/public-company";
import { Logo } from "@/components/Logo";

function typeLabel(v: string): string {
  return JOB_TYPES.find((t) => t.value === v)?.label ?? v;
}
function modeLabel(v: string): string {
  return JOB_WORK_MODES.find((t) => t.value === v)?.label ?? v;
}

export default function PublicCompanyPage() {
  const params = useParams<{ id: string }>();
  const [c, setC] = useState<PublicCompany | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getPublicCompany(params.id)
      .then(setC)
      .catch(() => setMissing(true));
  }, [params.id]);

  if (missing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <Logo href="/" />
        <p className="mt-4 text-lg font-semibold">Company not found</p>
        <p className="text-sm text-muted-foreground">This company page doesn&apos;t exist.</p>
      </main>
    );
  }
  if (!c) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo href="/" />
          <Link
            href="/jobs"
            className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Browse all jobs
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Hero */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
          <div className="flex flex-wrap items-start gap-4">
            {c.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logo} alt={c.name} className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                {c.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> {c.openRoleCount} open role{c.openRoleCount === 1 ? "" : "s"}
                </span>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Globe className="h-3.5 w-3.5" /> Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          {c.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{c.description}</p>
          )}
          {c.topSkills.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tech they hire for</p>
              <div className="flex flex-wrap gap-1.5">
                {c.topSkills.map((s) => (
                  <span key={s} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Open roles */}
        <h2 className="mb-3 mt-8 text-lg font-bold">Open roles</h2>
        {c.jobs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
            <Briefcase className="mx-auto h-7 w-7 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No open roles right now — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {c.jobs.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{j.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{typeLabel(j.type)}</span>
                      <span>· {modeLabel(j.workMode)}</span>
                      {j.location && (
                        <span className="flex items-center gap-1">
                          · <MapPin className="h-3 w-3" /> {j.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-primary">View →</span>
                </div>
                {j.skills.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {j.skills.slice(0, 8).map((s) => (
                      <span key={s} className="rounded-full bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Hiring on <Link href="/" className="text-primary hover:underline">EngineerDNA</Link> — candidates are matched by
          verified engineering evidence, not resume claims.
        </p>
      </div>
    </main>
  );
}
