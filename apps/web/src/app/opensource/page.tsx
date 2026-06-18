"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  GitPullRequest,
  Github,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";
import type { OssDifficulty, OssRecommendation, OssRepo } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getOssRecommendations } from "@/services/oss";

const DIFF: Record<OssDifficulty, string> = {
  beginner: "bg-emerald-500/15 text-emerald-300",
  intermediate: "bg-amber-500/15 text-amber-300",
  advanced: "bg-rose-500/15 text-rose-300",
};

function OssContent() {
  const [data, setData] = useState<OssRecommendation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    void getOssRecommendations().then(setData).catch(() => {});
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      setData(await getOssRecommendations(true));
    } catch {
      // keep current
    } finally {
      setRefreshing(false);
    }
  }

  function toggle(name: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (!data) return <LoadingScreen label="Finding good first issues…" />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GitPullRequest className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Open Source</h1>
          <p className="text-sm text-muted-foreground">
            Real repos and good first issues matched to your verified skills.
          </p>
        </div>
        {data.available && (
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        )}
      </div>

      {!data.available ? (
        <Empty reason={data.reason} />
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Matched to:</span>
            {data.skills.map((s) => (
              <span key={s} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {s}
              </span>
            ))}
          </div>

          {data.repos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
              <Github className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No beginner-friendly repos found right now — try Refresh, or build evidence for more skills.
              </p>
            </div>
          ) : (
            data.repos.map((repo) => (
              <RepoCard key={repo.fullName} repo={repo} open={open.has(repo.fullName)} onToggle={() => toggle(repo.fullName)} />
            ))
          )}
        </div>
      )}
    </main>
  );
}

function RepoCard({ repo, open, onToggle }: { repo: OssRepo; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold hover:text-primary"
          >
            <Github className="h-4 w-4 shrink-0" />
            <span className="truncate">{repo.fullName}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
          </a>
          {repo.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{repo.description}</p>}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-3.5 w-3.5" /> {repo.stars.toLocaleString()}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {repo.language && <span>{repo.language}</span>}
        <span className="flex items-center gap-1 text-primary">
          <Sparkles className="h-3 w-3" /> matches {repo.matchedSkill}
        </span>
        {repo.goodFirstIssues > 0 && <span>· {repo.goodFirstIssues} good first issues</span>}
      </div>

      {repo.topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {repo.topics.map((t) => (
            <span key={t} className="rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {repo.issues.length > 0 && (
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {repo.issues.length} good first {repo.issues.length === 1 ? "issue" : "issues"}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
        <a
          href={repo.contributeUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Start contributing <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {open && repo.issues.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-border pt-3">
          {repo.issues.map((issue) => (
            <li key={issue.url}>
              <a
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 text-sm transition-colors hover:text-primary"
              >
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${DIFF[issue.difficulty]}`}>
                  {issue.difficulty}
                </span>
                <span className="leading-relaxed">{issue.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ reason }: { reason: string | null }) {
  const needsGithub = reason?.toLowerCase().includes("connect");
  return (
    <div className="mt-6 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <GitPullRequest className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">{needsGithub ? "Connect GitHub" : "Build your evidence first"}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {reason ?? "We match open-source repositories to your verified skills."}
      </p>
      <Link
        href="/repositories"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <Github className="h-4 w-4" /> Go to Repositories
      </Link>
    </div>
  );
}

export default function OpenSourcePage() {
  return (
    <ProtectedRoute>
      <OssContent />
    </ProtectedRoute>
  );
}
