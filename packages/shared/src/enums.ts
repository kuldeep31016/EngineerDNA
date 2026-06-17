import { z } from "zod";

/**
 * Platform user roles. Authorization (Module 2) builds on these.
 */
export const UserRole = {
  STUDENT: "STUDENT",
  RECRUITER: "RECRUITER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const userRoleSchema = z.nativeEnum(UserRole);

/**
 * The evidence-provenance lifecycle for EVERY skill on the platform.
 *
 * This is the heart of EngineerDNA's philosophy ("Evidence Over Claims"):
 * a skill is never simply "known" — it travels from a self-asserted CLAIM,
 * through verification against real repository evidence, to VERIFIED (with a
 * confidence score and evidence references) or REFUTED.
 *
 * Modeled from the foundation so later modules (skills, verification, DNA)
 * never have to migrate plain-string skills into this lifecycle.
 */
export const SkillStatus = {
  CLAIMED: "CLAIMED",
  VERIFYING: "VERIFYING",
  VERIFIED: "VERIFIED",
  REFUTED: "REFUTED",
} as const;
export type SkillStatus = (typeof SkillStatus)[keyof typeof SkillStatus];
export const skillStatusSchema = z.nativeEnum(SkillStatus);

/**
 * OAuth identity providers a user can authenticate with.
 */
export const AuthProvider = {
  GITHUB: "GITHUB",
  GOOGLE: "GOOGLE",
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
export const authProviderSchema = z.nativeEnum(AuthProvider);

/**
 * Evidence sources. The evidence substrate is source-typed from day one so
 * non-repository signals (interviews, learning progress, open source) can be
 * first-class evidence later without forking the truth layer.
 */
export const EvidenceSource = {
  GITHUB_REPO: "GITHUB_REPO",
  INTERVIEW: "INTERVIEW",
  LEARNING: "LEARNING",
  OPEN_SOURCE: "OPEN_SOURCE",
  RESUME: "RESUME",
} as const;
export type EvidenceSource = (typeof EvidenceSource)[keyof typeof EvidenceSource];
export const evidenceSourceSchema = z.nativeEnum(EvidenceSource);

/**
 * Visibility tag carried by evidence/profile items so recruiter-facing views
 * are a filter rather than a special case (privacy by construction).
 */
export const Visibility = {
  PRIVATE: "PRIVATE",
  PUBLIC: "PUBLIC",
  VERIFIED_PUBLIC: "VERIFIED_PUBLIC",
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];
export const visibilitySchema = z.nativeEnum(Visibility);
