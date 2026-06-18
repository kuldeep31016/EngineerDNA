"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Lightbulb,
  Loader2,
  MessagesSquare,
  Play,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Interview, InterviewListItem } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  getInterview,
  listInterviews,
  startInterview,
  submitAnswers,
} from "@/services/interview";

type Phase = "menu" | "answering" | "report";

function scoreColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}
function scoreBar(v: number): string {
  if (v >= 75) return "bg-emerald-500";
  if (v >= 50) return "bg-amber-500";
  return "bg-rose-500";
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function InterviewContent() {
  const [history, setHistory] = useState<InterviewListItem[]>([]);
  const [current, setCurrent] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("menu");
  const [busy, setBusy] = useState<null | "start" | "submit">(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = () => listInterviews().then(setHistory).catch(() => {});
  useEffect(() => {
    void refreshHistory();
  }, []);

  async function handleStart() {
    setBusy("start");
    setUnavailable(null);
    setError(null);
    try {
      const res = await startInterview();
      if (!res.available || !res.interview) {
        setUnavailable(res.reason ?? "Interview is not available yet.");
        return;
      }
      setCurrent(res.interview);
      setAnswers({});
      setPhase("answering");
    } catch {
      setError("Couldn't generate the interview. Make sure the analysis model is configured, then try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit() {
    if (!current) return;
    setBusy("submit");
    setError(null);
    try {
      const payload = current.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" }));
      const graded = await submitAnswers(current.id, payload);
      setCurrent(graded);
      setPhase("report");
      void refreshHistory();
    } catch {
      setError("Couldn't grade your answers. Please try submitting again.");
    } finally {
      setBusy(null);
    }
  }

  async function openPast(id: string) {
    setError(null);
    const iv = await getInterview(id);
    setCurrent(iv);
    if (iv.status === "EVALUATED") {
      setPhase("report");
    } else {
      const a: Record<string, string> = {};
      iv.answers.forEach((x) => (a[x.questionId] = x.answer));
      setAnswers(a);
      setPhase("answering");
    }
  }

  function reset() {
    setCurrent(null);
    setPhase("menu");
    setAnswers({});
    setUnavailable(null);
    setError(null);
    void refreshHistory();
  }

  const answeredCount = current ? current.questions.filter((q) => (answers[q.id] ?? "").trim()).length : 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {phase !== "menu" && (
          <button
            onClick={reset}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessagesSquare className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Prep</h1>
          <p className="text-sm text-muted-foreground">
            A technical interview generated from what you&apos;ve actually built.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {phase === "menu" && (
        <Menu
          history={history}
          busy={busy === "start"}
          unavailable={unavailable}
          onStart={handleStart}
          onOpen={openPast}
        />
      )}

      {phase === "answering" && current && (
        <Answering
          interview={current}
          answers={answers}
          answeredCount={answeredCount}
          submitting={busy === "submit"}
          readOnly={current.status === "EVALUATED"}
          onChange={(qid, val) => setAnswers((prev) => ({ ...prev, [qid]: val }))}
          onSubmit={handleSubmit}
        />
      )}

      {phase === "report" && current && current.report && (
        <Report interview={current} onRetake={handleStart} retaking={busy === "start"} />
      )}
    </main>
  );
}

/* ---------- Menu ---------- */

function Menu({
  history,
  busy,
  unavailable,
  onStart,
  onOpen,
}: {
  history: InterviewListItem[];
  busy: boolean;
  unavailable: string | null;
  onStart: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <h2 className="text-lg font-semibold">Start a mock interview</h2>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          Five questions, grounded in your verified evidence — auth, caching, deployment, data modeling and
          more — graded with per-answer feedback and a readiness score.
        </p>
        {unavailable && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {unavailable}
          </p>
        )}
        <button
          onClick={onStart}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating your interview…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Start interview
            </>
          )}
        </button>
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Past interviews</h3>
          </div>
          <ul className="divide-y divide-border">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => onOpen(h.id)}
                  className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:opacity-80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {h.topics.slice(0, 3).join(" · ") || "Technical interview"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(h.createdAt)} · {h.questionCount} questions
                    </p>
                  </div>
                  {h.overallScore !== null ? (
                    <span className={`text-sm font-semibold tabular-nums ${scoreColor(h.overallScore)}`}>
                      {h.overallScore}
                      <span className="text-xs text-muted-foreground">/100</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      unfinished
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Answering ---------- */

const DIFF_BADGE: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  hard: "bg-rose-500/15 text-rose-300",
};

function Answering({
  interview,
  answers,
  answeredCount,
  submitting,
  readOnly,
  onChange,
  onSubmit,
}: {
  interview: Interview;
  answers: Record<string, string>;
  answeredCount: number;
  submitting: boolean;
  readOnly: boolean;
  onChange: (qid: string, val: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        {answeredCount} of {interview.questions.length} answered
      </p>

      {interview.questions.map((q, i) => (
        <div key={q.id} className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${DIFF_BADGE[q.difficulty]}`}>
              {q.difficulty}
            </span>
            <span className="truncate text-xs text-muted-foreground">{q.topic}</span>
          </div>
          <p className="text-sm leading-relaxed">{q.prompt}</p>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
            {q.rationale}
          </p>
          <textarea
            value={answers[q.id] ?? ""}
            onChange={(e) => onChange(q.id, e.target.value)}
            readOnly={readOnly}
            rows={4}
            placeholder="Type your answer…"
            className="mt-3 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60 read-only:opacity-70"
          />
        </div>
      ))}

      {!readOnly && (
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Grading your answers…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Submit for grading
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ---------- Report ---------- */

function Report({
  interview,
  onRetake,
  retaking,
}: {
  interview: Interview;
  onRetake: () => void;
  retaking: boolean;
}) {
  const report = interview.report!;
  const answerById = new Map(interview.answers.map((a) => [a.questionId, a.answer]));

  return (
    <div className="mt-6 space-y-4">
      {/* Score hero */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Overall score</p>
            <p className={`text-5xl font-bold tabular-nums ${scoreColor(report.overallScore)}`}>
              {report.overallScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-4 py-3">
            <Gauge className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Interview readiness</p>
              <p className="text-lg font-semibold tabular-nums">{report.confidence}%</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ListCard icon={TrendingUp} title="Strengths" items={report.strengths} tone="emerald" />
        <ListCard icon={TrendingDown} title="Weaknesses" items={report.weaknesses} tone="rose" />
      </div>

      {report.prepTopics.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Study these next</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.prepTopics.map((t) => (
              <span key={t} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-question feedback */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4 text-primary" /> Per-question feedback
        </h3>
        {interview.questions.map((q, i) => {
          const fb = report.perAnswer.find((f) => f.questionId === q.id);
          return (
            <div key={q.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Q{i + 1} · {q.topic}
                </span>
                {fb && (
                  <span className={`text-sm font-semibold tabular-nums ${scoreColor(fb.score)}`}>
                    {fb.verdict} · {fb.score}/100
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{q.prompt}</p>

              <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Your answer</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-background/50 px-3 py-2 text-sm text-muted-foreground">
                {answerById.get(q.id)?.trim() || "(no answer)"}
              </p>

              {fb && (
                <>
                  {fb.score < 100 && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${scoreBar(fb.score)}`} style={{ width: `${fb.score}%` }} />
                    </div>
                  )}
                  <p className="mt-3 text-sm leading-relaxed">{fb.feedback}</p>
                  {fb.idealPoints.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {fb.idealPoints.map((p) => (
                        <li key={p} className="flex gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                          <span className="leading-relaxed">{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onRetake}
        disabled={retaking}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
      >
        {retaking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Take another interview
      </button>
    </div>
  );
}

function ListCard({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof TrendingUp;
  title: string;
  items: string[];
  tone: "emerald" | "rose";
}) {
  const dot = tone === "emerald" ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it} className="flex gap-2 text-sm text-muted-foreground">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot} bg-current`} />
              <span className="leading-relaxed">{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InterviewPage() {
  return (
    <ProtectedRoute>
      <InterviewContent />
    </ProtectedRoute>
  );
}
