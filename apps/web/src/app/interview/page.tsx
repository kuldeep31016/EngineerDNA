"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  Video,
  VideoOff,
  Volume2,
  X,
} from "lucide-react";
import {
  INTERVIEW_ROLES,
  type Interview,
  type InterviewAnswer,
  type InterviewListItem,
  type InterviewRole,
  type StartInterviewInput,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cancelSpeech, speak } from "@/lib/speech";
import { extractPdfText } from "@/lib/resume";
import {
  getInterview,
  listInterviews,
  startInterview,
  submitAnswers,
} from "@/services/interview";

type Phase = "setup" | "live" | "report";

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
function roleLabel(role: string | null): string {
  return INTERVIEW_ROLES.find((r) => r.value === role)?.label ?? "Technical";
}

function InterviewContent() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("setup");
  const [history, setHistory] = useState<InterviewListItem[]>([]);
  const [current, setCurrent] = useState<Interview | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState<null | "start" | "grade">(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refreshHistory = () => listInterviews().then(setHistory).catch(() => {});
  useEffect(() => {
    void refreshHistory();
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  // Always release the camera/mic and stop speech when leaving the page.
  useEffect(
    () => () => {
      cancelSpeech();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function handleStart(input: StartInterviewInput) {
    setBusy("start");
    setError(null);

    // Ask for camera + mic up front (also covers the mic that speech-to-text
    // needs). If denied, the interview still runs without video.
    let media: MediaStream | null = null;
    try {
      media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      media = null;
    }

    try {
      const res = await startInterview(input);
      if (!res.interview) {
        setError(res.reason ?? "Could not start the interview.");
        media?.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = media;
      setStream(media);
      setCurrent(res.interview);
      setPhase("live");
    } catch {
      media?.getTracks().forEach((t) => t.stop());
      setError(
        "Couldn't generate the interview. Make sure the analysis model is configured (ANTHROPIC_API_KEY), then try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleFinish(answers: InterviewAnswer[]) {
    if (!current) return;
    setBusy("grade");
    setError(null);
    cancelSpeech();
    try {
      const graded = await submitAnswers(current.id, answers);
      setCurrent(graded);
      setPhase("report");
      void refreshHistory();
    } catch {
      setError("Couldn't grade the interview. Please try again.");
    } finally {
      stopStream();
      setBusy(null);
    }
  }

  function leave() {
    cancelSpeech();
    stopStream();
    setCurrent(null);
    setPhase("setup");
    setError(null);
    void refreshHistory();
  }

  async function openPast(id: string) {
    setError(null);
    const iv = await getInterview(id);
    if (iv.status === "EVALUATED" && iv.report) {
      setCurrent(iv);
      setPhase("report");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        {phase !== "setup" && (
          <button
            onClick={leave}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Video className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Interview</h1>
          <p className="text-sm text-muted-foreground">
            A live, spoken mock interview tailored to your role and your real work.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {phase === "setup" && (
        <Setup
          defaultName={user?.name ?? ""}
          busy={busy === "start"}
          history={history}
          onStart={handleStart}
          onOpen={openPast}
        />
      )}

      {phase === "live" && current && (
        <Live interview={current} stream={stream} grading={busy === "grade"} onFinish={handleFinish} />
      )}

      {phase === "report" && current && current.report && <Report interview={current} onDone={leave} />}
    </main>
  );
}

/* ---------------- Setup ---------------- */

function Setup({
  defaultName,
  busy,
  history,
  onStart,
  onOpen,
}: {
  defaultName: string;
  busy: boolean;
  history: InterviewListItem[];
  onStart: (input: StartInterviewInput) => void;
  onOpen: (id: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState<InterviewRole>("backend");
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);

  async function onResumeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setShowManual(false);
    setResumeName(file.name);
    setParsing(true);
    try {
      setResumeText(await extractPdfText(file));
    } catch {
      setParseError("Couldn't read that PDF — add your details manually instead.");
      setResumeName(null);
    } finally {
      setParsing(false);
    }
    e.target.value = "";
  }

  function clearResume() {
    setResumeText("");
    setResumeName(null);
    setShowManual(false);
    setParseError(null);
  }

  function submit() {
    onStart({
      role,
      candidateName: name.trim() || undefined,
      resumeText: resumeText.trim() || undefined,
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <h2 className="text-lg font-semibold">Set up your interview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a role, add your resume if you like, and start.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kuldeep"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
            />
          </Field>

          <Field label="Interviewing for">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as InterviewRole)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
            >
              {INTERVIEW_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resume <span className="normal-case text-muted-foreground/70">(optional)</span>
          </label>

          {parsing ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Reading your resume…
            </div>
          ) : resumeName ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="min-w-0 flex-1 truncate">{resumeName}</span>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <button
                onClick={clearResume}
                aria-label="Remove resume"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              <Upload className="h-4 w-4" /> Upload PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={onResumeFile} />
            </label>
          )}

          <button
            onClick={() => setShowManual((v) => !v)}
            className="mt-2 text-xs font-medium text-primary transition-opacity hover:opacity-80"
          >
            {showManual ? "Hide details" : resumeName ? "Edit details" : "Or add details manually"}
          </button>

          {showManual && (
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={4}
              placeholder="Paste your resume or key experience so questions match your background."
              className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
            />
          )}

          {parseError && <p className="mt-1.5 text-xs text-amber-300">{parseError}</p>}
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing your interview…
            </>
          ) : (
            <>
              <Video className="h-4 w-4" /> Start interview
            </>
          )}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Camera &amp; mic stay in your browser — nothing is recorded or uploaded.
        </p>
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
                  disabled={h.overallScore === null}
                  className="flex w-full items-center gap-3 py-3 text-left transition-colors enabled:hover:opacity-80 disabled:cursor-default"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{roleLabel(h.role)} interview</p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ---------------- Live interview ---------------- */

const DIFF_BADGE: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  hard: "bg-rose-500/15 text-rose-300",
};

function Live({
  interview,
  stream,
  grading,
  onFinish,
}: {
  interview: Interview;
  stream: MediaStream | null;
  grading: boolean;
  onFinish: (answers: InterviewAnswer[]) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [speaking, setSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stt = useSpeechRecognition();

  const total = interview.questions.length;
  const q = interview.questions[idx]!;
  const isLast = idx === total - 1;

  // Attach the webcam stream to the self-view.
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  // Speak each question as it appears.
  useEffect(() => {
    setSpeaking(true);
    speak(q.prompt, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Mirror the live transcript into the current answer while recording.
  useEffect(() => {
    if (stt.listening) setAnswers((prev) => ({ ...prev, [q.id]: stt.transcript }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.transcript, stt.listening]);

  function repeat() {
    setSpeaking(true);
    speak(q.prompt, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
  }

  function toggleRecord() {
    if (stt.listening) {
      stt.stop();
    } else {
      cancelSpeech();
      setSpeaking(false);
      stt.start(answers[q.id] ?? "");
    }
  }

  function go(next: number) {
    stt.stop();
    cancelSpeech();
    setIdx(next);
  }

  function finish() {
    stt.stop();
    cancelSpeech();
    const payload = interview.questions.map((qq) => ({
      questionId: qq.id,
      answer: (answers[qq.id] ?? "").trim(),
    }));
    onFinish(payload);
  }

  const answeredCount = interview.questions.filter((qq) => (answers[qq.id] ?? "").trim()).length;

  return (
    <div className="mt-6 space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Question {idx + 1} <span className="text-muted-foreground">of {total}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {roleLabel(interview.role)} · {answeredCount}/{total} answered
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* AI interviewer */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center">
          <Orb speaking={speaking} />
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">AI Interviewer</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-primary">
            {speaking ? (
              <>
                <Volume2 className="h-3.5 w-3.5" /> Speaking…
              </>
            ) : stt.listening ? (
              <>
                <Mic className="h-3.5 w-3.5 animate-pulse" /> Listening…
              </>
            ) : (
              <>Ready</>
            )}
          </p>
        </div>

        {/* Candidate self-view */}
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black/60">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
              <VideoOff className="h-6 w-6" />
              <span className="text-xs">Camera off</span>
            </div>
          )}
        </div>
      </div>

      {/* Question + answer */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${DIFF_BADGE[q.difficulty]}`}>
            {q.difficulty}
          </span>
          <span className="truncate text-xs text-muted-foreground">{q.topic}</span>
          <button
            onClick={repeat}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Repeat
          </button>
        </div>
        <p className="text-base leading-relaxed">{q.prompt}</p>

        <textarea
          value={answers[q.id] ?? ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          readOnly={stt.listening}
          rows={4}
          placeholder={stt.supported ? "Tap the mic and answer out loud, or type here…" : "Type your answer here…"}
          className="mt-3 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60 read-only:opacity-80"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {stt.supported ? (
            <button
              onClick={toggleRecord}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                stt.listening
                  ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"
                  : "bg-brand text-white hover:opacity-90"
              }`}
            >
              {stt.listening ? (
                <>
                  <MicOff className="h-4 w-4" /> Stop recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" /> Record answer
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MicOff className="h-3.5 w-3.5" /> Voice input needs Chrome or Edge — typing works everywhere.
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {idx > 0 && (
              <button
                onClick={() => go(idx - 1)}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Previous
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => go(idx + 1)}
                className="rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Next question
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={grading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {grading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Grading…
                  </>
                ) : (
                  <>
                    <PhoneOff className="h-4 w-4" /> Finish &amp; get report
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Orb({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {speaking && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="absolute inset-2 animate-pulse rounded-full bg-primary/20" />
        </>
      )}
      <span
        className={`relative h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-primary/30 transition-transform ${
          speaking ? "scale-110" : "scale-100"
        }`}
      />
    </div>
  );
}

/* ---------------- Report ---------------- */

function Report({ interview, onDone }: { interview: Interview; onDone: () => void }) {
  const report = interview.report!;
  const answerById = new Map(interview.answers.map((a) => [a.questionId, a.answer]));

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {roleLabel(interview.role)} interview
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-6">
          <div>
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
        onClick={onDone}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
      >
        <Play className="h-4 w-4" /> Take another interview
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
