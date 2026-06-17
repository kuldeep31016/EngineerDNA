import { developerDnaSchema, type DeveloperDna } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** GET /dna — the developer's DNA scored from evidence. */
export async function getDna(): Promise<DeveloperDna> {
  return developerDnaSchema.parse(await apiFetch<unknown>("/dna"));
}
