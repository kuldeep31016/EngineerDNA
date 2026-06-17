"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile, UpdateProfileInput } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PassportHeader } from "@/components/passport/PassportHeader";
import { EditProfileDialog } from "@/components/passport/EditProfileDialog";
import { SkillsCard } from "@/components/passport/SkillsCard";
import { EditableListSection } from "@/components/passport/EditableListSection";
import { FutureModulesCard } from "@/components/passport/FutureModulesCard";
import {
  getProfile,
  updateProfile,
  addSkill as addSkillRequest,
  removeSkill as removeSkillRequest,
} from "@/services/profile";

// Cast helper: the generic section editor works in plain string records.
type Rec = Record<string, string>;
const asRecords = (items: unknown[]) => items as Rec[];

function PassportContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void getProfile().then(setProfile);
  }, []);

  const patch = useCallback(async (input: UpdateProfileInput) => {
    setProfile(await updateProfile(input));
  }, []);

  if (!profile) return <LoadingScreen label="Loading your passport…" />;

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-6 py-8">
      <PassportHeader profile={profile} onEdit={() => setEditing(true)} />

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.about ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.about}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tell people who you are as an engineer. Use “Edit” above.
            </p>
          )}
        </CardContent>
      </Card>

      <SkillsCard
        skills={profile.skills}
        onAdd={async (name) => setProfile(await addSkillRequest({ name }))}
        onRemove={async (id) => setProfile(await removeSkillRequest(id))}
      />

      <EditableListSection
        title="Experience"
        emptyHint="Add roles, internships, or freelance work."
        primaryKey="company"
        secondaryKeys={["role", "startDate", "endDate"]}
        bodyKey="description"
        fields={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "startDate", label: "Start", placeholder: "Jan 2024" },
          { key: "endDate", label: "End", placeholder: "Present" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        items={asRecords(profile.experience)}
        onChange={(items) => patch({ experience: items as Profile["experience"] })}
      />

      <EditableListSection
        title="Education"
        emptyHint="Add your degrees and schools."
        primaryKey="school"
        secondaryKeys={["degree", "fieldOfStudy", "startYear", "endYear"]}
        bodyKey="description"
        fields={[
          { key: "school", label: "School" },
          { key: "degree", label: "Degree" },
          { key: "fieldOfStudy", label: "Field of study" },
          { key: "startYear", label: "Start year" },
          { key: "endYear", label: "End year" },
          { key: "description", label: "Notes", type: "textarea" },
        ]}
        items={asRecords(profile.education)}
        onChange={(items) => patch({ education: items as Profile["education"] })}
      />

      <EditableListSection
        title="Projects"
        emptyHint="Showcase what you’ve built."
        primaryKey="name"
        secondaryKeys={["technologies", "url"]}
        bodyKey="description"
        fields={[
          { key: "name", label: "Project name" },
          { key: "technologies", label: "Technologies", placeholder: "Next.js, Postgres" },
          { key: "url", label: "Link" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        items={asRecords(profile.projects)}
        onChange={(items) => patch({ projects: items as Profile["projects"] })}
      />

      <EditableListSection
        title="Certifications"
        emptyHint="Add relevant certifications."
        primaryKey="name"
        secondaryKeys={["issuer", "issueDate"]}
        fields={[
          { key: "name", label: "Certification" },
          { key: "issuer", label: "Issuer" },
          { key: "issueDate", label: "Issued" },
          { key: "url", label: "Credential URL" },
        ]}
        items={asRecords(profile.certifications)}
        onChange={(items) => patch({ certifications: items as Profile["certifications"] })}
      />

      <EditableListSection
        title="Achievements"
        emptyHint="Hackathons, awards, milestones."
        primaryKey="title"
        secondaryKeys={["date"]}
        bodyKey="description"
        fields={[
          { key: "title", label: "Achievement" },
          { key: "date", label: "Date" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        items={asRecords(profile.achievements)}
        onChange={(items) => patch({ achievements: items as Profile["achievements"] })}
      />

      <FutureModulesCard />

      <EditProfileDialog
        open={editing}
        onClose={() => setEditing(false)}
        profile={profile}
        onSave={patch}
      />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <PassportContent />
    </ProtectedRoute>
  );
}
