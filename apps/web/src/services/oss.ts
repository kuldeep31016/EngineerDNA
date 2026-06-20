import {
  ossRecommendationSchema,
  ossSearchResultSchema,
  type OssRecommendation,
  type OssSearchInput,
  type OssSearchResult,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /opensource — recommended repos/issues for verified skills. */
export async function getOssRecommendations(refresh = false): Promise<OssRecommendation> {
  return ossRecommendationSchema.parse(
    await apiFetch<unknown>(`/opensource${refresh ? "?refresh=1" : ""}`),
  );
}

/** POST /opensource/search — filter-driven repository search. */
export async function searchOss(filters: OssSearchInput): Promise<OssSearchResult> {
  return ossSearchResultSchema.parse(
    await apiFetch<unknown>("/opensource/search", { method: "POST", body: JSON.stringify(filters) }),
  );
}
