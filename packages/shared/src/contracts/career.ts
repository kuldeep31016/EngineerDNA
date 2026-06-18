import { z } from "zod";

/**
 * Module 10 — Career Intelligence. A career mentor derived entirely from the
 * developer's DNA and evidence: the engineer they're becoming, realistic roles,
 * skill gaps, what to learn and build next, certifications and interview topics.
 * Every recommendation is grounded in their own data — never generic.
 */

export const careerRoleSchema = z.object({ title: z.string(), fit: z.string() });
export type CareerRole = z.infer<typeof careerRoleSchema>;

export const skillGapSchema = z.object({
  label: z.string(),
  value: z.number(),
  recommendation: z.string(),
});
export type SkillGap = z.infer<typeof skillGapSchema>;

export const careerIntelligenceSchema = z.object({
  available: z.boolean(),
  archetype: z.object({ title: z.string(), reasoning: z.string() }),
  roles: z.array(careerRoleSchema),
  companies: z.array(z.string()),
  skillGaps: z.array(skillGapSchema),
  learnNext: z.array(z.string()),
  nextProject: z.string(),
  certifications: z.array(z.string()),
  interviewTopics: z.array(z.string()),
  generatedAt: z.string(),
});
export type CareerIntelligence = z.infer<typeof careerIntelligenceSchema>;
