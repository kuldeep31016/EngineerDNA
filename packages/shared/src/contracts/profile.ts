import { z } from "zod";
import { skillStatusSchema } from "../enums";
import { authUserSchema } from "./auth";

/**
 * The Engineering Passport contracts. These Zod schemas are the single source
 * of truth for the profile shape and are used to validate on BOTH the client
 * and the API.
 *
 * The rich "content" sections (education, experience, ...) are free-form lists
 * the developer maintains. Skills are modeled separately and relationally
 * because they carry the verification lifecycle that later modules act on.
 */

const id = z.string().min(1);

export const educationItemSchema = z.object({
  id,
  school: z.string().min(1),
  degree: z.string().default(""),
  fieldOfStudy: z.string().default(""),
  startYear: z.string().default(""),
  endYear: z.string().default(""),
  description: z.string().default(""),
});
export type EducationItem = z.infer<typeof educationItemSchema>;

export const experienceItemSchema = z.object({
  id,
  company: z.string().min(1),
  role: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  description: z.string().default(""),
});
export type ExperienceItem = z.infer<typeof experienceItemSchema>;

export const projectItemSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().default(""),
  url: z.string().default(""),
  technologies: z.string().default(""),
});
export type ProjectItem = z.infer<typeof projectItemSchema>;

export const achievementItemSchema = z.object({
  id,
  title: z.string().min(1),
  date: z.string().default(""),
  description: z.string().default(""),
});
export type AchievementItem = z.infer<typeof achievementItemSchema>;

export const certificationItemSchema = z.object({
  id,
  name: z.string().min(1),
  issuer: z.string().default(""),
  issueDate: z.string().default(""),
  url: z.string().default(""),
});
export type CertificationItem = z.infer<typeof certificationItemSchema>;

export const socialLinkSchema = z.object({
  id,
  label: z.string().min(1),
  url: z.string().min(1),
});
export type SocialLink = z.infer<typeof socialLinkSchema>;

/** A skill on the passport. Self-added skills start as CLAIMED. */
export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  status: skillStatusSchema,
});
export type Skill = z.infer<typeof skillSchema>;

/** The full passport returned by GET /profile/me. */
export const profileSchema = z.object({
  user: authUserSchema,
  headline: z.string().nullable(),
  about: z.string().nullable(),
  location: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  githubUsername: z.string().nullable(),
  leetcodeUsername: z.string().nullable(),
  codeforcesUsername: z.string().nullable(),
  openToWork: z.boolean(),
  isPublic: z.boolean(),
  education: z.array(educationItemSchema),
  experience: z.array(experienceItemSchema),
  projects: z.array(projectItemSchema),
  achievements: z.array(achievementItemSchema),
  certifications: z.array(certificationItemSchema),
  socialLinks: z.array(socialLinkSchema),
  skills: z.array(skillSchema),
});
export type Profile = z.infer<typeof profileSchema>;

/** Editable fields accepted by PATCH /profile/me. */
export const updateProfileSchema = z
  .object({
    headline: z.string().max(120).nullish(),
    about: z.string().max(5000).nullish(),
    location: z.string().max(120).nullish(),
    websiteUrl: z.string().max(300).nullish(),
    githubUsername: z.string().max(80).nullish(),
    leetcodeUsername: z.string().max(80).nullish(),
    codeforcesUsername: z.string().max(80).nullish(),
    openToWork: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    education: z.array(educationItemSchema).optional(),
    experience: z.array(experienceItemSchema).optional(),
    projects: z.array(projectItemSchema).optional(),
    achievements: z.array(achievementItemSchema).optional(),
    certifications: z.array(certificationItemSchema).optional(),
    socialLinks: z.array(socialLinkSchema).optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Body for POST /profile/me/skills. */
export const addSkillSchema = z.object({
  name: z.string().min(1).max(60),
  category: z.string().max(60).optional(),
});
export type AddSkillInput = z.infer<typeof addSkillSchema>;
