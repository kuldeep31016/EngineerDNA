import { z } from "zod";

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

/** Company info embedded in public job listings. */
export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
});
export type Company = z.infer<typeof companySchema>;

/** Recruiter's view of their own job (with match count + application count). */
export const jobPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  responsibilities: z.string().nullable(),
  requirements: z.string().nullable(),
  benefits: z.string().nullable(),
  skills: z.array(z.string()),
  location: z.string().nullable(),
  type: jobTypeSchema,
  workMode: jobWorkModeSchema,
  status: jobStatusSchema,
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  experience: z.string().nullable(),
  deadline: z.string().nullable(),
  matchCount: z.number(),
  applicationCount: z.number(),
  company: companySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JobPost = z.infer<typeof jobPostSchema>;

/** Public (student) view of a job — includes hasApplied, no matchCount. */
export const publicJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  responsibilities: z.string().nullable(),
  requirements: z.string().nullable(),
  benefits: z.string().nullable(),
  skills: z.array(z.string()),
  location: z.string().nullable(),
  type: jobTypeSchema,
  workMode: jobWorkModeSchema,
  status: jobStatusSchema,
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  experience: z.string().nullable(),
  deadline: z.string().nullable(),
  applicationCount: z.number(),
  hasApplied: z.boolean(),
  company: companySchema.nullable(),
  recruiterName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PublicJob = z.infer<typeof publicJobSchema>;

export const createJobRequestSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(8000),
  responsibilities: z.string().trim().max(5000).optional(),
  requirements: z.string().trim().max(5000).optional(),
  benefits: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().min(1)).max(30).default([]),
  location: z.string().trim().max(140).optional(),
  type: jobTypeSchema.default("FULL_TIME"),
  workMode: jobWorkModeSchema.default("ONSITE"),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  experience: z.string().trim().max(100).optional(),
  deadline: z.string().datetime().optional(),
});
export type CreateJobInput = z.infer<typeof createJobRequestSchema>;

export const updateJobRequestSchema = createJobRequestSchema.partial().extend({
  status: jobStatusSchema.optional(),
});
export type UpdateJobInput = z.infer<typeof updateJobRequestSchema>;
