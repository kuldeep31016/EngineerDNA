import {
  candidateSearchResultSchema,
  jobPostSchema,
  type CandidateSearchResult,
  type CreateJobInput,
  type JobPost,
  type UpdateJobInput,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET — the recruiter's job posts. */
export async function listJobs(): Promise<JobPost[]> {
  const data = await apiFetch<unknown[]>("/recruiter/jobs");
  return (data ?? []).map((d) => jobPostSchema.parse(d));
}

/** POST — create a job post. */
export async function createJob(input: CreateJobInput): Promise<JobPost> {
  return jobPostSchema.parse(
    await apiFetch<unknown>("/recruiter/jobs", { method: "POST", body: JSON.stringify(input) }),
  );
}

/** PATCH — update a job post (fields and/or status). */
export async function updateJob(id: string, input: UpdateJobInput): Promise<JobPost> {
  return jobPostSchema.parse(
    await apiFetch<unknown>(`/recruiter/jobs/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  );
}

/** DELETE — remove a job post. */
export async function deleteJob(id: string): Promise<void> {
  await apiFetch(`/recruiter/jobs/${id}`, { method: "DELETE" });
}

/** GET — verified candidates matching a job's required skills. */
export async function getJobMatches(id: string): Promise<CandidateSearchResult> {
  return candidateSearchResultSchema.parse(await apiFetch<unknown>(`/recruiter/jobs/${id}/matches`));
}
