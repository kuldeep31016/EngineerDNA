import {
  authUserSchema,
  candidateProfileSchema,
  candidateSearchResultSchema,
  recruiterDashboardSchema,
  type AuthUser,
  type CandidateProfile,
  type CandidateSearchResult,
  type RecruiterDashboard,
  type SearchCandidatesInput,
  type SwitchRoleInput,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET — recruiter dashboard headline numbers. */
export async function getRecruiterDashboard(): Promise<RecruiterDashboard> {
  return recruiterDashboardSchema.parse(await apiFetch<unknown>("/recruiter/dashboard"));
}

/** POST — search verified candidates by required skills. */
export async function searchCandidates(input: SearchCandidatesInput): Promise<CandidateSearchResult> {
  return candidateSearchResultSchema.parse(
    await apiFetch<unknown>("/recruiter/search", { method: "POST", body: JSON.stringify(input) }),
  );
}

/** GET — a candidate's full verified profile. */
export async function getCandidate(id: string): Promise<CandidateProfile> {
  return candidateProfileSchema.parse(await apiFetch<unknown>(`/recruiter/candidates/${id}`));
}

/** GET — the recruiter's shortlisted candidates. */
export async function getShortlist(): Promise<CandidateSearchResult> {
  return candidateSearchResultSchema.parse(await apiFetch<unknown>("/recruiter/shortlist"));
}

export async function addShortlist(id: string): Promise<void> {
  await apiFetch(`/recruiter/shortlist/${id}`, { method: "POST" });
}

export async function removeShortlist(id: string): Promise<void> {
  await apiFetch(`/recruiter/shortlist/${id}`, { method: "DELETE" });
}

/** PATCH — switch between Student and Recruiter mode. */
export async function switchRole(role: SwitchRoleInput["role"]): Promise<AuthUser> {
  return authUserSchema.parse(
    await apiFetch<unknown>("/users/me/role", { method: "PATCH", body: JSON.stringify({ role }) }),
  );
}
