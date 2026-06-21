import {
  authUserSchema,
  candidateProfileSchema,
  candidateSearchResultSchema,
  recruiterAnalyticsSchema,
  recruiterDashboardSchema,
  recruiterNoteSchema,
  type AuthUser,
  type CandidateProfile,
  type CandidateSearchResult,
  type RecruiterAnalytics,
  type RecruiterDashboard,
  type RecruiterNote,
  type SearchCandidatesInput,
  type SwitchRoleInput,
  type UpsertRecruiterNoteInput,
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

/** GET — aggregated hiring funnel + conversion analytics across all jobs. */
export async function getRecruiterAnalytics(): Promise<RecruiterAnalytics> {
  return recruiterAnalyticsSchema.parse(await apiFetch<unknown>("/recruiter/analytics"));
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

/** GET — the recruiter's private note + rating on a candidate (null if none). */
export async function getCandidateNote(id: string): Promise<RecruiterNote | null> {
  const data = await apiFetch<unknown>(`/recruiter/candidates/${id}/note`);
  return data ? recruiterNoteSchema.parse(data) : null;
}

/** PUT — create or update the recruiter's private note + rating. */
export async function saveCandidateNote(id: string, input: UpsertRecruiterNoteInput): Promise<RecruiterNote> {
  return recruiterNoteSchema.parse(
    await apiFetch<unknown>(`/recruiter/candidates/${id}/note`, { method: "PUT", body: JSON.stringify(input) }),
  );
}

/** PATCH — switch between Student and Recruiter mode. */
export async function switchRole(role: SwitchRoleInput["role"]): Promise<AuthUser> {
  return authUserSchema.parse(
    await apiFetch<unknown>("/users/me/role", { method: "PATCH", body: JSON.stringify({ role }) }),
  );
}
