import { resumeReviewSchema, type ResumeReview, type ReviewResumeInput } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET — the latest resume review (available:false if none yet). */
export async function getResumeReview(): Promise<ResumeReview> {
  return resumeReviewSchema.parse(await apiFetch<unknown>("/resume/review"));
}

/** POST — review a resume against verified evidence and DNA. */
export async function reviewResume(input: ReviewResumeInput): Promise<ResumeReview> {
  return resumeReviewSchema.parse(
    await apiFetch<unknown>("/resume/review", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}
