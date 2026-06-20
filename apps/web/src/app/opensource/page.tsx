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
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import {
  OSS_LANGUAGES,
  OSS_LICENSES,
  OSS_SORTS,
  OSS_STAR_TIERS,
  OSS_TOPICS,
  type OssDifficulty,
  type OssRecommendation,
  type OssRepo,
  type OssSearchInput,
  type OssSearchResult,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getOssRecommendations, peekOssRecommendations, searchOss } from "@/services/oss";
import { getGithubStatus } from "@/services/github";

const DIFF: Record<OssDifficulty, string> = {
  beginner: "bg-emerald-500/15 text-emerald-300",
  intermediate: "bg-amber-500/15 text-amber-300",
  advanced: "bg-rose-500/15 text-rose-300",
};

function OssContent() {
  // Seed from the client cache so returning to this page is instant and makes
  // no API call (only the first visit, a Refresh, or filters hit the network).
  const [data, setData] = useState<OssRecommendation | null>(() => peekOssRecommendations());
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"matched" | "explore">("matched");
  const [lang, setLang] = useState<string | null>(null); // language filter on matched repos

  useEffect(() => {
    if (data) return; // already have cached data — no fetch
    void getOssRecommendations().then(setData).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {data.available && view === "matched" && (
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

      {/* View toggle — your matched repos, or browse curated good-first-issue lists. */}
      <div className="mt-5 inline-flex rounded-lg border border-border bg-card p-1 text-sm">
        <button
          onClick={() => setView("matched")}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${view === "matched" ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Matched to you
        </button>
        <button
          onClick={() => setView("explore")}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${view === "explore" ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Explore by filters
        </button>
      </div>

      {view === "explore" ? (
        <ExploreView />
      ) : !data.available ? (
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

          {/* Language filter over the matched repos. */}
          {(() => {
            const langs = [...new Set(data.repos.map((r) => r.language).filter(Boolean) as string[])].sort();
            if (langs.length < 2) return null;
            return (
              <div className="flex flex-wrap items-center gap-1.5">
                <FilterChip active={lang === null} onClick={() => setLang(null)}>All</FilterChip>
                {langs.map((l) => (
                  <FilterChip key={l} active={lang === l} onClick={() => setLang(l)}>{l}</FilterChip>
                ))}
              </div>
            );
          })()}

          {(() => {
            const shown = lang ? data.repos.filter((r) => r.language === lang) : data.repos;
            if (shown.length === 0) {
              return (
                <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
                  <Github className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {data.repos.length === 0
                      ? "No beginner-friendly repos found right now — try Refresh, or build evidence for more skills."
                      : "No repos for that language — pick another."}
                  </p>
                </div>
              );
            }
            return shown.map((repo) => (
              <RepoCard key={repo.fullName} repo={repo} open={open.has(repo.fullName)} onToggle={() => toggle(repo.fullName)} />
            ));
          })()}
        </div>
      )}
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Browse curated good-first-issue lists by language (goodfirstissue.dev).
 * Pure deep links — no scraping, no API calls. The user's own matched skills
 * are highlighted first so the most relevant languages are one click away.
 */
/* ---------------- Explore: filter-driven GitHub search ---------------- */

const selectCls =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary/60";

function ExploreView() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [filters, setFilters] = useState<OssSearchInput>({ sort: "stars" });
  const [result, setResult] = useState<OssSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    getGithubStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
  }, []);

  const set = <K extends keyof OssSearchInput>(k: K, v: OssSearchInput[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));
  const toggle = (k: "goodFirstIssue" | "helpWanted" | "recentlyUpdated") =>
    setFilters((f) => ({ ...f, [k]: !f[k] }));

  async function run() {
    setLoading(true);
    try {
      setResult(await searchOss(filters));
    } catch {
      setResult({ repos: [], total: 0, query: "", cached: false });
    } finally {
      setLoading(false);
    }
  }

  if (connected === false) {
    return <Empty reason="Connect your GitHub account to explore repositories." />;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={selectCls} value={filters.language ?? ""} onChange={(e) => set("language", e.target.value || undefined)}>
            <option value="">Any language</option>
            {OSS_LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select className={selectCls} value={filters.topic ?? ""} onChange={(e) => set("topic", e.target.value || undefined)}>
            <option value="">Any topic</option>
            {OSS_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className={selectCls}
            value={filters.minStars ?? ""}
            onChange={(e) => set("minStars", e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Any stars</option>
            {OSS_STAR_TIERS.map((s) => (
              <option key={s} value={s}>{s.toLocaleString()}+ stars</option>
            ))}
          </select>
          <select className={selectCls} value={filters.license ?? ""} onChange={(e) => set("license", e.target.value || undefined)}>
            <option value="">Any license</option>
            {OSS_LICENSES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <select className={selectCls} value={filters.sort} onChange={(e) => set("sort", e.target.value as OssSearchInput["sort"])}>
            {OSS_SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(
            [
              ["goodFirstIssue", "Good first issues"],
              ["helpWanted", "Help wanted"],
              ["recentlyUpdated", "Recently updated"],
            ] as const
          ).map(([k, label]) => (
            <FilterChip key={k} active={Boolean(filters[k])} onClick={() => toggle(k)}>
              {label}
            </FilterChip>
          ))}
          <button
            onClick={run}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          <p className="text-xs text-muted-foreground">
            {result.total} repositories · <code className="rounded bg-secondary/50 px-1.5 py-0.5">{result.query}</code>
            {result.cached && <span className="ml-2 text-emerald-400">cached</span>}
          </p>
          {result.repos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
              No repositories match these filters — loosen them and try again.
            </div>
          ) : (
            result.repos.map((repo) => (
              <RepoCard
                key={repo.fullName}
                repo={repo}
                open={open.has(repo.fullName)}
                onToggle={() =>
                  setOpen((prev) => {
                    const next = new Set(prev);
                    if (next.has(repo.fullName)) next.delete(repo.fullName);
                    else next.add(repo.fullName);
                    return next;
                  })
                }
              />
            ))
          )}
        </>
      )}
      {!result && !loading && (
        <p className="text-sm text-muted-foreground">
          Pick filters above and hit Search — results are matched on GitHub and cached, so they load fast.
        </p>
      )}
    </div>
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
