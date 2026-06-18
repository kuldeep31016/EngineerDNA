import type { UserRole } from "@engineerdna/shared";

/** The home route for a role — students and recruiters have separate apps. */
export function homeFor(role: UserRole | undefined | null): string {
  return role === "RECRUITER" ? "/recruiter" : "/dashboard";
}
