import {
  repositoryAnalysisSchema,
  repositorySchema,
  type Repository,
  type RepositoryAnalysis,
} from "@engineerdna/shared";
import { apiFetch, ApiError } from "@/lib/api";

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
