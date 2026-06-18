import { z } from "zod";
import { candidateSummarySchema } from "./recruiter";

/**
 * Module 15 — Candidate Ranking Engine. Ranks verified candidates for a job on
 * a transparent weighted composite of evidence factors. Every rank is fully
 * explainable: each factor carries its score, weight, and concrete reasoning —
 * no black box. Deterministic — no LLM.
 */

export const rankingFactorSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number(), // 0-100
  weight: z.number(), // 0-1
  detail: z.string(), // the "why", with concrete numbers
});
export type RankingFactor = z.infer<typeof rankingFactorSchema>;

export const rankedCandidateSchema = candidateSummarySchema.extend({
  rankScore: z.number(),
  factors: z.array(rankingFactorSchema),
  /** Best evaluated interview readiness, shown as a signal (informational). */
  interviewScore: z.number().nullable(),
});
export type RankedCandidate = z.infer<typeof rankedCandidateSchema>;

export const rankingResultSchema = z.object({
  candidates: z.array(rankedCandidateSchema),
  total: z.number(),
});
export type RankingResult = z.infer<typeof rankingResultSchema>;
