import { z } from "zod";

/**
 * Module 17 — Open Source Recommendation. Suggests real repositories and
 * good-first issues matched to the developer's VERIFIED skills, via the GitHub
 * Search API — deterministic, NO LLM (LLMs hallucinate repos/issues). Results
 * are cached per skill-set to respect GitHub rate limits.
 */

export const ossDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export type OssDifficulty = z.infer<typeof ossDifficultySchema>;

export const ossIssueSchema = z.object({
  title: z.string(),
  url: z.string(),
  difficulty: ossDifficultySchema,
  labels: z.array(z.string()),
});
export type OssIssue = z.infer<typeof ossIssueSchema>;

export const ossRepoSchema = z.object({
  fullName: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  language: z.string().nullable(),
  stars: z.number(),
  topics: z.array(z.string()),
  matchedSkill: z.string(),
  goodFirstIssues: z.number(),
  contributeUrl: z.string(),
  issues: z.array(ossIssueSchema),
});
export type OssRepo = z.infer<typeof ossRepoSchema>;

export const ossRecommendationSchema = z.object({
  available: z.boolean(),
  reason: z.string().nullable(),
  skills: z.array(z.string()),
  repos: z.array(ossRepoSchema),
  generatedAt: z.string(),
});
export type OssRecommendation = z.infer<typeof ossRecommendationSchema>;
