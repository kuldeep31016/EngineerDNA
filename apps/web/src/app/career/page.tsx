"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Compass,
  GraduationCap,
  Hammer,
  Lightbulb,
  MessagesSquare,
  Sparkles,
  Target,
} from "lucide-react";
import type { CareerIntelligence } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getCareer } from "@/services/career";

function CareerContent() {
  const [data, setData] = useState<CareerIntelligence | null>(null);

  useEffect(() => {
    void getCareer().then(setData);
  }, []);

  if (!data) return <LoadingScreen label="Reading your DNA…" />;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Career Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Guidance from your Developer DNA — grounded in evidence, never generic.
          </p>
        </div>
      </div>

      {!data.available ? (
        <EmptyState />
      ) : (
        <div className="mt-6 space-y-4">
          {/* Archetype hero */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">You&apos;re becoming a</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-gradient">{data.archetype.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{data.archetype.reasoning}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section icon={Briefcase} title="Realistic roles today">
              <ul className="space-y-2.5">
                {data.roles.map((r) => (
                  <li key={r.title}>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.fit}</div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={Building2} title="Where you fit">
              <Chips items={data.companies} />
            </Section>
          </div>

          <Section icon={Target} title="Biggest skill gaps">
            {data.skillGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No major gaps — deepen your strongest areas.</p>
            ) : (
              <div className="space-y-3">
                {data.skillGaps.map((g) => (
                  <div key={g.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{g.label}</span>
                      <span className="font-medium tabular-nums">{g.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${g.value}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{g.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section icon={Sparkles} title="Learn next">
              {data.learnNext.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keep deepening your strongest stack.</p>
              ) : (
                <Chips items={data.learnNext} mono />
              )}
            </Section>
            <Section icon={GraduationCap} title="Certifications that help">
              <ul className="space-y-1.5">
                {data.certifications.map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section icon={Hammer} title="Build this next">
            <p className="text-sm leading-relaxed">{data.nextProject}</p>
          </Section>

          <Section icon={MessagesSquare} title="Interview topics to practice">
            <Chips items={data.interviewTopics} />
          </Section>
        </div>
      )}
    </main>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Compass; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Chips({ items, mono }: { items: string[]; mono?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <span
          key={i}
          className={`inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium ${mono ? "font-mono" : ""}`}
        >
          {i}
        </span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lightbulb className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">Your career map needs your DNA</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Build evidence from your repositories first — open a repo&apos;s{" "}
        <Link href="/repositories" className="text-primary hover:underline">Report</Link>, click{" "}
        <span className="font-medium">Build evidence</span>, then come back.
      </p>
    </div>
  );
}

export default function CareerPage() {
  return (
    <ProtectedRoute>
      <CareerContent />
    </ProtectedRoute>
  );
}
