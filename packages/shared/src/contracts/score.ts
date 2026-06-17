import { z } from "zod";

/**
 * The explainable-score primitive. EVERY score in EngineerDNA (Developer DNA,
 * project quality, ranking, reputation) is this shape: a value, a human level,
 * the reasoning behind it, and references to the evidence that produced it.
 * No score may exist without an explanation — that is the brand.
 */
export const scoreSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(), // 0–100
  level: z.string(), // e.g. "No evidence" | "Emerging" | "Proficient" | "Strong" | "Expert"
  reasoning: z.string(),
  evidenceRefs: z.array(z.string()),
});
export type Score = z.infer<typeof scoreSchema>;
