"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, Plus, X } from "lucide-react";
import type { Skill, VerifiedSkill } from "@engineerdna/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Skills are self-added (shown as "Claimed"). "Verify against evidence" checks
 * each one against the repository evidence (Module 6/7) and flips proven skills
 * to "Verified", with the proof available on hover.
 */
export function SkillsCard({
  skills,
  onAdd,
  onRemove,
  onVerify,
}: {
  skills: Skill[];
  onAdd: (name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onVerify: () => Promise<VerifiedSkill[]>;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<Map<string, VerifiedSkill> | null>(null);

  const submit = async () => {
    const name = value.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await onAdd(name);
      setValue("");
      setVerified(null); // stale after adding a skill
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const result = await onVerify();
      setVerified(new Map(result.map((v) => [v.id, v])));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        {skills.length > 0 && (
          <Button variant="outline" size="sm" onClick={verify} disabled={verifying}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            Verify against evidence
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Add a skill (e.g. Docker)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Button onClick={submit} disabled={busy}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No skills yet. Add the technologies you work with — we’ll verify them from your
            repositories.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              const v = verified?.get(skill.id);
              const status = v?.status ?? skill.status;
              const isVerified = status === "VERIFIED";
              const tooltip = v?.evidence
                ? `Used in ${v.evidence.repositoryCount} repo(s): ${v.evidence.repositories.join(", ")}`
                : undefined;
              return (
                <Badge
                  key={skill.id}
                  variant={isVerified ? "verified" : "claimed"}
                  title={tooltip}
                >
                  {isVerified && <BadgeCheck className="h-3 w-3" />}
                  {skill.name}
                  <span className="ml-1 opacity-70">{isVerified ? "verified" : "claimed"}</span>
                  <button
                    onClick={() => onRemove(skill.id)}
                    className="ml-1 rounded-full hover:bg-black/20"
                    aria-label={`Remove ${skill.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {verified && (
          <p className="mt-3 text-xs text-muted-foreground">
            {[...verified.values()].filter((v) => v.status === "VERIFIED").length} verified ·{" "}
            {[...verified.values()].filter((v) => v.status !== "VERIFIED").length} claimed. Hover a
            verified skill to see its proof.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
