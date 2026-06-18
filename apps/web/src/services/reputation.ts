import { engineeringReputationSchema, type EngineeringReputation } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /reputation — fair, evidence-based reputation score. */
export async function getReputation(): Promise<EngineeringReputation> {
  return engineeringReputationSchema.parse(await apiFetch<unknown>("/reputation"));
}
