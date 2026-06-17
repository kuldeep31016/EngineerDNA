"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Code2,
  Database,
  FlaskConical,
  FolderTree,
  GitFork,
  Github,
  Lightbulb,
  Loader2,
  Network,
  Package,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import type {
  AnalysisReport,
  ComplexityLevel,
  Repository,
  RepositoryAnalysis,
  RepoEvidenceItem,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { getAnalysis, getRepository, startAnalysis } from "@/services/analysis";
import { buildRepoEvidence, getRepoEvidence } from "@/services/evidence";

const COMPLEXITY: Record<ComplexityLevel, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "bg-sky-500/10 text-sky-400 ring-sky-500/20" },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  },
  advanced: { label: "Advanced", className: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
};

function ReportContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [repo, setRepo] = useState<Repository | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    void Promise.all([getRepository(id), getAnalysis(id)]).then(([r, a]) => {
      setRepo(r);
      setAnalysis(a);
      setLoading(false);
    });
  }, [id]);

  const isRunning = analysis?.status === "PENDING" || analysis?.status === "RUNNING";
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      void getAnalysis(id).then((a) => a && setAnalysis(a));
    }, 3000);
    return () => clearInterval(timer);
  }, [isRunning, id]);

  const analyze = useCallback(async () => {
    setStarting(true);
    try {
      setAnalysis(await startAnalysis(id));
    } finally {
      setStarting(false);
    }
  }, [id]);

  if (loading || !repo) return <LoadingScreen label="Loading repository…" />;

  const done = analysis?.status === "COMPLETED" && analysis.report;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/repositories"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Repositories
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{repo.name}</h1>
            {done && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${COMPLEXITY[analysis!.report!.complexity.level].className}`}
              >
                {COMPLEXITY[analysis!.report!.complexity.level].label}
              </span>
            )}
          </div>
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" /> {repo.fullName}
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> {repo.stars}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" /> {repo.forks}
            </span>
          </a>
        </div>

        <Button onClick={analyze} disabled={starting || isRunning}>
          <Sparkles className="h-4 w-4" />
          {done ? "Re-analyze" : "Analyze"}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <EvidencePanel repoId={id} />
        {!analysis && <EmptyState />}
        {isRunning && <RunningState />}
        {analysis?.status === "FAILED" && <FailedState error={analysis.error} />}
        {done && <ReportView report={analysis!.report!} model={analysis!.model} updatedAt={analysis!.updatedAt} />}
      </div>
    </main>
  );
}

function EvidencePanel({ repoId }: { repoId: string }) {
  const [items, setItems] = useState<RepoEvidenceItem[] | null>(null);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    void getRepoEvidence(repoId).then(setItems);
  }, [repoId]);

  const build = async () => {
    setBuilding(true);
    try {
      setItems(await buildRepoEvidence(repoId));
    } finally {
      setBuilding(false);
    }
  };

  const used = items?.filter((i) => i.strength === "USED") ?? [];
  const mentioned = items?.filter((i) => i.strength === "MENTIONED") ?? [];
  const hasAny = items && items.length > 0;

  return (
    <Panel className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionHead icon={BadgeCheck} title="Evidence" />
        <Button variant="outline" size="sm" onClick={build} disabled={building}>
          {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
          {hasAny ? "Rebuild" : "Build evidence"}
        </Button>
      </div>

      {!hasAny ? (
        <p className="text-sm text-muted-foreground">
          Detect what this repository actually <span className="font-medium">uses</span> versus
          what is only <span className="font-medium">mentioned</span> as a dependency. No AI cost —
          this runs instantly.
        </p>
      ) : (
        <div className="space-y-4">
          {used.length > 0 && <EvidenceGroup label="Verified — actually used" items={used} used />}
          {mentioned.length > 0 && (
            <EvidenceGroup label="Mentioned only" items={mentioned} used={false} />
          )}
        </div>
      )}
    </Panel>
  );
}

function EvidenceGroup({
  label,
  items,
  used,
}: {
  label: string;
  items: RepoEvidenceItem[];
  used: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.technology}
            title={item.proofs.map((p) => p.detail).join("\n")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
              used
                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
            }`}
          >
            {used && <BadgeCheck className="h-3 w-3" />}
            {item.technology}
          </span>
        ))}
      </div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>
  );
}

