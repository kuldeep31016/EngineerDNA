import {
  ossRecommendationSchema,
  ossSearchResultSchema,
  type OssRecommendation,
  type OssSearchInput,
  type OssSearchResult,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

// Client-side cache so navigating away from the OSS page and back reuses the
// last result instead of refetching (SWR-style, no extra dependency). Lives for
// the browser session; a full reload clears it (the backend cache then serves
// it fast). Refresh / filter changes bypass it.
let recCache: OssRecommendation | null = null;

/** Synchronously read the cached recommendations (for seeding initial state). */
export function peekOssRecommendations(): OssRecommendation | null {
  return recCache;
}

/** GET /opensource — recommended repos/issues for verified skills (client-cached). */
export async function getOssRecommendations(refresh = false): Promise<OssRecommendation> {
  if (!refresh && recCache) return recCache;
  const data = ossRecommendationSchema.parse(
    await apiFetch<unknown>(`/opensource${refresh ? "?refresh=1" : ""}`),
  );
  recCache = data;
  return data;
}

/** POST /opensource/search — filter-driven repository search. */
export async function searchOss(filters: OssSearchInput): Promise<OssSearchResult> {
  return ossSearchResultSchema.parse(
    await apiFetch<unknown>("/opensource/search", { method: "POST", body: JSON.stringify(filters) }),
  );
}
