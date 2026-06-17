import { developerEvidenceSchema, type DeveloperEvidence } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

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
