import { ossRecommendationSchema, type OssRecommendation } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /opensource — recommended repos/issues for verified skills. */
export async function getOssRecommendations(refresh = false): Promise<OssRecommendation> {
  return ossRecommendationSchema.parse(
    await apiFetch<unknown>(`/opensource${refresh ? "?refresh=1" : ""}`),
  );
}
