import {
  profileSchema,
  type AddSkillInput,
  type Profile,
  type UpdateProfileInput,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /profile/me — the caller's passport, validated against the contract. */
export async function getProfile(): Promise<Profile> {
  return profileSchema.parse(await apiFetch<unknown>("/profile/me"));
}

/** PATCH /profile/me — update core fields and/or content sections. */
export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  return profileSchema.parse(
    await apiFetch<unknown>("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

/** POST /profile/me/skills — add a self-claimed skill. */
export async function addSkill(input: AddSkillInput): Promise<Profile> {
  return profileSchema.parse(
    await apiFetch<unknown>("/profile/me/skills", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

/** DELETE /profile/me/skills/:id — remove a skill. */
export async function removeSkill(id: string): Promise<Profile> {
  return profileSchema.parse(
    await apiFetch<unknown>(`/profile/me/skills/${id}`, { method: "DELETE" }),
  );
}
