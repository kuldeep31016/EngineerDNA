import { z } from "zod";
import { jobTypeSchema, companySchema } from "./job";
import { proctoringReportSchema } from "./interview";

export const applicationStatusSchema = z.enum([
  "APPLIED",
  "VIEWED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "INTERVIEW_SCHEDULED",
  "OFFER_SENT",
  "OFFER_ACCEPTED",
  "REJECTED",
  "SELECTED",
  "HIRED",
]);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

/** Full ATS pipeline, in order — used for the Kanban board + status menus. */
export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: "APPLIED", label: "Applied", color: "text-blue-400" },
  { value: "VIEWED", label: "Viewed", color: "text-yellow-400" },
  { value: "SCREENING", label: "Screening", color: "text-sky-400" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "text-violet-400" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", color: "text-cyan-400" },
  { value: "OFFER_SENT", label: "Offer Sent", color: "text-amber-400" },
  { value: "OFFER_ACCEPTED", label: "Offer Accepted", color: "text-emerald-400" },
  { value: "HIRED", label: "Hired", color: "text-emerald-400" },
  { value: "REJECTED", label: "Rejected", color: "text-rose-400" },
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
  // Best evaluated mock-interview signal (informational), with its integrity.
  interviewScore: z.number().nullable(),
  interviewIntegrity: proctoringReportSchema.nullable(),
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

/* ---------------- Hiring lifecycle: timeline, interviews, offers ---------------- */

export const applicationEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  actorRole: z.enum(["recruiter", "student", "system"]),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type ApplicationEvent = z.infer<typeof applicationEventSchema>;

export const interviewScheduleStatusSchema = z.enum(["PROPOSED", "ACCEPTED", "DECLINED"]);
export const interviewScheduleSchema = z.object({
  scheduledAt: z.string(),
  meetingLink: z.string().nullable(),
  notes: z.string().nullable(),
  status: interviewScheduleStatusSchema,
});
export type InterviewSchedule = z.infer<typeof interviewScheduleSchema>;

export const offerStatusSchema = z.enum(["SENT", "ACCEPTED", "REJECTED"]);
export const offerSchema = z.object({
  salary: z.string(),
  joiningDate: z.string().nullable(),
  employmentType: jobTypeSchema,
  message: z.string().nullable(),
  status: offerStatusSchema,
});
export type Offer = z.infer<typeof offerSchema>;

/** The full lifecycle of one application — timeline + current interview + offer. */
export const applicationLifecycleSchema = z.object({
  applicationId: z.string(),
  status: applicationStatusSchema,
  timeline: z.array(applicationEventSchema),
  interview: interviewScheduleSchema.nullable(),
  offer: offerSchema.nullable(),
});
export type ApplicationLifecycle = z.infer<typeof applicationLifecycleSchema>;

export const scheduleInterviewRequestSchema = z.object({
  scheduledAt: z.string().datetime(),
  meetingLink: z.string().trim().url().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewRequestSchema>;

export const respondInterviewRequestSchema = z.object({ action: z.enum(["accept", "decline"]) });
export type RespondInterviewInput = z.infer<typeof respondInterviewRequestSchema>;

export const sendOfferRequestSchema = z.object({
  salary: z.string().trim().min(1).max(80),
  joiningDate: z.string().datetime().optional(),
  employmentType: jobTypeSchema.default("FULL_TIME"),
  message: z.string().trim().max(2000).optional(),
});
export type SendOfferInput = z.infer<typeof sendOfferRequestSchema>;

export const respondOfferRequestSchema = z.object({ action: z.enum(["accept", "reject"]) });
export type RespondOfferInput = z.infer<typeof respondOfferRequestSchema>;

/** Recruiter dashboard headline numbers. */
export const recruiterDashboardSchema = z.object({
  activeJobs: z.number(),
  totalApplicants: z.number(),
  shortlisted: z.number(),
  interviews: z.number(),
  hires: z.number(),
});
export type RecruiterDashboard = z.infer<typeof recruiterDashboardSchema>;

/** Dashboard stats for the recruiter. */
export const recruiterApplicationStatsSchema = z.object({
  activeJobs: z.number(),
  totalApplications: z.number(),
  shortlisted: z.number(),
  interviews: z.number(),
  hires: z.number(),
});
export type RecruiterApplicationStats = z.infer<typeof recruiterApplicationStatsSchema>;
