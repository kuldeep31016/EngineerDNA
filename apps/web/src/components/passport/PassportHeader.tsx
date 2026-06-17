"use client";

import { Github, Globe, MapPin, Pencil } from "lucide-react";
import type { Profile } from "@engineerdna/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Top of the passport: identity, headline, location, external handles. */
export function PassportHeader({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
  const { user } = profile;
  const handles = [
    profile.githubUsername && {
      icon: <Github className="h-3.5 w-3.5" />,
      label: profile.githubUsername,
      href: `https://github.com/${profile.githubUsername}`,
    },
    profile.leetcodeUsername && {
      icon: <span className="text-xs font-bold">LC</span>,
      label: profile.leetcodeUsername,
      href: `https://leetcode.com/${profile.leetcodeUsername}`,
    },
    profile.codeforcesUsername && {
      icon: <span className="text-xs font-bold">CF</span>,
      label: profile.codeforcesUsername,
      href: `https://codeforces.com/profile/${profile.codeforcesUsername}`,
    },
    profile.websiteUrl && {
      icon: <Globe className="h-3.5 w-3.5" />,
      label: "Portfolio",
      href: profile.websiteUrl,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; href: string }[];

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {user.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profileImage}
            alt={user.name ?? "avatar"}
            className="h-20 w-20 rounded-2xl border border-border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-muted text-2xl font-semibold">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name ?? "Unnamed developer"}
            </h1>
            {profile.openToWork && <Badge variant="verified">Open to work</Badge>}
          </div>
          <p className="mt-0.5 text-muted-foreground">
            {profile.headline ?? "Add a professional headline"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {profile.location}
              </span>
            )}
            {handles.map((h) => (
              <a
                key={h.href}
                href={h.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                {h.icon} {h.label}
              </a>
            ))}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </CardContent>
    </Card>
  );
}
