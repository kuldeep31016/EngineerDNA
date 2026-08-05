import {
  resumeReviewSchema,
  savedResumeSchema,
  tailorResumeResponseSchema,
  type ResumeReview,
  type ReviewResumeInput,
  type SavedResume,
  type SaveResumeInput,
  type TailorResumeInput,
  type TailorResumeResponse,
} from "@engineerdna/shared";
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

/** GET — the user's saved resume (the default source for tailoring). */
export async function getSavedResume(): Promise<SavedResume> {
  return savedResumeSchema.parse(await apiFetch<unknown>("/resume/saved"));
}

/** POST — persist a resume as the user's profile default. */
export async function saveResume(input: SaveResumeInput): Promise<SavedResume> {
  return savedResumeSchema.parse(
    await apiFetch<unknown>("/resume/saved", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

/** POST — tailor a resume to a job description (AI, returns rendered HTML). */
export async function tailorResume(input: TailorResumeInput): Promise<TailorResumeResponse> {
  return tailorResumeResponseSchema.parse(
    await apiFetch<unknown>("/resume/tailor", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}
