import { publicCompanySchema, type PublicCompany } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** Fetch a public company page (brand + open roles). No auth required. */
export async function getPublicCompany(id: string): Promise<PublicCompany> {
  return publicCompanySchema.parse(await apiFetch<unknown>(`/public/company/${id}`));
}
