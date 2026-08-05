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

// ---------------------------------------------------------------------------
// Tailor Resume to a Job Description (AI-generated, EJS-rendered to HTML).
// ---------------------------------------------------------------------------

/** The user's saved resume — the default source for tailoring. */
export const savedResumeSchema = z.object({
  available: z.boolean(),
  fileName: z.string().nullable(),
  resumeText: z.string().nullable(),
  updatedAt: z.string().nullable(),
});
export type SavedResume = z.infer<typeof savedResumeSchema>;

/** Body for POST /resume/saved — persist a resume as the profile default. */
export const saveResumeRequestSchema = z.object({
  resumeText: z.string().trim().min(30).max(40000),
  fileName: z.string().trim().min(1).max(255).optional(),
});
export type SaveResumeInput = z.infer<typeof saveResumeRequestSchema>;

/** Body for POST /resume/tailor — a resume plus a job description. */
export const tailorResumeRequestSchema = z.object({
  resumeText: z.string().trim().min(30).max(40000),
  jdText: z.string().trim().min(20).max(50000),
});
export type TailorResumeInput = z.infer<typeof tailorResumeRequestSchema>;

/** The structured resume the LLM returns; EJS renders it to a document. */
export const tailoredResumeDataSchema = z.object({
  contact: z.object({
    name: z.string().default(""),
    title: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    website: z.string().default(""),
    github: z.string().default(""),
    linkedin: z.string().default(""),
  }),
  summary: z.string().default(""),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        role: z.string().default(""),
        company: z.string().default(""),
        location: z.string().default(""),
        startDate: z.string().default(""),
        endDate: z.string().default(""),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string().default(""),
        degree: z.string().default(""),
        startYear: z.string().default(""),
        endYear: z.string().default(""),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        url: z.string().default(""),
        description: z.string().default(""),
        technologies: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  certifications: z.array(z.string()).default([]),
});
export type TailoredResumeData = z.infer<typeof tailoredResumeDataSchema>;

/** Response of POST /resume/tailor — structured data + rendered HTML. */
export const tailorResumeResponseSchema = z.object({
  available: z.boolean(),
  data: tailoredResumeDataSchema,
  html: z.string(),
  generatedAt: z.string(),
});
export type TailorResumeResponse = z.infer<typeof tailorResumeResponseSchema>;
