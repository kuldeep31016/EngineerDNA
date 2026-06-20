"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  Github,
  Loader2,
  Maximize,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Play,
  RotateCcw,
  ScanFace,
  ShieldCheck,
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
  type InterviewListItem,
  type InterviewRole,
  type ProctoringReport,
  type StartInterviewInput,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useFaceMonitor } from "@/hooks/useFaceMonitor";
import { useObjectMonitor } from "@/hooks/useObjectMonitor";
import { useProctoring } from "@/hooks/useProctoring";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  cancelSpeech,
  isSpeechSynthesisSupported,
  listEnglishVoices,
  pickPreferredVoice,
  primeSpeech,
  speak,
} from "@/lib/speech";
import { extractPdfText } from "@/lib/resume";
import { exitFullscreen, requestFullscreen } from "@/lib/fullscreen";
import { getGithubStatus } from "@/services/github";
import {
  getInterview,
  gradeInterview,
  listInterviews,
  startInterview,
  submitTurn,
} from "@/services/interview";

type Phase = "setup" | "ready" | "live" | "report";

const TOTAL_QUESTIONS = 6;
// How long a candidate can pause (no new speech) before we auto-submit the answer.
const SILENCE_MS = 3500;

// The AI interviewer speaks a short intro once, before the first question.
function introGreeting(name: string | null): string {
  const who = name?.split(" ")[0] || "there";
  return `Hello ${who}. I'm Ava, your EngineerDNA interviewer. Answer each question naturally — when you finish, just pause and I'll continue. Let's begin.`;
}
const FINAL_MESSAGE =
  "Thank you for completing the EngineerDNA interview. Your responses have been recorded, and your report is being generated.";

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
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");
  const [history, setHistory] = useState<InterviewListItem[]>([]);
  const [current, setCurrent] = useState<Interview | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [pendingInput, setPendingInput] = useState<StartInterviewInput | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refreshHistory = () => listInterviews().then(setHistory).catch(() => {});
  useEffect(() => {
    void refreshHistory();
    getGithubStatus()
      .then((s) => setGithubConnected(s.connected))
      .catch(() => setGithubConnected(false));
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(
    () => () => {
      cancelSpeech();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  // Clicking "Start" recommends connecting GitHub once (non-blocking) when it
  // isn't connected — otherwise it begins immediately.
  function requestStart(input: StartInterviewInput) {
    setError(null);
    if (githubConnected === false) {
      setPendingInput(input);
      return;
    }
    void actuallyStart(input);
  }

  async function actuallyStart(input: StartInterviewInput) {
    setPendingInput(null);
    setBusy(true);

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
      setPhase("ready"); // pre-flight: instructions + system check, then fullscreen
    } catch {
      media?.getTracks().forEach((t) => t.stop());
      setError(
        "Couldn't start the interview. Make sure the analysis model is configured (ANTHROPIC_API_KEY), then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Begin the live interview — both fullscreen and speech must be unlocked from
  // the click gesture, so we prime them here before switching to the live phase.
  async function beginLive() {
    primeSpeech(); // unlock TTS on the user gesture so the AI can speak
    await requestFullscreen();
    setPhase("live");
  }

  function handleComplete(graded: Interview) {
    void exitFullscreen(); // interview finished — leave fullscreen for the report
    setCurrent(graded);
    setPhase("report");
    stopStream();
    void refreshHistory();
  }

  function leave() {
    void exitFullscreen();
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
        <Setup defaultName={user?.name ?? ""} busy={busy} history={history} onStart={requestStart} onOpen={openPast} />
      )}

      {phase === "ready" && current && (
        <ReadyCheck stream={stream} onBegin={beginLive} onCancel={leave} />
      )}

      {phase === "live" && current && (
        <Live interview={current} stream={stream} onComplete={handleComplete} />
      )}

      {phase === "report" && current && current.report && <Report interview={current} onDone={leave} />}

      {pendingInput && (
        <RepoTipModal
          onConnect={() => router.push("/repositories")}
          onStartAnyway={() => actuallyStart(pendingInput)}
          onClose={() => setPendingInput(null)}
        />
      )}
    </main>
  );
}

/* ---------------- Repo recommendation (non-blocking) ---------------- */

function RepoTipModal({
  onConnect,
  onStartAnyway,
  onClose,
}: {
  onConnect: () => void;
  onStartAnyway: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Github className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-lg font-semibold">Want sharper questions?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your GitHub and we&apos;ll ground the interview in your real projects and verified skills. It&apos;s
          optional — you can start right now without it.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onConnect}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Github className="h-4 w-4" /> Connect repositories
          </button>
          <button
            onClick={onStartAnyway}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Start anyway
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Ready / system check (pre-flight) ---------------- */

function ReadyCheck({
  stream,
  onBegin,
  onCancel,
}: {
  stream: MediaStream | null;
  onBegin: () => void;
  onCancel: () => void;
}) {
  const cameraOk = Boolean(stream?.getVideoTracks().some((t) => t.readyState === "live"));
  const micOk = Boolean(stream?.getAudioTracks().some((t) => t.readyState === "live"));
  const fullscreenOk = typeof document !== "undefined" && Boolean(document.documentElement.requestFullscreen);

  const checks = [
    { label: "Camera", ok: cameraOk, hint: "Allow camera access" },
    { label: "Microphone", ok: micOk, hint: "Allow microphone access" },
    { label: "Fullscreen supported", ok: fullscreenOk, hint: "Use Chrome or Edge" },
  ];

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {/* Rules */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Before you begin</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          This is a proctored interview. To keep it fair, your session is monitored. Please:
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            "Stay in fullscreen for the whole interview.",
            "Do not switch tabs, minimize, or leave the window.",
            "Keep your camera and microphone on.",
            "Copy / paste and right-click are disabled.",
          ].map((r) => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-muted-foreground">{r}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          After <strong>3 violations</strong> (exiting fullscreen, switching tabs, or leaving the window) your interview
          ends automatically.
        </div>
      </div>

      {/* System check */}
      <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">System check</h2>
        </div>
        <div className="mt-4 space-y-2">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <span className="text-sm">{c.label}</span>
              {c.ok ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
                  <AlertTriangle className="h-4 w-4" /> {c.hint}
                </span>
              )}
            </div>
          ))}
        </div>

        {!cameraOk && (
          <p className="mt-3 text-xs text-muted-foreground">
            Camera/mic are recommended for a realistic interview, but you can still begin without them.
          </p>
        )}

        <div className="mt-auto flex gap-2 pt-5">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onBegin}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Maximize className="h-4 w-4" /> Begin interview (fullscreen)
          </button>
        </div>
      </div>
    </div>
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
        <p className="mt-1 text-sm text-muted-foreground">Pick a role, add your resume if you like, and start.</p>

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

/* ---------------- Live interview (turn by turn) ---------------- */

const DIFF_BADGE: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  hard: "bg-rose-500/15 text-rose-300",
};

