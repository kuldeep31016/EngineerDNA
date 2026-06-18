import { z } from "zod";

/**
 * Module 20 — AI Career Copilot (capstone). A senior-mentor chat grounded ONLY
 * in the developer's VERIFIED profile (DNA, reputation, evidence, career). The
 * LLM narrates over the structured data — it never recomputes or invents facts.
 * One LLM call per question.
 */

export const copilotMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type CopilotMessage = z.infer<typeof copilotMessageSchema>;

export const askCopilotRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z.array(copilotMessageSchema).max(20).default([]),
});
export type AskCopilotInput = z.infer<typeof askCopilotRequestSchema>;

export const copilotAnswerSchema = z.object({
  answer: z.string(),
  followups: z.array(z.string()),
});
export type CopilotAnswer = z.infer<typeof copilotAnswerSchema>;

/** Suggested starter prompts shown on an empty conversation. */
export const COPILOT_STARTERS = [
  "Am I ready for backend internships?",
  "What should I build or learn next?",
  "Which roles fit my verified skills?",
  "What's my path to SDE-2?",
  "Review my profile honestly.",
];
