import { z } from "zod";
import { evidenceSourceSchema } from "../enums";

/**
 * Module 6 — Evidence Engine. The heart of EngineerDNA: we collect EVIDENCE for
 * every technology and distinguish what is actually USED (real implementation)
 * from what is merely MENTIONED (a declared dependency). Later modules read this
 * evidence instead of re-scanning repositories.
 */

export const techCategorySchema = z.enum([
  "LANGUAGE",
  "FRAMEWORK",
  "DATABASE",
  "CLOUD",
  "TESTING",
  "DEPLOYMENT",
  "LIBRARY",
  "TOOL",
  "AUTH",
]);
export type TechCategory = z.infer<typeof techCategorySchema>;

/** USED = proven by real implementation. MENTIONED = declared but unconfirmed. */
export const evidenceStrengthSchema = z.enum(["MENTIONED", "USED"]);
export type EvidenceStrength = z.infer<typeof evidenceStrengthSchema>;

/** A single piece of proof backing an evidence item. */
export const proofSchema = z.object({
  detail: z.string(),
  path: z.string().nullable(),
});
export type Proof = z.infer<typeof proofSchema>;

/** Evidence for one technology within one repository. */
export const repoEvidenceItemSchema = z.object({
  technology: z.string(),
  category: techCategorySchema,
  strength: evidenceStrengthSchema,
  confidence: z.number(),
  source: evidenceSourceSchema,
  proofs: z.array(proofSchema),
});
export type RepoEvidenceItem = z.infer<typeof repoEvidenceItemSchema>;

export const repoEvidenceListSchema = z.array(repoEvidenceItemSchema);

/** A technology rolled up across all of a developer's repositories. */
export const developerEvidenceItemSchema = z.object({
  technology: z.string(),
  category: techCategorySchema,
  strength: evidenceStrengthSchema,
  confidence: z.number(),
  repositoryCount: z.number(),
  repositories: z.array(z.string()),
  firstSeenAt: z.string().nullable(),
  proofs: z.array(proofSchema),
});
export type DeveloperEvidenceItem = z.infer<typeof developerEvidenceItemSchema>;

/** An entry in the Evidence Timeline: when a technology first appeared. */
export const timelineEntrySchema = z.object({
  technology: z.string(),
  category: techCategorySchema,
  firstSeenAt: z.string(),
});
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

/** The developer's full evidence picture: rolled-up items + the timeline. */
export const developerEvidenceSchema = z.object({
  items: z.array(developerEvidenceItemSchema),
  timeline: z.array(timelineEntrySchema),
});
export type DeveloperEvidence = z.infer<typeof developerEvidenceSchema>;
