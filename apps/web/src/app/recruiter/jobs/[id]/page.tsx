"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { JobPost, RankedCandidate } from "@engineerdna/shared";
import { RecruiterGate } from "@/components/recruiter/RecruiterGate";
import { LoadingScreen } from "@/components/LoadingScreen";
import { addShortlist, removeShortlist } from "@/services/recruiter";
import { getJob, getJobRanking } from "@/services/jobs";

function scoreColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}
function barColor(v: number): string {
  if (v >= 75) return "bg-emerald-500";
  if (v >= 50) return "bg-amber-500";
  return "bg-rose-500";
}
function rankMedal(i: number): string {
  return ["text-amber-300", "text-zinc-300", "text-orange-300"][i] ?? "text-muted-foreground";
}

function RankingContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [job, setJob] = useState<JobPost | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[] | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    void getJob(id).then(setJob).catch(() => {});
    void getJobRanking(id)
      .then((r) => {
        setCandidates(r.candidates);
        setSaved(new Set(r.candidates.filter((c) => c.shortlisted).map((c) => c.id)));
      })
      .catch(() => setCandidates([]));
  }, [id]);

  function toggleOpen(cid: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  }

  async function toggleSave(cid: string) {
    const on = saved.has(cid);
    setSaved((prev) => {
      const next = new Set(prev);
      if (on) next.delete(cid);
      else next.add(cid);
      return next;
    });
    try {
      if (on) await removeShortlist(cid);
      else await addShortlist(cid);
    } catch {
      setSaved((prev) => {
        const next = new Set(prev);
        if (on) next.add(cid);
        else next.delete(cid);
        return next;
      });
    }
  }

  if (!candidates) return <LoadingScreen label="Ranking candidates…" />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => router.push("/recruiter/jobs")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to jobs"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Trophy className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{job?.title ?? "Ranked candidates"}</h1>
          <p className="text-sm text-muted-foreground">
            Ranked on verified evidence — every score explains why.
          </p>
        </div>
      </div>

      {job && job.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.map((s) => (
            <span key={s} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card px-6 py-14 text-center">
          <ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No verified engineers match these skills yet. Add candidates by making passports public with evidence.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {candidates.map((c, i) => (
            <RankedCard
              key={c.id}
              c={c}
              rank={i + 1}
              saved={saved.has(c.id)}
              open={open.has(c.id)}
              onToggleSave={() => toggleSave(c.id)}
              onToggleOpen={() => toggleOpen(c.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function RankedCard({
  c,
  rank,
  saved,
  open,
  onToggleSave,
  onToggleOpen,
}: {
  c: RankedCandidate;
  rank: number;
  saved: boolean;
  open: boolean;
  onToggleSave: () => void;
  onToggleOpen: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex w-8 shrink-0 flex-col items-center">
          <span className={`text-lg font-bold tabular-nums ${rankMedal(rank - 1)}`}>#{rank}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{c.name}</p>
          </div>
          {c.headline && <p className="truncate text-sm text-muted-foreground">{c.headline}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {c.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {c.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {c.verifiedSkillCount} verified
            </span>
            {c.interviewScore != null && (
              <span className="flex items-center gap-1">
                <MessagesSquare className="h-3 w-3" /> Interview {c.interviewScore}/100
              </span>
            )}
          </div>
          {c.matchedSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.matchedSkills.map((s) => (
                <span key={s} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {s} ✓
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold tabular-nums ${scoreColor(c.rankScore)}`}>{c.rankScore}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">rank score</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onToggleOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Why this rank
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={onToggleSave}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            saved ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {saved ? "Shortlisted" : "Shortlist"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {c.factors.map((f) => (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="text-xs text-muted-foreground">
                  <span className="tabular-nums">{f.score}</span> × {Math.round(f.weight * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${barColor(f.score)}`} style={{ width: `${f.score}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Rank score is the weighted sum of these factors — all from verified evidence, no black box.
          </p>
        </div>
      )}
    </div>
  );
}

export default function JobRankingPage() {
  return (
    <RecruiterGate>
      <RankingContent />
    </RecruiterGate>
  );
}
