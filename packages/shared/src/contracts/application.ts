import { z } from "zod";
import { jobTypeSchema, companySchema } from "./job";

export const applicationStatusSchema = z.enum([
  "APPLIED",
  "VIEWED",
  "SHORTLISTED",
  "INTERVIEW",
  "REJECTED",
  "SELECTED",
]);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: "APPLIED", label: "Applied", color: "text-blue-400" },
  { value: "VIEWED", label: "Viewed", color: "text-yellow-400" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "text-violet-400" },
  { value: "INTERVIEW", label: "Interview", color: "text-cyan-400" },
  { value: "REJECTED", label: "Rejected", color: "text-rose-400" },
  { value: "SELECTED", label: "Selected", color: "text-emerald-400" },
];

/** Student's view of their own application (with job info joined). */
export const myApplicationSchema = z.object({
  id: z.string(),
  status: applicationStatusSchema,
  coverLetter: z.string().nullable(),
  appliedAt: z.string(),
  updatedAt: z.string(),
  job: z.object({
    id: z.string(),
    title: z.string(),
    type: jobTypeSchema,
    location: z.string().nullable(),
    company: companySchema.nullable(),
  }),
});
export type MyApplication = z.infer<typeof myApplicationSchema>;

/** A repository that proves one or more of the job's required skills. */
export const matchedRepoSchema = z.object({
  name: z.string(),
  htmlUrl: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  skills: z.array(z.string()),
});
export type MatchedRepo = z.infer<typeof matchedRepoSchema>;

/** Recruiter's view of an applicant for one of their jobs, with the full
 *  evidence + resume match report behind the ranking. */
export const recruiterApplicantSchema = z.object({
  applicationId: z.string(),
  status: applicationStatusSchema,
  appliedAt: z.string(),
  coverLetter: z.string().nullable(),
  hasResume: z.boolean(),
  studentId: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  profileImage: z.string().nullable(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
  dnaScore: z.number(),
  verifiedSkillCount: z.number(),
  topSkills: z.array(z.string()),
  portfolioSlug: z.string().nullable(),
  githubUsername: z.string().nullable(),
  // The match report — why this candidate ranks where they do.
  matchScore: z.number(),
  evidenceSkills: z.array(z.string()), // required skills PROVEN in repos
  resumeSkills: z.array(z.string()), // required skills found in the resume
  missingSkills: z.array(z.string()), // required skills with neither
  matchedRepos: z.array(matchedRepoSchema), // repos proving the required skills
});
export type RecruiterApplicant = z.infer<typeof recruiterApplicantSchema>;

export const applyRequestSchema = z.object({
  resumeText: z.string().trim().min(30, "Please upload a valid resume").max(50000),
  coverLetter: z.string().trim().max(2000).optional(),
});
export type ApplyRequest = z.infer<typeof applyRequestSchema>;

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusSchema,
});
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

/** Dashboard stats for the student. */
export const studentApplicationStatsSchema = z.object({
  total: z.number(),
  shortlisted: z.number(),
  interviews: z.number(),
  offers: z.number(),
  rejected: z.number(),
});
export type StudentApplicationStats = z.infer<typeof studentApplicationStatsSchema>;

/** Dashboard stats for the recruiter. */
export const recruiterApplicationStatsSchema = z.object({
  activeJobs: z.number(),
  totalApplications: z.number(),
  shortlisted: z.number(),
  interviews: z.number(),
  hires: z.number(),
});
export type RecruiterApplicationStats = z.infer<typeof recruiterApplicationStatsSchema>;
