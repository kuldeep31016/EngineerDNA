import {
  meResponseSchema,
  type AuthUser,
  type RecruiterLoginInput,
  type RecruiterSignupInput,
} from "@engineerdna/shared";
import { apiFetch, API_BASE_URL } from "@/lib/api";

/** GET /auth/me — current user, validated against the shared contract. */
export async function fetchMe(): Promise<AuthUser> {
  const data = await apiFetch<unknown>("/auth/me");
  return meResponseSchema.parse(data).user;
}

/** POST /auth/recruiter/signup — register a recruiter, returns the new user. */
export async function recruiterSignup(input: RecruiterSignupInput): Promise<AuthUser> {
  const data = await apiFetch<unknown>("/auth/recruiter/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return meResponseSchema.parse(data).user;
}

/** POST /auth/recruiter/login — email + password sign-in for recruiters. */
export async function recruiterLogin(input: RecruiterLoginInput): Promise<AuthUser> {
  const data = await apiFetch<unknown>("/auth/recruiter/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return meResponseSchema.parse(data).user;
}

/** POST /auth/refresh — rotate the refresh token. Returns success boolean. */
export async function tryRefresh(): Promise<boolean> {
  try {
    await apiFetch("/auth/refresh", { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

/** POST /auth/logout — revoke session and clear cookies. */
export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

/** Full-page navigation target that kicks off an OAuth flow. */
export function oauthUrl(provider: "github" | "google"): string {
  return `${API_BASE_URL}/auth/${provider}`;
}
