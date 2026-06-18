import {
  portfolioSchema,
  publicPortfolioSchema,
  type ExtractResumeInput,
  type Portfolio,
  type PublicPortfolio,
  type UpdatePortfolioInput,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** POST — resume text → structured portfolio JSON (one cached LLM call). */
export async function extractPortfolio(input: ExtractResumeInput): Promise<Portfolio> {
  return portfolioSchema.parse(
    await apiFetch<unknown>("/portfolio/extract", { method: "POST", body: JSON.stringify(input) }),
  );
}

/** GET — the current user's portfolio. */
export async function getPortfolio(): Promise<Portfolio> {
  return portfolioSchema.parse(await apiFetch<unknown>("/portfolio"));
}

/** PATCH — save edits, theme, publish state. */
export async function updatePortfolio(input: UpdatePortfolioInput): Promise<Portfolio> {
  return portfolioSchema.parse(
    await apiFetch<unknown>("/portfolio", { method: "PATCH", body: JSON.stringify(input) }),
  );
}

/** GET (public, no auth) — a published portfolio by slug. */
export async function getPublicPortfolio(slug: string): Promise<PublicPortfolio> {
  return publicPortfolioSchema.parse(await apiFetch<unknown>(`/portfolio/p/${slug}`));
}
