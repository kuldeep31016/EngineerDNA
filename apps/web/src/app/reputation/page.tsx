"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Lightbulb, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { EngineeringReputation, ReputationFactor } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getReputation } from "@/services/reputation";

function color(v: number): string {
  if (v >= 75) return "#34D399";
  if (v >= 50) return "#FBBF24";
  return "#FB7185";
}
function textColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}

function ReputationContent() {
  const [data, setData] = useState<EngineeringReputation | null>(null);

  useEffect(() => {
    void getReputation().then(setData);
  }, []);

  if (!data) return <LoadingScreen label="Scoring your reputation…" />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Award className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reputation Score</h1>
          <p className="text-sm text-muted-foreground">Earned from verified work — never followers or likes.</p>
        </div>
      </div>

      {!data.available ? (
        <Empty />
      ) : (
        <div className="mt-6 space-y-4">
          {/* Score hero */}
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:flex-row">
            <Ring value={data.score} />
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Engineering reputation</p>
              <p className={`text-2xl font-bold ${textColor(data.score)}`}>{data.tier}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                A fair composite of your verified skills, project quality, testing, security, deployment and
                consistency. No vanity metrics.
              </p>
            </div>
          </div>

          {(data.strengths.length > 0 || data.improvements.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.strengths.length > 0 && (
                <Card icon={Sparkles} title="What lifts your score">
                  <ul className="space-y-1.5">
                    {data.strengths.map((s) => (
                      <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {data.improvements.length > 0 && (
                <Card icon={TrendingUp} title="Raise it fastest">
                  <ul className="space-y-1.5">
                    {data.improvements.map((s) => (
                      <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {/* Factor breakdown */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold">How your score is built</h3>
            <div className="space-y-4">
              {data.factors.map((f) => (
                <FactorRow key={f.key} f={f} />
              ))}
            </div>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              Score = the weighted sum of these factors. Every input is verified evidence — transparent, no black box.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function FactorRow({ f }: { f: ReputationFactor }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{f.label}</span>
        <span className="text-xs text-muted-foreground">
          <span className="tabular-nums">{f.score}</span> × {Math.round(f.weight * 100)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: color(f.score) }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{f.reasoning}</p>
      {f.score < 70 && (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-primary">
          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" /> {f.improve}
        </p>
      )}
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-muted" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color(value)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold tabular-nums ${textColor(value)}`}>{value}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Award; title: string; children: React.ReactNode }) {
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

function Empty() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Award className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">Your reputation is earned, not given</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Build evidence from your repositories first — open{" "}
        <Link href="/repositories" className="text-primary hover:underline">Repositories</Link>, then come back to see
        your score.
      </p>
    </div>
  );
}

export default function ReputationPage() {
  return (
    <ProtectedRoute>
      <ReputationContent />
    </ProtectedRoute>
  );
}
