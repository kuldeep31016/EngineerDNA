"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  Clock,
  Cloud,
  Code2,
  Container,
  Database,
  FlaskConical,
  GraduationCap,
  Hammer,
  Layout,
  Loader2,
  Map as MapIcon,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Webhook,
  Wrench,
} from "lucide-react";
import {
  INTERVIEW_ROLES,
  type InterviewRole,
  type LearningRoadmap,
  type RoadmapNode,
  type RoadmapStatus,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { generateRoadmap, getRoadmap } from "@/services/roadmap";

const CATEGORY_ICON: Record<string, typeof Server> = {
  frontend: Layout,
  backend: Server,
  database: Database,
  devops: Container,
  cloud: Cloud,
  testing: FlaskConical,
  language: Code2,
  api: Webhook,
  security: ShieldCheck,
  aiml: BrainCircuit,
  data: BarChart3,
  tool: Wrench,
  fundamentals: GraduationCap,
};

const STATUS_META: Record<RoadmapStatus, { label: string; badge: string; marker: string }> = {
  done: {
    label: "Mastered",
    badge: "bg-emerald-500/15 text-emerald-300",
    marker: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white ring-emerald-500/30",
  },
  learning: {
    label: "In progress",
    badge: "bg-amber-500/15 text-amber-300",
    marker: "bg-gradient-to-br from-amber-500 to-orange-500 text-white ring-amber-500/30",
  },
  todo: {
    label: "To learn",
    badge: "bg-muted text-muted-foreground",
    marker: "bg-card text-muted-foreground ring-border",
  },
};

function roleFromGoal(goal: string): InterviewRole {
  return INTERVIEW_ROLES.find((r) => r.label === goal)?.value ?? "backend";
}

function RoadmapContent() {
  const [loaded, setLoaded] = useState(false);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [view, setView] = useState<"setup" | "map">("setup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRoadmap()
      .then((r) => {
        if (r.available) {
          setRoadmap(r);
          setView("map");
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function run(role: InterviewRole, regenerate = false) {
    setBusy(true);
    setError(null);
    try {
      const r = await generateRoadmap({ role, regenerate });
      setRoadmap(r);
      setView("map");
    } catch {
      setError("Couldn't build your roadmap. Make sure the analysis model is configured, then try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <LoadingScreen label="Loading your roadmap…" />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        {view === "map" && roadmap && (
          <button
            onClick={() => setView("setup")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Change goal"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Roadmap</h1>
          <p className="text-sm text-muted-foreground">
            Your path to the role you want — progress tracks your real evidence.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {view === "setup" || !roadmap ? (
        <Setup
          defaultRole={roadmap ? roleFromGoal(roadmap.goal) : "backend"}
          busy={busy}
          hasRoadmap={!!roadmap}
          onCancel={roadmap ? () => setView("map") : undefined}
          onGenerate={(role) => run(role)}
        />
      ) : (
        <RoadmapView
          roadmap={roadmap}
          busy={busy}
          onRegenerate={() => run(roleFromGoal(roadmap.goal), true)}
          onChangeGoal={() => setView("setup")}
        />
      )}
    </main>
  );
}

/* ---------------- Setup ---------------- */

function Setup({
  defaultRole,
  busy,
  hasRoadmap,
  onCancel,
  onGenerate,
}: {
  defaultRole: InterviewRole;
  busy: boolean;
  hasRoadmap: boolean;
  onCancel?: () => void;
  onGenerate: (role: InterviewRole) => void;
}) {
  const [role, setRole] = useState<InterviewRole>(defaultRole);

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-lg font-semibold">Where do you want to go?</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Choose a target role and we&apos;ll map a stage-by-stage path to get there — every skill marked done,
          in progress, or to-learn from your real evidence.
        </p>

        <div className="mt-5 max-w-xs">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Target role
          </label>
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
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => onGenerate(role)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Building your roadmap…
              </>
            ) : (
              <>
                <MapIcon className="h-4 w-4" /> Build my roadmap
              </>
            )}
          </button>
          {hasRoadmap && onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Roadmap view ---------------- */

function RoadmapView({
  roadmap,
  busy,
  onRegenerate,
  onChangeGoal,
}: {
  roadmap: LearningRoadmap;
  busy: boolean;
  onRegenerate: () => void;
  onChangeGoal: () => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mt-6 space-y-6">
      {/* Hero / progress */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Goal</p>
        <h2 className="text-2xl font-bold text-brand-gradient">{roadmap.goal}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{roadmap.summary}</p>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium">
              {roadmap.completedSkills} of {roadmap.totalSkills} skills mastered
            </span>
            <span className="font-semibold tabular-nums text-primary">{roadmap.progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${roadmap.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Legend className="bg-emerald-500" label="Mastered" />
          <Legend className="bg-amber-500" label="In progress" />
          <Legend className="bg-muted-foreground/40" label="To learn" />
          <div className="ml-auto flex gap-2">
            <button
              onClick={onChangeGoal}
              className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent"
            >
              Change goal
            </button>
            <button
              onClick={onRegenerate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* The graph */}
      <div className="relative">
        <div className="absolute bottom-2 left-[18px] top-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
        {roadmap.stages.map((stage, si) => (
          <div key={stage.title} className="mb-6">
            {/* Stage header */}
            <div className="relative mb-3 pl-12">
              <span className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-primary/30">
                {si + 1}
              </span>
              <h3 className="text-base font-semibold leading-9">{stage.title}</h3>
              <p className="-mt-1 text-xs text-muted-foreground">{stage.subtitle}</p>
            </div>

            {/* Nodes */}
            {stage.nodes.map((node) => (
              <NodeRow key={node.id} node={node} open={open.has(node.id)} onToggle={() => toggle(node.id)} />
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Skills flip to <span className="text-emerald-400">Mastered</span> automatically as your repositories build
        evidence for them.
      </p>
    </div>
  );
}

function NodeRow({ node, open, onToggle }: { node: RoadmapNode; open: boolean; onToggle: () => void }) {
  const Icon = CATEGORY_ICON[node.category] ?? GraduationCap;
  const meta = STATUS_META[node.status];

  return (
    <div className="relative mb-3 pl-12">
      <span
        className={`absolute left-0 top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full ring-2 ${meta.marker}`}
      >
        {node.status === "done" ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>

      <div className="rounded-xl border border-border bg-card">
        <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{node.skill}</p>
            <p className="text-xs text-muted-foreground">{node.estimate}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${meta.badge}`}>
            {meta.label}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="space-y-3 border-t border-border px-4 py-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{node.why}</p>
            <div className="flex items-start gap-2 rounded-lg bg-background/50 px-3 py-2">
              <Hammer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm">
                <span className="font-medium">Build it: </span>
                {node.project}
              </p>
            </div>
            {node.resources.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {node.resources.map((r) => (
                  <span key={r} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
                    {r}
                  </span>
                ))}
              </div>
            )}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Estimated {node.estimate}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

export default function RoadmapPage() {
  return (
    <ProtectedRoute>
      <RoadmapContent />
    </ProtectedRoute>
  );
}
