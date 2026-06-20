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

/* ---------------- Explore: filter-driven GitHub repository search ---------------- */

export const ossSortSchema = z.enum(["best", "stars", "forks", "updated"]);
export type OssSort = z.infer<typeof ossSortSchema>;

/** Filters the UI exposes; the backend turns these into a GitHub Search query. */
export const ossSearchRequestSchema = z.object({
  language: z.string().trim().max(40).optional(),
  topic: z.string().trim().max(40).optional(),
  license: z.string().trim().max(20).optional(),
  minStars: z.number().int().min(0).max(100000).optional(),
  goodFirstIssue: z.boolean().optional(),
  helpWanted: z.boolean().optional(),
  recentlyUpdated: z.boolean().optional(),
  sort: ossSortSchema.default("stars"),
});
export type OssSearchInput = z.infer<typeof ossSearchRequestSchema>;

export const ossSearchResultSchema = z.object({
  repos: z.array(ossRepoSchema),
  total: z.number(),
  query: z.string(), // the GitHub query we built — shown for transparency
  cached: z.boolean(),
});
export type OssSearchResult = z.infer<typeof ossSearchResultSchema>;

/** Option lists for the Explore filter UI. */
export const OSS_LANGUAGES = ["C++", "C", "C#", "Java", "Python", "JavaScript", "TypeScript", "Go", "Rust", "Ruby", "PHP", "Kotlin", "Swift"];
export const OSS_TOPICS = ["backend", "frontend", "ai", "machine-learning", "devops", "cloud", "blockchain", "security", "database", "mobile"];
export const OSS_LICENSES: { value: string; label: string }[] = [
  { value: "mit", label: "MIT" },
  { value: "apache-2.0", label: "Apache 2.0" },
  { value: "gpl-3.0", label: "GPL v3" },
  { value: "bsd-3-clause", label: "BSD 3-Clause" },
];
export const OSS_STAR_TIERS = [100, 500, 1000, 10000];
export const OSS_SORTS: { value: OssSort; label: string }[] = [
  { value: "best", label: "Best match" },
  { value: "stars", label: "Most stars" },
  { value: "forks", label: "Most forks" },
  { value: "updated", label: "Recently updated" },
];
