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

/**
 * Anti-cheat / integrity signals captured in the browser during a proctored
 * interview. Counts of detected violations (we detect & log — browsers can't
 * truly lock a tab). `terminated` is true when the session auto-ended on too
 * many violations.
 */
export const proctoringReportSchema = z.object({
  fullscreenExits: z.number().default(0),
  tabSwitches: z.number().default(0),
  focusLost: z.number().default(0),
  // Camera-vision signals (MediaPipe, in-browser). Defaulted so older records
  // without these fields still parse.
  noFaceEvents: z.number().default(0), // camera saw no face (candidate absent/covered)
  multipleFaceEvents: z.number().default(0), // more than one person in frame
  terminated: z.boolean().default(false),
});
export type ProctoringReport = z.infer<typeof proctoringReportSchema>;

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
  proctoring: proctoringReportSchema.nullable().default(null),
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

/** Request body for one conversational turn — the answer to the current question. */
export const interviewTurnRequestSchema = z.object({
  answer: z.string().max(8000),
});
export type InterviewTurnInput = z.infer<typeof interviewTurnRequestSchema>;

/** Result of a turn: the updated interview, and whether the interview is over. */
export const interviewTurnResultSchema = z.object({
  interview: interviewSchema,
  done: z.boolean(),
});
export type InterviewTurnResult = z.infer<typeof interviewTurnResultSchema>;

/** Grade request — optionally carries the proctoring summary from the session. */
export const gradeInterviewRequestSchema = z.object({
  proctoring: proctoringReportSchema.optional(),
});
export type GradeInterviewInput = z.infer<typeof gradeInterviewRequestSchema>;
