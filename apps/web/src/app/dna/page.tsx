"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dna } from "lucide-react";
import type { DeveloperDna, Score } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getDna } from "@/services/dna";

const LEVEL_STYLES: Record<string, { text: string; bar: string; ring: string }> = {
  "No evidence": { text: "text-muted-foreground", bar: "bg-muted-foreground/40", ring: "ring-border" },
  Emerging: { text: "text-amber-400", bar: "bg-amber-500", ring: "ring-amber-500/20" },
  Proficient: { text: "text-sky-400", bar: "bg-sky-500", ring: "ring-sky-500/20" },
  Strong: { text: "text-emerald-400", bar: "bg-emerald-500", ring: "ring-emerald-500/20" },
  Expert: { text: "text-violet-400", bar: "bg-violet-500", ring: "ring-violet-500/20" },
};

const styleFor = (level: string) => LEVEL_STYLES[level] ?? LEVEL_STYLES["No evidence"]!;

function DnaContent() {
  const [dna, setDna] = useState<DeveloperDna | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getDna().then((d) => {
      setDna(d);
      setLoading(false);
    });
  }, []);

  if (loading || !dna) return <LoadingScreen label="Computing your DNA…" />;

  const hasAny = dna.overall > 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Dna className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer DNA</h1>
          <p className="text-sm text-muted-foreground">
            Your engineering identity, scored from evidence — every score explained.
          </p>
        </div>
      </div>

      {!hasAny ? (
        <EmptyState />
      ) : (
        <>
          {/* Overall + strengths */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-5xl font-bold">{dna.overall}</div>
              <div className="mt-1 text-xs text-muted-foreground">Overall DNA score / 100</div>
            </div>
            {dna.topStrengths.length > 0 && (
              <div className="text-right">
                <div className="mb-1.5 text-xs text-muted-foreground">Top strengths</div>
                <div className="flex flex-wrap justify-end gap-2">
                  {dna.topStrengths.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {dna.scores.map((score) => (
              <ScoreCard key={score.key} score={score} />
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Computed {new Date(dna.generatedAt).toLocaleString()} from your repository evidence.
          </p>
        </>
      )}
    </main>
  );
}

function ScoreCard({ score }: { score: Score }) {
  const s = styleFor(score.level);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{score.label}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${s.text} ${s.ring}`}>
          {score.level}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${score.value}%` }} />
        </div>
        <span className="w-9 text-right text-sm font-semibold tabular-nums">{score.value}</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{score.reasoning}</p>

      {score.evidenceRefs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {score.evidenceRefs.slice(0, 8).map((ref) => (
            <span
              key={ref}
              className="rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {ref}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Dna className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">Your DNA needs evidence</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Build evidence from your repositories first — open a repo’s{" "}
        <Link href="/repositories" className="text-primary hover:underline">
          Report
        </Link>{" "}
        and click <span className="font-medium">Build evidence</span>, then come back here.
      </p>
    </div>
  );
}

export default function DnaPage() {
  return (
    <ProtectedRoute>
      <DnaContent />
    </ProtectedRoute>
  );
}
