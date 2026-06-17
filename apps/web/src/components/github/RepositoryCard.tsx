"use client";

import Link from "next/link";
import { FileText, GitFork, Globe, Lock, Star } from "lucide-react";
import type { Repository } from "@engineerdna/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** A single repository row with a "select for analysis" checkbox. */
export function RepositoryCard({
  repo,
  onToggle,
}: {
  repo: Repository;
  onToggle: (selected: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 transition-colors",
        repo.selectedForAnalysis ? "border-primary bg-primary/5" : "border-border bg-card",
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={repo.selectedForAnalysis}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`Select ${repo.name} for analysis`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-medium hover:underline"
          >
            {repo.name}
          </a>
          <Badge variant="outline">
            {repo.isPrivate ? (
              <>
                <Lock className="h-3 w-3" /> Private
              </>
            ) : (
              <>
                <Globe className="h-3 w-3" /> Public
              </>
            )}
          </Badge>
        </div>

        {repo.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{repo.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" /> {repo.forks}
          </span>
          {repo.pushedAt && <span>Updated {new Date(repo.pushedAt).toLocaleDateString()}</span>}
        </div>
      </div>

      <Link
        href={`/repositories/${repo.id}`}
        className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
      >
        <FileText className="h-3.5 w-3.5" /> Report
      </Link>
    </div>
  );
}