function Live({
  interview: initial,
  stream,
  onComplete,
}: {
  interview: Interview;
  stream: MediaStream | null;
  onComplete: (graded: Interview) => void;
}) {
  const [interview, setInterview] = useState<Interview>(initial);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [speaking, setSpeaking] = useState(false);
  const [working, setWorking] = useState<null | "thinking" | "grading">(null);
  const [err, setErr] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const stt = useSpeechRecognition();
  const finishingRef = useRef(false);
  const proc = useProctoring(true, () => {}); // termination handled via the effect below
  const face = useFaceMonitor(videoRef, true, proc.registerVisionEvent); // face count + gaze
  useObjectMonitor(videoRef, true, proc.registerVisionEvent); // phone detection

  const q = interview.questions[idx]!;
  const isFinalQuestion = interview.questions.length >= TOTAL_QUESTIONS && idx === interview.questions.length - 1;
  const selectedVoice = voices.find((v) => v.voiceURI === voiceURI) ?? null;

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  // Load the available voices (they arrive asynchronously in some browsers).
  useEffect(() => {
    if (!isSpeechSynthesisSupported()) return;
    const update = () => {
      const list = listEnglishVoices();
      setVoices(list);
      setVoiceURI((prev) => prev || (pickPreferredVoice(list)?.voiceURI ?? ""));
    };
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  // Hands-free when speech recognition is available (Chrome/Edge): the AI speaks,
  // the mic opens automatically, and we advance on a natural pause. Browsers
  // without STT fall back to typing + a manual Next button.
  const autoMode = stt.supported;
  const advancingRef = useRef(false);
  const advanceRef = useRef<() => void>(() => {});
  const wasListeningRef = useRef(false);
  const spokenRef = useRef<string>(""); // id of the question we've already spoken
  const introducedRef = useRef(false);
  const [initializing, setInitializing] = useState(true);

  function startListening() {
    if (!autoMode || finishingRef.current) return;
    stt.start(""); // fresh transcript for each question
  }

  // Brief "initializing" so voices finish loading and fullscreen settles before
  // the AI speaks — mirrors a real interview platform's connect screen.
  useEffect(() => {
    const t = setTimeout(() => setInitializing(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // Ask each question EXACTLY ONCE, then auto-open the mic. The id guard makes
  // this safe against React StrictMode's mount→unmount→remount in dev (which
  // would otherwise cancel the speech). We intentionally do NOT cancel on
  // cleanup — speak() already cancels the previous question before the next one.
  useEffect(() => {
    if (initializing) return;
    if (spokenRef.current === q.id) return;
    spokenRef.current = q.id;
    advancingRef.current = false;

    const intro = introducedRef.current ? "" : `${introGreeting(interview.candidateName)} `;
    introducedRef.current = true;

    setSpeaking(true);
    speak(intro + q.prompt, {
      voice: selectedVoice,
      onStart: () => setSpeaking(true),
      onEnd: () => {
        setSpeaking(false);
        startListening();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing, q.id]);

  function changeVoice(uri: string) {
    setVoiceURI(uri);
    const voice = voices.find((v) => v.voiceURI === uri) ?? null;
    setSpeaking(true);
    speak("Hi, I'll be your interviewer today.", {
      voice,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  }

  // Mirror the live transcript into the current answer while recording.
  useEffect(() => {
    if (stt.listening) setAnswers((prev) => ({ ...prev, [q.id]: stt.transcript }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.transcript, stt.listening]);

  function repeat() {
    stt.stop(); // never let TTS and STT run at the same time
    setSpeaking(true);
    speak(q.prompt, {
      voice: selectedVoice,
      onStart: () => setSpeaking(true),
      onEnd: () => {
        setSpeaking(false);
        startListening();
      },
    });
  }

  async function next() {
    stt.stop();
    cancelSpeech();
    setErr(null);
    setWorking("thinking");
    try {
      const text = (answers[q.id] || stt.transcript || "").trim();
      const res = await submitTurn(interview.id, text);
      if (res.done) {
        finishingRef.current = true;
        setWorking("grading");
        if (autoMode) speak(FINAL_MESSAGE, { voice: selectedVoice }); // spoken sign-off
        const graded = await gradeInterview(interview.id, proc.violations);
        onComplete(graded);
        return;
      }
      setInterview(res.interview);
      setIdx(res.interview.questions.length - 1);
      setWorking(null);
    } catch {
      setErr("Something went wrong — please try again.");
      setWorking(null);
    }
  }

  // Single guarded entry point so the silence timer and the recogniser-ended
  // backup can never double-submit the same answer.
  function advance() {
    if (advancingRef.current || working !== null || finishingRef.current) return;
    advancingRef.current = true;
    void next();
  }
  advanceRef.current = advance;

  // Auto-advance: when the candidate pauses (~3.5s of no new words) after having
  // said something, submit and move to the next question. No button to click.
  useEffect(() => {
    if (!autoMode || !stt.listening || !stt.transcript.trim()) return;
    const t = setTimeout(() => advanceRef.current(), SILENCE_MS);
    return () => clearTimeout(t);
  }, [autoMode, stt.listening, stt.transcript]);

  // The Web Speech recogniser sometimes ends on its own. If it does with an
  // answer captured, advance; if nothing was said yet, quietly reopen the mic.
  useEffect(() => {
    if (!autoMode) return;
    const ended = wasListeningRef.current && !stt.listening;
    wasListeningRef.current = stt.listening;
    if (!ended || working !== null || advancingRef.current || finishingRef.current) return;
    const hasAnswer = (answers[q.id] || stt.transcript || "").trim().length > 0;
    if (hasAnswer) advanceRef.current();
    else if (!speaking) stt.start("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.listening]);

  // Auto-terminate: once the proctor flags too many violations, end the session
  // and grade whatever was answered (the report records that it was terminated).
  useEffect(() => {
    if (!proc.terminated || finishingRef.current) return;
    finishingRef.current = true;
    stt.stop();
    cancelSpeech();
    setWorking("grading");
    gradeInterview(interview.id, proc.violations)
      .then(onComplete)
      .catch(() => setErr("The interview ended, but grading failed. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proc.terminated]);

  const answeredCount = Object.values(answers).filter((a) => a.trim()).length;
  const progress = Math.min((idx + 1) / TOTAL_QUESTIONS, 1) * 100;

  return (
    // Fullscreen overlay — covers the sidebar/header (z above app chrome) so the
    // candidate sees ONLY the interview, matching real proctored test platforms.
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-6">
        {/* Anti-cheat warning toast */}
        {proc.warning && (
          <div className="sticky top-0 z-10 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200 shadow-lg">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">
              {proc.warning.strike && <strong>Warning {Math.min(proc.warning.count, 3)}/3 — </strong>}
              {proc.warning.message}
            </span>
            <button onClick={proc.dismissWarning} aria-label="Dismiss" className="shrink-0 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Lost fullscreen — prompt to return */}
        {!proc.isFullscreen && !proc.terminated && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
            <span className="flex items-center gap-2">
              <Maximize className="h-4 w-4" /> You left fullscreen. Return to continue safely.
            </span>
            <button
              onClick={proc.enterFullscreen}
              className="rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
            >
              Re-enter fullscreen
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Question {idx + 1} <span className="text-muted-foreground">of {TOTAL_QUESTIONS}</span>
          </span>
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Proctored
            </span>
            <span>{roleLabel(interview.role)} · {answeredCount} answered</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center">
          <Orb speaking={speaking} thinking={working === "thinking"} />
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">AI Interviewer</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-primary">
            {working === "thinking" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </>
            ) : speaking ? (
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
          {voices.length > 0 && (
            <select
              value={voiceURI}
              onChange={(e) => changeVoice(e.target.value)}
              title="Interviewer voice"
              className="mt-3 max-w-[12rem] truncate rounded-lg border border-border bg-background px-2 py-1 text-xs text-muted-foreground outline-none transition-colors focus:border-primary/60"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black/60">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
              <VideoOff className="h-6 w-6" />
              <span className="text-xs">Camera off</span>
            </div>
          )}
          {/* Live face-monitor status chip (MediaPipe). */}
          {stream && face.supported && (
            <span
              className={`absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur ${
                face.faceCount === 1
                  ? "bg-emerald-500/20 text-emerald-200"
                  : face.faceCount === 0
                    ? "bg-amber-500/20 text-amber-200"
                    : face.faceCount && face.faceCount > 1
                      ? "bg-rose-500/20 text-rose-200"
                      : "bg-black/40 text-white/80"
              }`}
            >
              <ScanFace className="h-3 w-3" />
              {face.faceCount === null
                ? "Monitoring…"
                : face.faceCount === 1
                  ? "1 face"
                  : face.faceCount === 0
                    ? "No face"
                    : `${face.faceCount} faces`}
            </span>
          )}
        </div>
      </div>

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

        {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}

        {autoMode ? (
          /* Hands-free: status only — the candidate's spoken words are NOT shown. */
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-background/40 py-6 text-center">
            {initializing ? (
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting your AI interviewer…
              </p>
            ) : working === "grading" ? (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Loader2 className="h-4 w-4 animate-spin" /> Thank you! Preparing your report…
              </p>
            ) : working === "thinking" ? (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Loader2 className="h-4 w-4 animate-spin" /> Got it — next question…
              </p>
            ) : speaking ? (
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Volume2 className="h-4 w-4" /> Listen to the question…
              </p>
            ) : stt.listening ? (
              <>
                <span className="relative flex h-12 w-12 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/30" />
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">
                    <Mic className="h-5 w-5" />
                  </span>
                </span>
                <p className="text-sm font-medium text-rose-300">Listening — answer out loud</p>
                <p className="text-xs text-muted-foreground">I&apos;ll move on automatically when you pause.</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Preparing…</p>
            )}

            {/* Subtle manual override — the flow is automatic, but a pause can be ended early. */}
            {stt.listening && (
              <button
                onClick={advance}
                className="mt-1 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                {isFinalQuestion ? "Finish now" : "Done answering"}
              </button>
            )}
          </div>
        ) : (
          /* Fallback (no speech recognition): type the answer + manual Next. */
          <>
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              readOnly={working !== null}
              rows={4}
              placeholder="Type your answer here…"
              className="mt-3 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60 read-only:opacity-80"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MicOff className="h-3.5 w-3.5" /> Voice needs Chrome or Edge — typing works everywhere.
              </span>
              <button
                onClick={next}
                disabled={working !== null}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${
                  isFinalQuestion ? "bg-emerald-600" : "bg-brand"
                }`}
              >
                {working === "thinking" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Next…
                  </>
                ) : working === "grading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Grading…
                  </>
                ) : isFinalQuestion ? (
                  <>
                    <PhoneOff className="h-4 w-4" /> Finish &amp; get report
                  </>
                ) : (
                  <>Next question</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

function Orb({ speaking, thinking }: { speaking: boolean; thinking: boolean }) {
  const active = speaking || thinking;
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {active && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="absolute inset-2 animate-pulse rounded-full bg-primary/20" />
        </>
      )}
      <span
        className={`relative h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-primary/30 transition-transform ${
          active ? "scale-110" : "scale-100"
        }`}
      />
    </div>
  );
}

/* ---------------- Report ---------------- */

/** Integrity / proctoring summary on the report — what the recruiter trusts. */
function IntegrityPanel({ p }: { p: ProctoringReport }) {
  const clean =
    p.fullscreenExits +
      p.tabSwitches +
      p.focusLost +
      p.noFaceEvents +
      p.multipleFaceEvents +
      p.lookAwayEvents +
      p.phoneEvents ===
    0;
  const stats = [
    { label: "Fullscreen exits", value: p.fullscreenExits },
    { label: "Tab switches", value: p.tabSwitches },
    { label: "Window left", value: p.focusLost },
    { label: "No face", value: p.noFaceEvents },
    { label: "Multiple faces", value: p.multipleFaceEvents },
    { label: "Looked away", value: p.lookAwayEvents },
    { label: "Phone seen", value: p.phoneEvents },
  ];
  return (
    <div
      className={`rounded-xl border p-5 ${
        p.terminated
          ? "border-rose-500/40 bg-rose-500/10"
          : clean
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">Interview integrity</h3>
        <span
          className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
            p.terminated
              ? "bg-rose-500/15 text-rose-300"
              : clean
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
          }`}
        >
          {p.terminated ? "Ended on violations" : clean ? "Clean session" : "Flagged"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background/40 px-3 py-2.5 text-center">
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

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

      {interview.proctoring && <IntegrityPanel p={interview.proctoring} />}

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
