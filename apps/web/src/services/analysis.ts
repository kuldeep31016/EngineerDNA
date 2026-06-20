import {
  repoTreeSchema,
  repositoryAnalysisSchema,
  repositorySchema,
  type RepoTree,
  type Repository,
  type RepositoryAnalysis,
} from "@engineerdna/shared";
import { apiFetch, ApiError } from "@/lib/api";

/** GET the repository's real file tree (flat paths; client renders the tree). */
export async function getRepoTree(id: string): Promise<RepoTree> {
  return repoTreeSchema.parse(await apiFetch<unknown>(`/github/repositories/${id}/tree`));
}

/** GET a single imported repository. */
export async function getRepository(id: string): Promise<Repository> {
  return repositorySchema.parse(await apiFetch<unknown>(`/github/repositories/${id}`));
}

/** POST — start (or re-run) analysis for a repository. */
export async function startAnalysis(id: string): Promise<RepositoryAnalysis> {
  return repositoryAnalysisSchema.parse(
    await apiFetch<unknown>(`/github/repositories/${id}/analyze`, { method: "POST" }),
  );
}

/** GET the current analysis, or null if it has never been run. */
export async function getAnalysis(id: string): Promise<RepositoryAnalysis | null> {
  try {
    return repositoryAnalysisSchema.parse(
      await apiFetch<unknown>(`/github/repositories/${id}/analysis`),
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
