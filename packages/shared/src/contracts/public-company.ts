import { z } from "zod";
import { jobTypeSchema, jobWorkModeSchema } from "./job";

/**
 * The public, shareable company page at /c/<id>. Shows the company's brand and
 * its currently OPEN roles. No authentication, no private data. Deterministic.
 */

export const publicCompanyJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: jobTypeSchema,
  workMode: jobWorkModeSchema,
  location: z.string().nullable(),
  skills: z.array(z.string()),
  createdAt: z.string(),
});
export type PublicCompanyJob = z.infer<typeof publicCompanyJobSchema>;

export const publicCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  openRoleCount: z.number(),
  topSkills: z.array(z.string()),
  jobs: z.array(publicCompanyJobSchema),
});
export type PublicCompany = z.infer<typeof publicCompanySchema>;
