import {
  developerEvidenceSchema,
  repoEvidenceListSchema,
  type DeveloperEvidence,
  type RepoEvidenceItem,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /github/repositories/:id/evidence — stored evidence for one repo. */
export async function getRepoEvidence(id: string): Promise<RepoEvidenceItem[]> {
  return repoEvidenceListSchema.parse(
    await apiFetch<unknown>(`/github/repositories/${id}/evidence`),
  );
}

/** POST /github/repositories/:id/evidence — extract evidence for one repo. */
export async function buildRepoEvidence(id: string): Promise<RepoEvidenceItem[]> {
  return repoEvidenceListSchema.parse(
    await apiFetch<unknown>(`/github/repositories/${id}/evidence`, { method: "POST" }),
  );
}

/** GET /evidence — the developer's rolled-up evidence + timeline. */
export async function getEvidence(): Promise<DeveloperEvidence> {
  return developerEvidenceSchema.parse(await apiFetch<unknown>("/evidence"));
}

/** POST /evidence/build — (re)extract evidence from all selected repositories. */
export async function buildEvidence(): Promise<DeveloperEvidence> {
  return developerEvidenceSchema.parse(
    await apiFetch<unknown>("/evidence/build", { method: "POST" }),
  );
}
