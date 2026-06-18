import { copilotAnswerSchema, type AskCopilotInput, type CopilotAnswer } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** POST /copilot/ask — a mentor answer grounded in your verified profile. */
export async function askCopilot(input: AskCopilotInput): Promise<CopilotAnswer> {
  return copilotAnswerSchema.parse(
    await apiFetch<unknown>("/copilot/ask", { method: "POST", body: JSON.stringify(input) }),
  );
}
