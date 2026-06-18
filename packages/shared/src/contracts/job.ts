import { z } from "zod";

/**
 * Job Posts for the recruiter dashboard. A recruiter creates postings with
 * required skills; the platform matches them against VERIFIED candidate evidence
 * (deterministic — reuses the recruiter search). No LLM.
 */

export const jobTypeSchema = z.enum(["FULL_TIME", "INTERNSHIP", "CONTRACT", "PART_TIME"]);
export type JobType = z.infer<typeof jobTypeSchema>;

export const jobWorkModeSchema = z.enum(["ONSITE", "REMOTE", "HYBRID"]);
export type JobWorkMode = z.infer<typeof jobWorkModeSchema>;

export const jobStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "CONTRACT", label: "Contract" },
  { value: "PART_TIME", label: "Part-time" },
];

export const JOB_WORK_MODES: { value: JobWorkMode; label: string }[] = [
  { value: "ONSITE", label: "On-site" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
];

export const jobPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  location: z.string().nullable(),
  type: jobTypeSchema,
  workMode: jobWorkModeSchema,
  status: jobStatusSchema,
  matchCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JobPost = z.infer<typeof jobPostSchema>;

export const createJobRequestSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(8000),
  skills: z.array(z.string().trim().min(1)).max(30).default([]),
  location: z.string().trim().max(140).optional(),
  type: jobTypeSchema.default("FULL_TIME"),
  workMode: jobWorkModeSchema.default("ONSITE"),
});
export type CreateJobInput = z.infer<typeof createJobRequestSchema>;

export const updateJobRequestSchema = createJobRequestSchema.partial().extend({
  status: jobStatusSchema.optional(),
});
export type UpdateJobInput = z.infer<typeof updateJobRequestSchema>;
