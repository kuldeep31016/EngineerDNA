import { z } from "zod";

/**
 * Module 11 — AI Interview Engine. A personalized technical interview generated
 * from the developer's VERIFIED evidence: questions are grounded in technologies
 * they have actually used (JWT → auth, Redis → caching, Docker → deployment...),
 * answers are graded with per-answer feedback, and a report tracks readiness.
 * These are software-engineering interviews, not competitive programming.
 */

export const interviewDifficultySchema = z.enum(["easy", "medium", "hard"]);
export type InterviewDifficulty = z.infer<typeof interviewDifficultySchema>;

export const interviewStatusSchema = z.enum(["GENERATED", "EVALUATED"]);
export type InterviewStatus = z.infer<typeof interviewStatusSchema>;

/** One generated question, tied to an evidence-backed topic. */
export const interviewQuestionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  difficulty: interviewDifficultySchema,
  prompt: z.string(),
  rationale: z.string(),
});
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;

/** The candidate's answer to a single question. */
export const interviewAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;

/** Grading of one answer. */
export const answerFeedbackSchema = z.object({
  questionId: z.string(),
  score: z.number(),
  verdict: z.string(),
  feedback: z.string(),
  idealPoints: z.array(z.string()),
});
export type AnswerFeedback = z.infer<typeof answerFeedbackSchema>;

/** The full personalized report produced after grading. */
export const interviewReportSchema = z.object({
  overallScore: z.number(),
  summary: z.string(),
  confidence: z.number(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  prepTopics: z.array(z.string()),
  perAnswer: z.array(answerFeedbackSchema),
});
export type InterviewReport = z.infer<typeof interviewReportSchema>;

/** The role a candidate is interviewing for — drives question focus. */
export const interviewRoleSchema = z.enum([
  "frontend",
  "backend",
  "fullstack",
  "cloud",
  "dsa",
  "aiml",
  "data",
]);
export type InterviewRole = z.infer<typeof interviewRoleSchema>;

/** Roles offered in the setup form (value + human label). */
export const INTERVIEW_ROLES: { value: InterviewRole; label: string }[] = [
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "fullstack", label: "Full-Stack Developer" },
  { value: "cloud", label: "Cloud / DevOps Engineer" },
  { value: "dsa", label: "DSA / Problem Solving" },
  { value: "aiml", label: "AI / ML Engineer" },
  { value: "data", label: "Data Engineer" },
];

/** A full interview record. */
export const interviewSchema = z.object({
  id: z.string(),
  status: interviewStatusSchema,
  role: z.string().nullable(),
  candidateName: z.string().nullable(),
  topics: z.array(z.string()),
  questions: z.array(interviewQuestionSchema),
  answers: z.array(interviewAnswerSchema),
  report: interviewReportSchema.nullable(),
  overallScore: z.number().nullable(),
  createdAt: z.string(),
  evaluatedAt: z.string().nullable(),
});
export type Interview = z.infer<typeof interviewSchema>;

/** Lightweight history row (improvement over time). */
export const interviewListItemSchema = z.object({
  id: z.string(),
  status: interviewStatusSchema,
  role: z.string().nullable(),
  topics: z.array(z.string()),
  questionCount: z.number(),
  overallScore: z.number().nullable(),
  createdAt: z.string(),
});
export type InterviewListItem = z.infer<typeof interviewListItemSchema>;

/** Request body when starting an interview — role plus optional resume context. */
export const startInterviewRequestSchema = z.object({
  role: interviewRoleSchema,
  candidateName: z.string().trim().max(120).optional(),
  resumeText: z.string().trim().max(20000).optional(),
});
export type StartInterviewInput = z.infer<typeof startInterviewRequestSchema>;

/** Result of starting an interview. */
export const startInterviewResultSchema = z.object({
  available: z.boolean(),
  reason: z.string().nullable(),
  interview: interviewSchema.nullable(),
});
export type StartInterviewResult = z.infer<typeof startInterviewResultSchema>;

/** Request body when submitting answers for grading. */
export const submitAnswersRequestSchema = z.object({
  answers: z.array(interviewAnswerSchema).min(1),
});
export type SubmitAnswersInput = z.infer<typeof submitAnswersRequestSchema>;
