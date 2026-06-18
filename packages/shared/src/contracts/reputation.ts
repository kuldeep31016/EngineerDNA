import { z } from "zod";

/**
 * Module 19 — Engineering Reputation Score. A fair, transparent score (0-100)
 * built ONLY from verified engineering signals — verified skills, DNA, project
 * quality, testing, security, deployment, consistency. NEVER followers or likes.
 * Every factor explains its reasoning and how to improve. Deterministic — no LLM.
 */

export const reputationFactorSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number(), // 0-100
  weight: z.number(), // 0-1
  reasoning: z.string(),
  improve: z.string(),
});
export type ReputationFactor = z.infer<typeof reputationFactorSchema>;

export const engineeringReputationSchema = z.object({
  available: z.boolean(),
  score: z.number(),
  tier: z.string(),
  factors: z.array(reputationFactorSchema),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  generatedAt: z.string(),
});
export type EngineeringReputation = z.infer<typeof engineeringReputationSchema>;
