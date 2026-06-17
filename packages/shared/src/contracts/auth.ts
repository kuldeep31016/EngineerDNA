import { z } from "zod";
import { userRoleSchema, authProviderSchema } from "../enums";

/**
 * The authenticated user as exposed to the client. This is the ONLY user shape
 * the frontend sees — never tokens, password material, or provider secrets.
 */
export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  profileImage: z.string().url().nullable(),
  role: userRoleSchema,
  provider: authProviderSchema,
  isVerified: z.boolean(),
  createdAt: z.string(),
  lastLogin: z.string().nullable(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

/** Response of GET /auth/me. */
export const meResponseSchema = z.object({
  user: authUserSchema,
});
export type MeResponse = z.infer<typeof meResponseSchema>;

/** Generic acknowledgement (e.g. logout, refresh). */
export const authAckSchema = z.object({
  success: z.boolean(),
});
export type AuthAck = z.infer<typeof authAckSchema>;
