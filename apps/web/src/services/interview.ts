import {
  interviewListItemSchema,
  interviewSchema,
  interviewTurnResultSchema,
  startInterviewResultSchema,
  type Interview,
  type InterviewListItem,
  type InterviewTurnResult,
  type StartInterviewInput,
  type StartInterviewResult,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** POST — begin an interview for a role (resume-aware). */
export async function startInterview(input: StartInterviewInput): Promise<StartInterviewResult> {
  return startInterviewResultSchema.parse(
    await apiFetch<unknown>("/interview/start", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

/** POST — answer the current question and receive the next one (adaptive). */
export async function submitTurn(id: string, answer: string): Promise<InterviewTurnResult> {
  return interviewTurnResultSchema.parse(
    await apiFetch<unknown>(`/interview/${id}/turn`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
  );
}

/** POST — grade the conversation and get the report. */
export async function gradeInterview(id: string): Promise<Interview> {
  return interviewSchema.parse(
    await apiFetch<unknown>(`/interview/${id}/grade`, { method: "POST" }),
  );
}

/** GET — past interviews, newest first. */
export async function listInterviews(): Promise<InterviewListItem[]> {
  const data = await apiFetch<unknown[]>("/interview");
  return (data ?? []).map((d) => interviewListItemSchema.parse(d));
}

/** GET — a single interview with questions and (if graded) its report. */
export async function getInterview(id: string): Promise<Interview> {
  return interviewSchema.parse(await apiFetch<unknown>(`/interview/${id}`));
}
