import { z } from "zod";

/**
 * Module 18 — Portfolio Generator. A resume (PDF/DOCX) is parsed client-side to
 * plain text, then ONE lightweight LLM call extracts structured JSON (the LLM
 * only structures data — never generates HTML/CSS/React). The JSON is cached and
 * editable; reusable themed React components render it into a public portfolio.
 */

export const portfolioPersonalSchema = z.object({
  name: z.string().default(""),
  title: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  github: z.string().default(""),
  linkedin: z.string().default(""),
  portfolio: z.string().default(""),
});
export type PortfolioPersonal = z.infer<typeof portfolioPersonalSchema>;

export const portfolioEducationSchema = z.object({
  school: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  details: z.string().default(""),
});
export type PortfolioEducation = z.infer<typeof portfolioEducationSchema>;

export const portfolioExperienceSchema = z.object({
  company: z.string().default(""),
  role: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  location: z.string().default(""),
  highlights: z.array(z.string()).default([]),
});
export type PortfolioExperience = z.infer<typeof portfolioExperienceSchema>;

export const portfolioProjectSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
  techStack: z.array(z.string()).default([]),
  github: z.string().default(""),
  live: z.string().default(""),
  image: z.string().default(""),
  highlights: z.array(z.string()).default([]),
  duration: z.string().default(""),
});
export type PortfolioProject = z.infer<typeof portfolioProjectSchema>;

export const portfolioCertSchema = z.object({
  name: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  url: z.string().default(""),
});
export type PortfolioCert = z.infer<typeof portfolioCertSchema>;

export const portfolioSkillsSchema = z.object({
  languages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  cloud: z.array(z.string()).default([]),
});
export type PortfolioSkills = z.infer<typeof portfolioSkillsSchema>;

export const portfolioSocialSchema = z.object({
  label: z.string().default(""),
  url: z.string().default(""),
});
export type PortfolioSocial = z.infer<typeof portfolioSocialSchema>;

/** The single JSON shape every theme renders. */
export const portfolioDataSchema = z.object({
  personal: portfolioPersonalSchema.default({}),
  summary: z.string().default(""),
  education: z.array(portfolioEducationSchema).default([]),
  experience: z.array(portfolioExperienceSchema).default([]),
  projects: z.array(portfolioProjectSchema).default([]),
  skills: portfolioSkillsSchema.default({}),
  certifications: z.array(portfolioCertSchema).default([]),
  achievements: z.array(z.string()).default([]),
  socialLinks: z.array(portfolioSocialSchema).default([]),
});
export type PortfolioData = z.infer<typeof portfolioDataSchema>;

export const portfolioThemeSchema = z.enum(["modern", "minimal", "dark", "creative", "corporate"]);
export type PortfolioTheme = z.infer<typeof portfolioThemeSchema>;

export const PORTFOLIO_THEMES: { value: PortfolioTheme; label: string; blurb: string }[] = [
  { value: "modern", label: "Modern", blurb: "Indigo gradients, bold type" },
  { value: "minimal", label: "Minimal", blurb: "Clean, light, lots of space" },
  { value: "dark", label: "Dark", blurb: "Deep black, neon accent" },
  { value: "creative", label: "Creative", blurb: "Warm, playful, expressive" },
  { value: "corporate", label: "Corporate", blurb: "Crisp blue, professional" },
];

export const portfolioSchema = z.object({
  available: z.boolean(),
  data: portfolioDataSchema,
  theme: portfolioThemeSchema,
  published: z.boolean(),
  slug: z.string().nullable(),
  updatedAt: z.string(),
});
export type Portfolio = z.infer<typeof portfolioSchema>;

/** Public projection rendered on the shareable page. */
export const publicPortfolioSchema = z.object({
  data: portfolioDataSchema,
  theme: portfolioThemeSchema,
});
export type PublicPortfolio = z.infer<typeof publicPortfolioSchema>;

export const extractResumeRequestSchema = z.object({
  resumeText: z.string().trim().min(30).max(40000),
});
export type ExtractResumeInput = z.infer<typeof extractResumeRequestSchema>;

export const updatePortfolioRequestSchema = z.object({
  data: portfolioDataSchema.optional(),
  theme: portfolioThemeSchema.optional(),
  published: z.boolean().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,40}$/, "Use 3-40 lowercase letters, numbers or hyphens")
    .optional(),
});
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioRequestSchema>;
