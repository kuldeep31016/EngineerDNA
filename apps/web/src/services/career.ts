import { careerIntelligenceSchema, type CareerIntelligence } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /career — DNA-grounded career guidance. */
export async function getCareer(): Promise<CareerIntelligence> {
  return careerIntelligenceSchema.parse(await apiFetch<unknown>("/career"));
}
