"use client";

import { GitCompare, ShieldCheck, X } from "lucide-react";
import type { RankedCandidate } from "@engineerdna/shared";

function color(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}

/** Index of the candidate with the highest value for a metric (for highlighting
 *  the leader). Returns -1 when there's a tie or no data, so nothing is flagged. */
function leaderIndex(values: (number | null)[]): number {
  let best = -1;
  let bestVal = -Infinity;
  let tie = false;
  values.forEach((v, i) => {
    if (v === null) return;
    if (v > bestVal) {
      bestVal = v;
      best = i;
      tie = false;
    } else if (v === bestVal) {
      tie = true;
    }
  });
  return tie || bestVal === -Infinity ? -1 : best;
}

/** Side-by-side comparison of 2–4 ranked candidates. Pure client-side — every
 *  number comes from the existing ranking data, no extra calls, no LLM. */
export function CandidateCompare({
  candidates,
  onClose,
  onMessage,
}: {
  candidates: RankedCandidate[];
  onClose: () => void;
  onMessage?: (c: RankedCandidate) => void;
}) {
  // Union of ranking-factor keys across the selected candidates, in first-seen order.
  const factorKeys: { key: string; label: string }[] = [];
  for (const c of candidates) {
    for (const f of c.factors) {
      if (!factorKeys.some((k) => k.key === f.key)) factorKeys.push({ key: f.key, label: f.label });
    }
  }

  const numericRows: { label: string; values: (number | null)[]; render: (v: number | null) => React.ReactNode }[] = [
    {
      label: "Rank score",
      values: candidates.map((c) => c.rankScore),
      render: (v) => (v === null ? "—" : <span className={`font-bold ${color(v)}`}>{v}</span>),
    },
    {
      label: "Job match",
      values: candidates.map((c) => c.matchScore),
      render: (v) => (v === null ? "—" : <span className={`font-semibold ${color(v)}`}>{v}%</span>),
    },
    {
      label: "DNA overall",
      values: candidates.map((c) => c.overall),
      render: (v) => (v === null ? "—" : <span className={color(v)}>{v}</span>),
    },
    {
      label: "Verified skills",
      values: candidates.map((c) => c.verifiedSkillCount),
      render: (v) => (v === null ? "—" : <span>{v}</span>),
    },
    {
      label: "Public repos",
      values: candidates.map((c) => c.publicRepoCount),
      render: (v) => (v === null ? "—" : <span>{v}</span>),
    },
    {
      label: "Interview score",
      values: candidates.map((c) => c.interviewScore),
      render: (v) => (v === null ? <span className="text-muted-foreground">Not taken</span> : <span className={color(v)}>{v}/100</span>),
    },
    {
      label: "Experience (yrs)",
      values: candidates.map((c) => c.experienceYears),
      render: (v) => (v === null ? <span className="text-muted-foreground">—</span> : <span>{v}</span>),
    },
  ];

  const textRows: { label: string; render: (c: RankedCandidate) => React.ReactNode }[] = [
    { label: "Availability", render: (c) => c.availability ?? <span className="text-muted-foreground">—</span> },
    { label: "Expected salary", render: (c) => c.expectedSalary ?? <span className="text-muted-foreground">—</span> },
    { label: "College", render: (c) => c.college ?? <span className="text-muted-foreground">—</span> },
    { label: "Location", render: (c) => c.location ?? <span className="text-muted-foreground">—</span> },
  ];

  const colW = "min-w-[180px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <GitCompare className="h-5 w-5 text-primary" /> Compare candidates
            <span className="text-sm font-normal text-muted-foreground">({candidates.length})</span>
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr>
                <th className="sticky left-0 z-10 w-40 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Candidate
                </th>
                {candidates.map((c) => (
                  <th key={c.id} className={`${colW} border-l border-border px-4 py-3 text-left align-top`}>
                    <div className="flex items-center gap-2">
                      {c.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.profileImage} alt={c.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.name}</p>
                        {c.headline && <p className="truncate text-[11px] font-normal text-muted-foreground">{c.headline}</p>}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {numericRows.map((row) => {
                const lead = leaderIndex(row.values);
                return (
                  <tr key={row.label} className="border-t border-border">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className={`${colW} border-l border-border px-4 py-2.5 ${
                          lead === i ? "bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/20" : ""
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {row.render(v)}
                          {lead === i && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">Best</span>}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}

              {textRows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground">{row.label}</td>
                  {candidates.map((c) => (
                    <td key={c.id} className={`${colW} border-l border-border px-4 py-2.5`}>
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Top strengths */}
              <tr className="border-t border-border">
                <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground">Top strengths</td>
                {candidates.map((c) => (
                  <td key={c.id} className={`${colW} border-l border-border px-4 py-2.5`}>
                    <div className="flex flex-wrap gap-1">
                      {c.topStrengths.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        c.topStrengths.map((s) => (
                          <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Matched required skills */}
              <tr className="border-t border-border">
                <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground">Matched skills</td>
                {candidates.map((c) => (
                  <td key={c.id} className={`${colW} border-l border-border px-4 py-2.5`}>
                    <div className="flex flex-wrap gap-1">
                      {c.matchedSkills.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        c.matchedSkills.map((s) => (
                          <span key={s} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                            {s} ✓
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Per-factor breakdown */}
              {factorKeys.map(({ key, label }) => {
                const values = candidates.map((c) => c.factors.find((f) => f.key === key)?.score ?? null);
                const lead = leaderIndex(values);
                return (
                  <tr key={key} className="border-t border-border">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground">{label}</td>
                    {values.map((v, i) => (
                      <td
                        key={i}
                        className={`${colW} border-l border-border px-4 py-2.5 ${
                          lead === i ? "bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/20" : ""
                        }`}
                      >
                        {v === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`w-8 tabular-nums ${color(v)}`}>{v}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className={`h-full rounded-full ${v >= 75 ? "bg-emerald-500" : v >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${v}%` }} />
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Actions */}
              {onMessage && (
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3" />
                  {candidates.map((c) => (
                    <td key={c.id} className={`${colW} border-l border-border px-4 py-3`}>
                      <button
                        onClick={() => onMessage(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Message
                      </button>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Every metric is computed from verified public-code evidence — no resumes, no black box.
        </div>
      </div>
    </div>
  );
}
