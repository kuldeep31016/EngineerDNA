import {
  interviewListItemSchema,
  interviewSchema,
  startInterviewResultSchema,
  type Interview,
  type InterviewAnswer,
  type InterviewListItem,
  type StartInterviewInput,
  type StartInterviewResult,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** POST — generate a personalized interview for a role (resume-aware). */
export async function startInterview(input: StartInterviewInput): Promise<StartInterviewResult> {
  return startInterviewResultSchema.parse(
    await apiFetch<unknown>("/interview/start", {
      method: "POST",
      body: JSON.stringify(input),
    }),
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

/** POST — submit answers and receive the graded report. */
export async function submitAnswers(id: string, answers: InterviewAnswer[]): Promise<Interview> {
  return interviewSchema.parse(
    await apiFetch<unknown>(`/interview/${id}/answers`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  );
}
