"use client";

import { useState } from "react";
import type { Profile, UpdateProfileInput } from "@engineerdna/shared";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/** Edits the passport's core fields (everything except list sections + skills). */
export function EditProfileDialog({
  open,
  onClose,
  profile,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (input: UpdateProfileInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<UpdateProfileInput>({
    headline: profile.headline ?? "",
    about: profile.about ?? "",
    location: profile.location ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    githubUsername: profile.githubUsername ?? "",
    leetcodeUsername: profile.leetcodeUsername ?? "",
    codeforcesUsername: profile.codeforcesUsername ?? "",
    college: profile.college ?? "",
    experienceYears: profile.experienceYears ?? null,
    availability: profile.availability ?? "",
    expectedSalary: profile.expectedSalary ?? "",
    openToWork: profile.openToWork,
    isPublic: profile.isPublic,
  });
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<UpdateProfileInput>) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    setBusy(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const text = [
    { key: "headline", label: "Professional headline", ph: "Backend engineer · distributed systems" },
    { key: "location", label: "Location", ph: "Bengaluru, India" },
    { key: "websiteUrl", label: "Portfolio / website", ph: "https://…" },
    { key: "githubUsername", label: "GitHub username", ph: "octocat" },
    { key: "leetcodeUsername", label: "LeetCode username", ph: "" },
    { key: "codeforcesUsername", label: "Codeforces username", ph: "" },
    { key: "college", label: "College / University", ph: "IIT Bombay" },
    { key: "availability", label: "Availability", ph: "Immediately · 1 month · Open to offers" },
    { key: "expectedSalary", label: "Expected salary", ph: "₹12–15 LPA" },
  ] as const;

  return (
    <Dialog open={open} onClose={onClose} title="Edit profile">
      <div className="space-y-4">
        <div>
          <Label htmlFor="about">About</Label>
          <Textarea
            id="about"
            className="min-h-[120px]"
            placeholder="A short summary of who you are as an engineer."
            value={draft.about ?? ""}
            onChange={(e) => set({ about: e.target.value })}
          />
        </div>

        {text.map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              placeholder={f.ph}
              value={(draft[f.key] as string | undefined) ?? ""}
              onChange={(e) => set({ [f.key]: e.target.value } as Partial<UpdateProfileInput>)}
            />
          </div>
        ))}

        <div>
          <Label htmlFor="experienceYears">Years of experience</Label>
          <Input
            id="experienceYears"
            type="number"
            min={0}
            max={60}
            placeholder="2"
            value={draft.experienceYears ?? ""}
            onChange={(e) => set({ experienceYears: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.openToWork ?? false}
            onChange={(e) => set({ openToWork: e.target.checked })}
          />
          Open to work
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isPublic ?? false}
            onChange={(e) => set({ isPublic: e.target.checked })}
          />
          Make my passport public
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
