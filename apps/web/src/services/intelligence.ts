import { projectIntelligenceSchema, type ProjectIntelligence } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /github/repositories/:id/intelligence — the repo's report card. */
export async function getIntelligence(id: string): Promise<ProjectIntelligence> {
  return projectIntelligenceSchema.parse(
    await apiFetch<unknown>(`/github/repositories/${id}/intelligence`),
  );
}
