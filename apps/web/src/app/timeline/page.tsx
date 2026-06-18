"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Cloud,
  Code2,
  Database,
  FlaskConical,
  History,
  KeyRound,
  Package,
  Rocket,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import type { EngineeringTimeline, TimelineTech } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getTimeline } from "@/services/timeline";

const CAT: Record<string, { icon: typeof Code2; tint: string }> = {
  LANGUAGE: { icon: Code2, tint: "text-sky-300 bg-sky-500/10" },
  FRAMEWORK: { icon: Boxes, tint: "text-violet-300 bg-violet-500/10" },
  DATABASE: { icon: Database, tint: "text-emerald-300 bg-emerald-500/10" },
  CLOUD: { icon: Cloud, tint: "text-cyan-300 bg-cyan-500/10" },
  TESTING: { icon: FlaskConical, tint: "text-amber-300 bg-amber-500/10" },
  DEPLOYMENT: { icon: Rocket, tint: "text-orange-300 bg-orange-500/10" },
  LIBRARY: { icon: Package, tint: "text-zinc-300 bg-zinc-500/10" },
  TOOL: { icon: Wrench, tint: "text-zinc-300 bg-zinc-500/10" },
  AUTH: { icon: KeyRound, tint: "text-rose-300 bg-rose-500/10" },
};
const catOf = (c: string) => CAT[c] ?? CAT.FRAMEWORK!;

function TimelineContent() {
  const [data, setData] = useState<EngineeringTimeline | null>(null);

  useEffect(() => {
    void getTimeline().then(setData);
  }, []);

  if (!data) return <LoadingScreen label="Tracing your journey…" />;

  const startYear = data.startedAt ? new Date(data.startedAt).getUTCFullYear() : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <History className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engineering Timeline</h1>
          <p className="text-sm text-muted-foreground">Your growth journey — when you first proved each skill.</p>
        </div>
      </div>

      {!data.available ? (
        <Empty />
      ) : (
        <div className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={data.yearsActive} label={data.yearsActive === 1 ? "year building" : "years building"} />
            <Stat value={data.totalSkills} label="verified skills" />
            <Stat value={data.categoriesCovered} label="areas covered" />
            <Stat value={startYear ?? "—"} label="since" />
          </div>

          {/* Milestones */}
          {data.milestones.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">Milestones</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.milestones.map((m) => (
                  <div key={m.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-background/40 px-3 py-2">
                    <Star className="h-4 w-4 shrink-0 text-amber-300" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.technology} · {new Date(m.date).getUTCFullYear()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* The journey */}
          <div className="relative">
            <div className="absolute bottom-2 left-[18px] top-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
            {data.periods.map((p) => (
              <div key={p.year} className="relative mb-6 pl-12">
                <span className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-md shadow-primary/30">
                  &apos;{String(p.year).slice(2)}
                </span>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-semibold leading-9">{p.label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {p.cumulativeSkills} skill{p.cumulativeSkills === 1 ? "" : "s"} by now
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {p.techs.map((t) => (
                    <TechChip key={`${t.technology}-${t.firstSeenAt}`} t={t} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Built live from your verified evidence — it grows automatically as you ship more.
          </p>
        </div>
      )}
    </main>
  );
}

function TechChip({ t }: { t: TimelineTech }) {
  const cat = catOf(t.category);
  const Icon = cat.icon;
  if (t.milestone) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
        <Star className="h-3 w-3" /> {t.technology}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cat.tint}`}>
      <Icon className="h-3 w-3" /> {t.technology}
    </span>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
      <p className="text-2xl font-bold tabular-nums text-brand-gradient">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <History className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">Your timeline is waiting</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Sync your repositories and build evidence — open{" "}
        <Link href="/repositories" className="text-primary hover:underline">Repositories</Link>, then come back to see
        your growth journey unfold.
      </p>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <ProtectedRoute>
      <TimelineContent />
    </ProtectedRoute>
  );
}
