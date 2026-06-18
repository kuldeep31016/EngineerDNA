import { engineeringTimelineSchema, type EngineeringTimeline } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /timeline — the developer's engineering growth journey. */
export async function getTimeline(): Promise<EngineeringTimeline> {
  return engineeringTimelineSchema.parse(await apiFetch<unknown>("/timeline"));
}
