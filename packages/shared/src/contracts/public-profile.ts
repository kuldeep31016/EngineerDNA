import { z } from "zod";
import { scoreSchema } from "./score";

/**
 * The public, shareable verified profile at /u/<username>. Everything here is
 * derived from PUBLIC evidence only (public GitHub repos) — never private work,
 * never unverified claims. This is the page candidates share + embed as a badge.
 */

export const publicSkillSchema = z.object({
  technology: z.string(),
  category: z.string(),
  repositoryCount: z.number(),
});
export type PublicSkill = z.infer<typeof publicSkillSchema>;

export const publicRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  htmlUrl: z.string(),
});
export type PublicRepo = z.infer<typeof publicRepoSchema>;

export const publicProfileSchema = z.object({
  username: z.string(),
  name: z.string(),
  profileImage: z.string().nullable(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
  about: z.string().nullable(),
  githubUsername: z.string().nullable(),
  portfolioSlug: z.string().nullable(),
  overall: z.number(),
  topStrengths: z.array(z.string()),
  verifiedSkillCount: z.number(),
  publicRepoCount: z.number(),
  scores: z.array(scoreSchema),
  verifiedSkills: z.array(publicSkillSchema),
  topRepos: z.array(publicRepoSchema),
  generatedAt: z.string(),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;
