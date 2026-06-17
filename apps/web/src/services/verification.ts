import { verificationResultSchema, type VerificationResult } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** POST /skills/verify — verify skills against evidence and persist verdicts. */
export async function verifySkills(): Promise<VerificationResult> {
  return verificationResultSchema.parse(
    await apiFetch<unknown>("/skills/verify", { method: "POST" }),
  );
}

/** GET /skills/verification — current verification verdicts (read-only). */
export async function getVerification(): Promise<VerificationResult> {
  return verificationResultSchema.parse(await apiFetch<unknown>("/skills/verification"));
}
