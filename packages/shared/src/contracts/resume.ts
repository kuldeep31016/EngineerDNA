import { z } from "zod";

/**
 * Module 12 — Resume Intelligence. An AI resume reviewer that compares the
 * candidate's resume against their VERIFIED evidence and DNA: it flags claims
 * not backed by evidence, proven skills the resume omits, inconsistencies, ATS
 * problems, and rewrites weak bullets — truthfully, never inventing experience.
 */

/** A weak resume bullet rewritten more strongly (still truthful). */
export const resumeRewriteSchema = z.object({
  section: z.string(),
  original: z.string(),
  improved: z.string(),
});
export type ResumeRewrite = z.infer<typeof resumeRewriteSchema>;

export const resumeReviewSchema = z.object({
  available: z.boolean(),
  atsScore: z.number(),
  engineeringScore: z.number(),
  summary: z.string(),
  strengths: z.array(z.string()),
  /** Skills/claims in the resume NOT backed by verified evidence. */
  claimedNotVerified: z.array(z.string()),
  /** Technologies the candidate has clearly USED but the resume under-sells. */
  verifiedNotHighlighted: z.array(z.string()),
  inconsistencies: z.array(z.string()),
  atsIssues: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  rewrites: z.array(resumeRewriteSchema),
  structure: z.array(z.string()),
  generatedAt: z.string(),
});
export type ResumeReview = z.infer<typeof resumeReviewSchema>;

/** Request body when submitting a resume for review. */
export const reviewResumeRequestSchema = z.object({
  resumeText: z.string().trim().min(30).max(20000),
});
export type ReviewResumeInput = z.infer<typeof reviewResumeRequestSchema>;
