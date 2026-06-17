import { z } from "zod";
import { skillStatusSchema } from "../enums";
import { evidenceStrengthSchema, proofSchema } from "./evidence";

/**
 * Module 7 — Skill Verification. Each self-added (CLAIMED) skill is checked
 * against the evidence collected in Module 6. A skill becomes VERIFIED only
 * when there is real (USED) evidence for it; otherwise it stays CLAIMED. Every
 * verified skill carries the proof behind it.
 */

/** The evidence backing a skill's verification. */
export const skillEvidenceSchema = z.object({
  strength: evidenceStrengthSchema,
  repositoryCount: z.number(),
  repositories: z.array(z.string()),
  proofs: z.array(proofSchema),
});
export type SkillEvidence = z.infer<typeof skillEvidenceSchema>;

/** A skill plus its verification verdict. */
export const verifiedSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  status: skillStatusSchema,
  confidence: z.number(),
  evidence: skillEvidenceSchema.nullable(),
});
export type VerifiedSkill = z.infer<typeof verifiedSkillSchema>;

/** Result of running verification across all of a developer's skills. */
export const verificationResultSchema = z.object({
  skills: z.array(verifiedSkillSchema),
  verifiedCount: z.number(),
  claimedCount: z.number(),
});
export type VerificationResult = z.infer<typeof verificationResultSchema>;
