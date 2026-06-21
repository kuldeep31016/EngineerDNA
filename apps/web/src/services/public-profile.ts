import { publicProfileSchema, type PublicProfile } from "@engineerdna/shared";
import { apiFetch, API_BASE_URL } from "@/lib/api";

/** GET a public verified profile by username (no auth). */
export async function getPublicProfile(username: string): Promise<PublicProfile> {
  return publicProfileSchema.parse(await apiFetch<unknown>(`/public/profile/${encodeURIComponent(username)}`));
}

/** Absolute URL of the embeddable verification badge (served by the API). */
export function badgeUrl(username: string): string {
  return `${API_BASE_URL}/public/profile/${encodeURIComponent(username)}/badge.svg`;
}
