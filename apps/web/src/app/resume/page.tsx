"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  KeyRound,
  ListChecks,
  Loader2,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import type { ResumeReview } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { extractPdfText } from "@/lib/resume";
import { getResumeReview, reviewResume } from "@/services/resume";

function fmtDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
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

function ResumeContent() {
  const [loaded, setLoaded] = useState(false);
  const [review, setReview] = useState<ResumeReview | null>(null);

  useEffect(() => {
    getResumeReview()
      .then((r) => setReview(r.available ? r : null))
      .catch(() => setReview(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <LoadingScreen label="Loading your review…" />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        {review && (
          <button
            onClick={() => setReview(null)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Review another resume"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ScanLine className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume Review</h1>
          <p className="text-sm text-muted-foreground">
            Checked against your verified evidence — honest, never generic.
          </p>
        </div>
      </div>

      {review ? <Result review={review} onAgain={() => setReview(null)} /> : <Uploader onDone={setReview} />}
    </main>
  );
}

/* ---------------- Uploader ---------------- */

function Uploader({ onDone }: { onDone: (r: ResumeReview) => void }) {
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setShowManual(false);
    setResumeName(file.name);
    setParsing(true);
    try {
      setResumeText(await extractPdfText(file));
    } catch {
      setError("Couldn't read that PDF — paste your resume text instead.");
      setResumeName(null);
      setShowManual(true);
    } finally {
      setParsing(false);
    }
    e.target.value = "";
  }

  function clear() {
    setResumeText("");
    setResumeName(null);
    setShowManual(false);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      onDone(await reviewResume({ resumeText: resumeText.trim() }));
    } catch {
      setError("Couldn't review the resume. Make sure the analysis model is configured, then try again.");
    } finally {
      setBusy(false);
    }
  }

  const ready = resumeText.trim().length >= 30;

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <h2 className="text-lg font-semibold">Review your resume</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your resume — we&apos;ll score it and compare every claim against what you&apos;ve actually built.
        </p>

        <div className="mt-5">
          {parsing ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Reading your resume…
            </div>
          ) : resumeName ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="min-w-0 flex-1 truncate">{resumeName}</span>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <button onClick={clear} aria-label="Remove resume" className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              <Upload className="h-4 w-4" /> Upload PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={onFile} />
            </label>
          )}

          <button
            onClick={() => setShowManual((v) => !v)}
            className="mt-2 text-xs font-medium text-primary transition-opacity hover:opacity-80"
          >
            {showManual ? "Hide text" : resumeName ? "Edit text" : "Or paste text instead"}
          </button>

          {showManual && (
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder="Paste your full resume text here."
              className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
            />
          )}
        </div>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button
          onClick={submit}
          disabled={!ready || busy}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Reviewing your resume…
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4" /> Review my resume
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Result ---------------- */

function Result({ review, onAgain }: { review: ResumeReview; onAgain: () => void }) {
  return (
    <div className="mt-6 space-y-4">
      {review.generatedAt && (
        <p className="text-xs text-muted-foreground">Reviewed {fmtDate(review.generatedAt)} · saved automatically</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreCard label="ATS score" value={review.atsScore} hint="Applicant tracking readiness" />
        <ScoreCard label="Engineering score" value={review.engineeringScore} hint="Overall resume strength" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{review.summary}</p>
      </div>

      <Section icon={TrendingUp} title="What works" items={review.strengths} tone="emerald" />
      <Section icon={ShieldAlert} title="Claimed but not verified" items={review.claimedNotVerified} tone="rose" />
      <Section icon={Sparkles} title="Proven, but under-sold" items={review.verifiedNotHighlighted} tone="indigo" />
      <Section icon={AlertTriangle} title="Inconsistencies" items={review.inconsistencies} tone="amber" />
      <Section icon={ListChecks} title="ATS issues" items={review.atsIssues} tone="amber" />

      {review.missingKeywords.length > 0 && (
        <Card icon={KeyRound} title="Missing keywords">
          <div className="flex flex-wrap gap-2">
            {review.missingKeywords.map((k) => (
              <span key={k} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium">
                {k}
              </span>
            ))}
          </div>
        </Card>
      )}

      {review.rewrites.length > 0 && (
        <Card icon={Wand2} title="Suggested rewrites">
          <div className="space-y-4">
            {review.rewrites.map((rw, i) => (
              <div key={i}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{rw.section}</p>
                <p className="mt-1 rounded-lg bg-background/50 px-3 py-2 text-sm text-muted-foreground line-through decoration-rose-400/40">
                  {rw.original}
                </p>
                <p className="mt-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm">
                  {rw.improved}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Section icon={Target} title="Structure & ordering" items={review.structure} tone="indigo" />

      <button
        onClick={onAgain}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
      >
        <Upload className="h-4 w-4" /> Review another resume
      </button>
    </div>
  );
}

function ScoreCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-4xl font-bold tabular-nums ${scoreColor(value)}`}>
        {value}
        <span className="text-base text-muted-foreground">/100</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${scoreBar(value)}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

const TONE_DOT: Record<string, string> = {
  emerald: "text-emerald-400",
  rose: "text-rose-400",
  amber: "text-amber-400",
  indigo: "text-primary",
};

function Section({
  icon,
  title,
  items,
  tone,
}: {
  icon: typeof TrendingUp;
  title: string;
  items: string[];
  tone: "emerald" | "rose" | "amber" | "indigo";
}) {
  if (items.length === 0) return null;
  return (
    <Card icon={icon} title={title}>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-sm text-muted-foreground">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[tone]} bg-current`} />
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof TrendingUp; title: string; children: React.ReactNode }) {
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

export default function ResumePage() {
  return (
    <ProtectedRoute>
      <ResumeContent />
    </ProtectedRoute>
  );
}