function SectionHead({ icon: Icon, title }: { icon: typeof Code2; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">None detected</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ChipCard({
  icon,
  title,
  items,
}: {
  icon: typeof Code2;
  title: string;
  items: string[];
}) {
  return (
    <Panel className="p-5">
      <SectionHead icon={icon} title={title} />
      <Chips items={items} />
    </Panel>
  );
}

function TextCard({ icon, title, body }: { icon: typeof Code2; title: string; body: string }) {
  if (!body) return null;
  return (
    <Panel className="p-5">
      <SectionHead icon={icon} title={title} />
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{body}</p>
    </Panel>
  );
}

function ListCard({
  icon,
  title,
  items,
  tone,
}: {
  icon: typeof Code2;
  title: string;
  items: string[];
  tone: "warn" | "tip";
}) {
  if (items.length === 0) return null;
  const dot = tone === "warn" ? "bg-amber-500" : "bg-primary";
  return (
    <Panel className="p-5">
      <SectionHead icon={icon} title={title} />
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ReportView({
  report,
  model,
  updatedAt,
}: {
  report: AnalysisReport;
  model: string | null;
  updatedAt: string;
}) {
  return (
    <div className="space-y-4">
      {/* Hero summary */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <h2 className="text-lg font-semibold">What this project does</h2>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed">{report.summary}</p>
        <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Why this complexity — </span>
          {report.complexity.reasoning}
        </div>
      </div>

      {/* Tech grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ChipCard icon={Code2} title="Languages" items={report.languages} />
        <ChipCard icon={Boxes} title="Frameworks" items={report.frameworks} />
        <ChipCard icon={Database} title="Databases" items={report.databases} />
        <ChipCard icon={ShieldCheck} title="Authentication" items={report.authentication} />
        <ChipCard icon={Rocket} title="Deployment" items={report.deployment} />
        <ChipCard icon={Wrench} title="Build tools" items={report.buildTools} />
      </div>

      <ChipCard icon={Package} title="Notable libraries" items={report.thirdPartyLibraries} />

      <TextCard icon={FolderTree} title="Folder organization" body={report.folderStructure} />
      <TextCard icon={Network} title="API structure" body={report.apiStructure} />
      <TextCard icon={FlaskConical} title="Testing approach" body={report.testing} />

      <ListCard
        icon={TriangleAlert}
        title="Missing best practices"
        items={report.missingBestPractices}
        tone="warn"
      />
      <ListCard
        icon={Lightbulb}
        title="Suggested improvements"
        items={report.suggestedImprovements}
        tone="tip"
      />

      <p className="pt-1 text-center text-xs text-muted-foreground">
        Generated{model ? ` by ${model}` : ""} · {new Date(updatedAt).toLocaleString()}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium">No report yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Generate an engineering report for this repository — what it does, its stack, its
          complexity, and how to make it industry-ready.
        </p>
      </div>
    </Panel>
  );
}

function RunningState() {
  return (
    <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <div>
        <p className="font-medium">Analyzing the repository…</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reading the code structure and writing the report. This can take up to a minute.
        </p>
      </div>
    </Panel>
  );
}

function FailedState({ error }: { error: string | null }) {
  return (
    <Panel className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <TriangleAlert className="h-7 w-7 text-red-500" />
      <p className="font-medium text-red-500">Analysis failed</p>
      <p className="max-w-md text-sm text-muted-foreground">{error ?? "Please try again."}</p>
    </Panel>
  );
}

export default function RepositoryReportPage() {
  return (
    <ProtectedRoute>
      <ReportContent />
    </ProtectedRoute>
  );
}
