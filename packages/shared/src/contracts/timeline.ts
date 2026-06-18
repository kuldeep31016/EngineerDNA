import { z } from "zod";

/**
 * Module 16 — Engineering Timeline. A developer's growth journey, derived from
 * the Evidence Timeline (when each technology was first USED): yearly periods,
 * notable "firsts" (first language, first database, first cloud...), and the
 * cumulative skill count over time. Deterministic — no LLM.
 */

export const timelineTechSchema = z.object({
  technology: z.string(),
  category: z.string(),
  firstSeenAt: z.string(),
  repositories: z.array(z.string()),
  /** Set when this is the first technology of its kind (e.g. "First database"). */
  milestone: z.string().nullable(),
});
export type TimelineTech = z.infer<typeof timelineTechSchema>;

export const timelinePeriodSchema = z.object({
  label: z.string(),
  year: z.number(),
  techs: z.array(timelineTechSchema),
  cumulativeSkills: z.number(),
});
export type TimelinePeriod = z.infer<typeof timelinePeriodSchema>;

export const timelineMilestoneSchema = z.object({
  label: z.string(),
  technology: z.string(),
  date: z.string(),
});
export type TimelineMilestone = z.infer<typeof timelineMilestoneSchema>;

export const engineeringTimelineSchema = z.object({
  available: z.boolean(),
  startedAt: z.string().nullable(),
  yearsActive: z.number(),
  totalSkills: z.number(),
  categoriesCovered: z.number(),
  milestones: z.array(timelineMilestoneSchema),
  periods: z.array(timelinePeriodSchema),
  generatedAt: z.string(),
});
export type EngineeringTimeline = z.infer<typeof engineeringTimelineSchema>;
