import { z } from "zod";
import { scoreSchema } from "./score";

/**
 * Module 8 — Developer DNA. The developer's engineering identity, scored across
 * ten dimensions from the evidence collected so far. Every dimension is an
 * explainable Score (value + level + reasoning + evidence references).
 */
export const developerDnaSchema = z.object({
  scores: z.array(scoreSchema),
  overall: z.number(),
  topStrengths: z.array(z.string()),
  generatedAt: z.string(),
});
export type DeveloperDna = z.infer<typeof developerDnaSchema>;
