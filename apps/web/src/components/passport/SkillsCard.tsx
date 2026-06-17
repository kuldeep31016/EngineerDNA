"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Skill } from "@engineerdna/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Skills are self-added today (shown as "Claimed"). A later module verifies
 * them against repository evidence and flips the badge to "Verified".
 */
export function SkillsCard({
  skills,
  onAdd,
  onRemove,
}: {
  skills: Skill[];
  onAdd: (name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const name = value.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await onAdd(name);
      setValue("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
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
            repositories later.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.id} variant={skill.status === "VERIFIED" ? "verified" : "claimed"}>
                {skill.name}
                <span className="ml-1 opacity-70">
                  {skill.status === "VERIFIED" ? "verified" : "claimed"}
                </span>
                <button
                  onClick={() => onRemove(skill.id)}
                  className="ml-1 rounded-full hover:bg-black/20"
                  aria-label={`Remove ${skill.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
