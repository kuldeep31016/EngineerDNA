"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Briefcase, Clock, Trophy, Users } from "lucide-react";
import type { RecruiterAnalytics } from "@engineerdna/shared";
import { RecruiterGate } from "@/components/recruiter/RecruiterGate";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getRecruiterAnalytics } from "@/services/recruiter";

const FUNNEL: { key: keyof RecruiterAnalytics["stages"]; label: string; color: string }[] = [
  { key: "applied", label: "Applied", color: "#A5B4FC" },
  { key: "viewed", label: "Viewed", color: "#93C5FD" },
  { key: "screening", label: "Screening", color: "#7DD3FC" },
  { key: "shortlisted", label: "Shortlisted", color: "#C4B5FD" },
  { key: "interview", label: "Interview", color: "#67E8F9" },
  { key: "offer", label: "Offer", color: "#FCD34D" },
  { key: "hired", label: "Hired", color: "#6EE7B7" },
];

function AnalyticsContent() {
  const [a, setA] = useState<RecruiterAnalytics | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getRecruiterAnalytics()
      .then(setA)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <LoadingScreen label="Crunching your hiring numbers…" />;
  if (!a) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load analytics. Please try again.</p>
      </main>
    );
  }

  const maxStage = Math.max(...FUNNEL.map((f) => a.stages[f.key]), 1);
  const noData = a.totals.applicants === 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hiring Analytics</h1>
          <p className="text-sm text-muted-foreground">Your funnel and conversion across every role — from verified evidence.</p>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={Briefcase} label="Open roles" value={`${a.totals.openJobs}`} sub={`${a.totals.jobs} total`} />
        <Kpi icon={Users} label="Applicants" value={`${a.totals.applicants}`} sub="across all jobs" />
        <Kpi icon={Trophy} label="Hires" value={`${a.totals.hires}`} sub={`${a.conversion.hireRate}% of applicants`} />
        <Kpi icon={Clock} label="Avg. days to hire" value={a.avgDaysToHire == null ? "—" : `${a.avgDaysToHire}`} sub="applied → hired" />
      </div>

      {noData ? (
        <div className="mt-6 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-semibold">No applicants yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once candidates apply to your roles, your funnel and conversion rates appear here.
          </p>
          <Link href="/recruiter/jobs" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Manage your job posts →
          </Link>
        </div>
      ) : (
        <>
          {/* Funnel + conversion */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Pipeline distribution</h2>
              <div className="space-y-2.5">
                {FUNNEL.map((f) => {
                  const v = a.stages[f.key];
                  return (
                    <div key={f.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-medium tabular-nums">{v}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(v > 0 ? 4 : 0, (v / maxStage) * 100)}%`, background: f.color }} />
                      </div>
                    </div>
                  );
                })}
                {a.stages.rejected > 0 && (
                  <p className="pt-1 text-[11px] text-muted-foreground">{a.stages.rejected} not selected / closed</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Conversion</h2>
              <div className="space-y-4">
                <Conversion label="Reached shortlist" pct={a.conversion.shortlistRate} />
                <Conversion label="Reached interview" pct={a.conversion.interviewRate} />
                <Conversion label="Received an offer" pct={a.conversion.offerRate} />
                <Conversion label="Hired" pct={a.conversion.hireRate} accent />
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Share of all applicants that reached at least each stage.
              </p>
            </div>
          </div>

          {/* Per-job breakdown */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">By job</h2>
            {a.perJob.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Role</th>
                      <th className="pb-2 px-2 text-right font-medium">Applicants</th>
                      <th className="pb-2 px-2 text-right font-medium">Shortlist</th>
                      <th className="pb-2 px-2 text-right font-medium">Interview</th>
                      <th className="pb-2 px-2 text-right font-medium">Offers</th>
                      <th className="pb-2 pl-2 text-right font-medium">Hired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.perJob.map((j) => (
                      <tr key={j.id} className="border-t border-border">
                        <td className="py-2.5 pr-3">
                          <Link href={`/recruiter/jobs/${j.id}`} className="font-medium transition-colors hover:text-primary">
                            {j.title}
                          </Link>
                          {j.status === "CLOSED" && <span className="ml-2 text-[10px] uppercase text-muted-foreground">Closed</span>}
                        </td>
                        <td className="px-2 text-right tabular-nums">{j.applicants}</td>
                        <td className="px-2 text-right tabular-nums text-violet-300">{j.shortlisted}</td>
                        <td className="px-2 text-right tabular-nums text-cyan-300">{j.interviewing}</td>
                        <td className="px-2 text-right tabular-nums text-amber-300">{j.offers}</td>
                        <td className="pl-2 text-right font-semibold tabular-nums text-emerald-300">{j.hired}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Conversion({ label, pct, accent }: { label: string; pct: number; accent?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold tabular-nums ${accent ? "text-emerald-400" : ""}`}>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${accent ? "bg-emerald-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function RecruiterAnalyticsPage() {
  return (
    <RecruiterGate>
      <AnalyticsContent />
    </RecruiterGate>
  );
}
