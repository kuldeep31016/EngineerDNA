import { z } from "zod";

/**
 * Health-check contract. Defined once and consumed by both the API (which
 * returns it) and the web app (which renders it) — proving the shared-contract
 * pattern end-to-end in the foundation.
 */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
