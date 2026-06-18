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
  /** Company name for recruiter accounts; null for students. */
  companyName: z.string().nullable(),
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

/** Recruiter registration — a deliberate sign-up with company details. */
export const recruiterSignupRequestSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  title: z.string().trim().max(120).optional(),
  companyWebsite: z.string().trim().max(200).optional(),
});
export type RecruiterSignupInput = z.infer<typeof recruiterSignupRequestSchema>;

/** Recruiter login with email + password. */
export const recruiterLoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});
export type RecruiterLoginInput = z.infer<typeof recruiterLoginRequestSchema>;
