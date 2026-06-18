import { z } from "zod";
import { scoreSchema } from "./score";

/**
 * Module 14 — Recruiter Dashboard. Recruiters search VERIFIED candidate profiles
 * by engineering requirements (real USED evidence), never resumes and never
 * private repositories. Deterministic — no LLM.
 */

export const candidateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
  profileImage: z.string().nullable(),
  overall: z.number(),
  topStrengths: z.array(z.string()),
  verifiedSkillCount: z.number(),
  matchedSkills: z.array(z.string()),
  matchScore: z.number(),
  publicRepoCount: z.number(),
  shortlisted: z.boolean(),
});
export type CandidateSummary = z.infer<typeof candidateSummarySchema>;

export const candidateSkillSchema = z.object({
  technology: z.string(),
  category: z.string(),
  repositoryCount: z.number(),
});
export type CandidateSkill = z.infer<typeof candidateSkillSchema>;

export const candidateRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  htmlUrl: z.string(),
});
export type CandidateRepo = z.infer<typeof candidateRepoSchema>;

export const candidateProfileSchema = candidateSummarySchema.extend({
  scores: z.array(scoreSchema),
  verifiedSkills: z.array(candidateSkillSchema),
  topRepos: z.array(candidateRepoSchema),
});
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

export const searchCandidatesRequestSchema = z.object({
  skills: z.array(z.string().trim().min(1)).max(20).default([]),
  minOverall: z.number().min(0).max(100).optional(),
});
export type SearchCandidatesInput = z.infer<typeof searchCandidatesRequestSchema>;

export const candidateSearchResultSchema = z.object({
  candidates: z.array(candidateSummarySchema),
  total: z.number(),
});
export type CandidateSearchResult = z.infer<typeof candidateSearchResultSchema>;

/** Self-serve role switch (Student ↔ Recruiter) so the two-sided app is usable. */
export const switchRoleRequestSchema = z.object({
  role: z.enum(["STUDENT", "RECRUITER"]),
});
export type SwitchRoleInput = z.infer<typeof switchRoleRequestSchema>;
