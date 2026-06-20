import { z } from "zod";

/**
 * Contracts for GitHub integration (Module 4): connection status and the
 * imported repositories. This module imports/lists repos only — analysis of a
 * repository happens in a later module.
 */

/** A repository imported from the user's GitHub account. */
export const repositorySchema = z.object({
  id: z.string(),
  githubId: z.string(),
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  forks: z.number(),
  isPrivate: z.boolean(),
  isFork: z.boolean().default(false),
  ownCommits: z.number().default(0),
  htmlUrl: z.string(),
  pushedAt: z.string().nullable(),
  selectedForAnalysis: z.boolean(),
});
export type Repository = z.infer<typeof repositorySchema>;

export const repositoryListSchema = z.array(repositorySchema);

/** Whether the caller has connected GitHub, with a few summary counts. */
export const githubStatusSchema = z.object({
  connected: z.boolean(),
  githubLogin: z.string().nullable(),
  repositoryCount: z.number(),
  selectedCount: z.number(),
});
export type GithubStatus = z.infer<typeof githubStatusSchema>;

/** Body for toggling whether a repository is selected for analysis. */
export const updateRepoSelectionSchema = z.object({
  selected: z.boolean(),
});
export type UpdateRepoSelectionInput = z.infer<typeof updateRepoSelectionSchema>;
