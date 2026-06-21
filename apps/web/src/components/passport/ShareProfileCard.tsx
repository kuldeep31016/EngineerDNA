"use client";

import { useState } from "react";
import { BadgeCheck, Check, Copy, ExternalLink } from "lucide-react";
import type { Profile } from "@engineerdna/shared";
import { badgeUrl } from "@/services/public-profile";

/** Surfaces the shareable public verified profile + the embeddable badge. */
export function ShareProfileCard({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  // Not set up yet → prompt to claim a handle + go public.
  if (!profile.username || !profile.isPublic) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Get your shareable verified profile</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {!profile.username
                ? "Claim a username and turn on a public profile to get a link + badge you can put on LinkedIn, your resume, or your GitHub README."
                : "Turn on “Public profile” so recruiters can open your verified link."}
            </p>
            <button
              onClick={onEdit}
              className="mt-3 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {!profile.username ? "Claim your username" : "Make profile public"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const profileUrl = `${origin}/u/${profile.username}`;
  const badge = badgeUrl(profile.username);
  const markdown = `[![EngineerDNA Verified](${badge})](${profileUrl})`;
  const html = `<a href="${profileUrl}"><img src="${badge}" alt="EngineerDNA Verified" /></a>`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <BadgeCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Your verified profile is live</p>
          <p className="text-xs text-muted-foreground">Share it anywhere — it&apos;s proof, not claims.</p>
        </div>
      </div>

      {/* Public link */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
        <a href={profileUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-primary hover:underline">
          {profileUrl}
        </a>
        <button onClick={() => copy("url", profileUrl)} title="Copy link" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          {copied === "url" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
        <a href={profileUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Badge preview */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Verification badge</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badge} alt="EngineerDNA Verified badge" className="h-5" />
      </div>

      {/* Embed snippets */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <EmbedRow label="Markdown (GitHub README)" value={markdown} copied={copied === "md"} onCopy={() => copy("md", markdown)} />
        <EmbedRow label="HTML (website)" value={html} copied={copied === "html"} onCopy={() => copy("html", html)} />
      </div>
    </div>
  );
}

function EmbedRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="block truncate font-mono text-[11px] text-muted-foreground">{value}</code>
    </div>
  );
}
