import {
  learningRoadmapSchema,
  type GenerateRoadmapInput,
  type LearningRoadmap,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET — the current learning roadmap (available:false if none yet). */
export async function getRoadmap(): Promise<LearningRoadmap> {
  return learningRoadmapSchema.parse(await apiFetch<unknown>("/roadmap"));
}

/** POST — generate (or reuse) a roadmap for a role. */
export async function generateRoadmap(input: GenerateRoadmapInput): Promise<LearningRoadmap> {
  return learningRoadmapSchema.parse(
    await apiFetch<unknown>("/roadmap", { method: "POST", body: JSON.stringify(input) }),
  );
}
