import {
  githubStatusSchema,
  repositoryListSchema,
  repositorySchema,
  type GithubStatus,
  type Repository,
} from "@engineerdna/shared";
import { apiFetch, API_BASE_URL } from "@/lib/api";

/** GET /github/status — connection state + counts. */
export async function getGithubStatus(): Promise<GithubStatus> {
  return githubStatusSchema.parse(await apiFetch<unknown>("/github/status"));
}

/** GET /github/repositories — the imported repositories. */
export async function listRepositories(): Promise<Repository[]> {
  return repositoryListSchema.parse(await apiFetch<unknown>("/github/repositories"));
}

/** POST /github/sync — (re)import repositories from GitHub. */
export async function syncRepositories(): Promise<Repository[]> {
  return repositoryListSchema.parse(await apiFetch<unknown>("/github/sync", { method: "POST" }));
}

/** PATCH /github/repositories/:id — select/deselect for analysis. */
export async function setRepositorySelection(id: string, selected: boolean): Promise<Repository> {
  return repositorySchema.parse(
    await apiFetch<unknown>(`/github/repositories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ selected }),
    }),
  );
}

/** DELETE /github/disconnect — remove connection + imported repos. */
export async function disconnectGithub(): Promise<void> {
  await apiFetch("/github/disconnect", { method: "DELETE" });
}

/** Full-page navigation target to start the GitHub connect flow. */
export function githubConnectUrl(): string {
  return `${API_BASE_URL}/auth/github/connect`;
}
