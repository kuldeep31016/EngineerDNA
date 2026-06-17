import { z } from "zod";
import { scoreSchema } from "./score";

/**
 * Module 9 — Project Intelligence. A per-repository Engineering Report Card:
 * a Project Quality Score plus dimension scores, plain-English verdicts
 * (production-ready? scalable? secure? original?), and a path to industry-ready.
 * Computed deterministically from the Module 5 report and Module 6 evidence —
 * every score is explainable (no black box).
 */

/** A short yes/no-style answer with its sentiment. */
export const verdictSchema = z.object({
  label: z.string(),
  value: z.string(),
  positive: z.boolean(),
});
export type Verdict = z.infer<typeof verdictSchema>;

export const projectIntelligenceSchema = z.object({
  repositoryId: z.string(),
  available: z.boolean(),
  overall: scoreSchema,
  dimensions: z.array(scoreSchema),
  verdicts: z.array(verdictSchema),
  improvements: z.array(z.string()),
  generatedAt: z.string(),
});
export type ProjectIntelligence = z.infer<typeof projectIntelligenceSchema>;
