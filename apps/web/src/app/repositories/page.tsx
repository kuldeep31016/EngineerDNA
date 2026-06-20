"use client";

import { useCallback, useEffect, useState } from "react";
import { Github, RefreshCw } from "lucide-react";
import type { GithubStatus, Repository } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { RepositoryCard } from "@/components/github/RepositoryCard";
import {
  disconnectGithub,
  getGithubStatus,
  githubConnectUrl,
  listRepositories,
  setRepositorySelection,
  syncRepositories,
} from "@/services/github";

function RepositoriesContent() {
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const paged = usePagination(repos, 10);

  const load = useCallback(async () => {
    const s = await getGithubStatus();
    setStatus(s);
    if (s.connected) setRepos(await listRepositories());
  }, []);

  // Surface the connect-flow result (?connected / ?error) then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) setNotice("GitHub connected.");
    else if (params.get("error")) setNotice("Could not connect GitHub. Please try again.");
    if (params.has("connected") || params.has("error")) {
      window.history.replaceState({}, "", "/repositories");
    }
    void load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      setRepos(await syncRepositories());
      setStatus(await getGithubStatus());
    } finally {
      setSyncing(false);
    }
  };

  const toggle = async (id: string, selected: boolean) => {
    const updated = await setRepositorySelection(id, selected);
    setRepos((prev) => prev.map((r) => (r.id === id ? updated : r)));
    setStatus(await getGithubStatus());
  };

  const disconnect = async () => {
    await disconnectGithub();
    setRepos([]);
    setStatus(await getGithubStatus());
  };

  if (!status) return <LoadingScreen label="Checking GitHub connection…" />;

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Repositories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect GitHub and choose which repositories EngineerDNA may analyze.
        </p>
      </div>

      {notice && (
        <div className="rounded-lg border border-border bg-muted px-4 py-2 text-sm">{notice}</div>
      )}

      {!status.connected ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Github className="h-10 w-10" />
            <div>
              <h2 className="font-semibold">Connect your GitHub account</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                We’ll import your repositories so you can pick which ones to analyze. You can
                include private repositories and disconnect at any time.
              </p>
            </div>
            <a href={githubConnectUrl()}>
              <Button>
                <Github className="h-4 w-4" /> Connect GitHub
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="text-sm">
              <span className="font-medium">@{status.githubLogin}</span>
              <span className="text-muted-foreground">
                {" "}
                · {status.repositoryCount} repos · {status.selectedCount} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing…" : "Sync"}
              </Button>
              <Button variant="ghost" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          </div>

          {status.githubLogin && <GithubStatsCard login={status.githubLogin} />}

          {repos.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No repositories imported yet. Click <span className="font-medium">Sync</span> to
                import them from GitHub.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {paged.pageItems.map((repo) => (
                <RepositoryCard key={repo.id} repo={repo} onToggle={(sel) => toggle(repo.id, sel)} />
              ))}
              <Pagination
                page={paged.page}
                totalPages={paged.totalPages}
                onPageChange={paged.setPage}
                from={paged.from}
                to={paged.to}
                total={paged.total}
                label="repositories"
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}

/**
 * GitHub language breakdown across the user's commits — rendered by the free,
 * open-source github-readme-stats service (themed to match the app). Read-only
 * insight into where the developer actually spends their coding time.
 */
function GithubStatsCard({ login }: { login: string }) {
  const base = "https://github-readme-stats.vercel.app/api/top-langs/";
  const q = new URLSearchParams({
    username: login,
    layout: "compact",
    include_all_commits: "true",
    count_private: "false",
    hide_border: "true",
    bg_color: "00000000", // transparent — sits on our dark card
    title_color: "8B5CF6",
    text_color: "A1A1AA",
    langs_count: "8",
  });
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-semibold">Most-used languages (from your commits)</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}?${q.toString()}`}
        alt={`Top languages for @${login}`}
        className="w-full max-w-md"
        loading="lazy"
      />
    </div>
  );
}

export default function RepositoriesPage() {
  return (
    <ProtectedRoute>
      <RepositoriesContent />
    </ProtectedRoute>
  );
}
