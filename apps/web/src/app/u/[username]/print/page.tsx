"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck, Github, Globe, Loader2, MapPin, Printer, Star } from "lucide-react";
import type { PublicProfile } from "@engineerdna/shared";
import { getPublicProfile } from "@/services/public-profile";
import { QrCode } from "@/components/share/QrCode";

/**
 * A light, print-optimized one-pager of a verified profile. Built for paper /
 * "Save as PDF" — intentionally light-themed and self-contained, independent of
 * the app's dark theme. Auto-opens the print dialog once the data is ready.
 */
export default function VerifiedResumePage() {
  const params = useParams<{ username: string }>();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [missing, setMissing] = useState(false);
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/u/${params.username}` : "";

  useEffect(() => {
    getPublicProfile(params.username)
      .then(setP)
      .catch(() => setMissing(true));
  }, [params.username]);

  // Once the profile is loaded, give the QR a moment to render then open print.
  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [p]);

  if (missing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-zinc-900">
        <p className="text-sm">This profile is private or doesn&apos;t exist.</p>
      </main>
    );
  }
  if (!p) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </main>
    );
  }

  const topScores = p.scores.slice(0, 8);

  return (
    <main className="min-h-screen bg-zinc-100 py-8 text-zinc-900 print:bg-white print:py-0">
      {/* Toolbar (screen only) */}
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-6 print:hidden">
        <p className="text-sm text-zinc-500">Your verified one-pager — use “Save as PDF” in the print dialog.</p>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      {/* The sheet */}
      <div className="mx-auto max-w-3xl bg-white px-10 py-9 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
        {/* Header */}
        <header className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified Engineer
              </span>
            </div>
            {p.headline && <p className="mt-1 text-sm text-zinc-600">{p.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              {p.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {p.location}
                </span>
              )}
              {p.githubUsername && (
                <span className="flex items-center gap-1">
                  <Github className="h-3.5 w-3.5" /> github.com/{p.githubUsername}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> {profileUrl.replace(/^https?:\/\//, "")}
              </span>
            </div>
            <div className="mt-3 flex gap-5 text-sm">
              <Stat value={p.overall} label="Engineering score" />
              <Stat value={p.verifiedSkillCount} label="Verified skills" />
              <Stat value={p.publicRepoCount} label="Public repos" />
            </div>
          </div>
          <div className="shrink-0 text-center">
            <QrCode value={profileUrl} size={104} showDownload={false} />
            <p className="mt-1 text-[10px] text-zinc-400">Scan to verify</p>
          </div>
        </header>

        {/* About */}
        {p.about && (
          <Section title="About">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{p.about}</p>
          </Section>
        )}

        {/* Strengths */}
        {p.topStrengths.length > 0 && (
          <Section title="Strongest in">
            <div className="flex flex-wrap gap-1.5">
              {p.topStrengths.map((s) => (
                <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Verified skills */}
        <Section title="Verified skills">
          {p.verifiedSkills.length === 0 ? (
            <p className="text-sm text-zinc-500">No verified skills yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {p.verifiedSkills.map((s) => (
                <span key={s.technology} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <BadgeCheck className="h-3 w-3" /> {s.technology}
                  <span className="text-emerald-500">· {s.repositoryCount}</span>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* DNA + repos side by side */}
        <div className="mt-5 grid grid-cols-2 gap-8">
          <div>
            <SectionTitle>Developer DNA</SectionTitle>
            <div className="mt-2 space-y-2">
              {topScores.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700">{s.label}</span>
                    <span className="font-medium tabular-nums text-zinc-900">{s.value}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Top repositories</SectionTitle>
            <div className="mt-2 space-y-2">
              {p.topRepos.length === 0 ? (
                <p className="text-sm text-zinc-500">No public repositories.</p>
              ) : (
                p.topRepos.slice(0, 5).map((r) => (
                  <div key={r.name} className="rounded-md border border-zinc-200 px-2.5 py-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{r.name}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                        {r.language && <span>{r.language}</span>}
                        {r.stars > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3" /> {r.stars}
                          </span>
                        )}
                      </span>
                    </div>
                    {r.description && <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{r.description}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <footer className="mt-6 border-t border-zinc-200 pt-3 text-center text-[11px] text-zinc-400">
          Verified by EngineerDNA — every skill is proven by real public code. No resume claims, no black box.
        </footer>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span className="text-lg font-bold tabular-nums text-zinc-900">{value}</span>
      <span className="ml-1 text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{children}</h2>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-2">{children}</div>
    </section>
  );
}
