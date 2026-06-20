import { z } from "zod";

/**
 * Module 5 — Repository Analysis. An intelligent, student-readable engineering
 * report for a repository. The report is produced by an LLM from concrete repo
 * facts (file tree, manifests, languages); this module understands the repo, it
 * does NOT verify skills (that comes later).
 */

export const complexityLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export type ComplexityLevel = z.infer<typeof complexityLevelSchema>;

/** The structured engineering report. Kept LLM-friendly (no tight constraints). */
export const analysisReportSchema = z.object({
  summary: z.string().describe("What the project does, in plain language a student can follow."),
  languages: z.array(z.string()).describe("Programming languages actually used."),
  frameworks: z.array(z.string()).describe("Frameworks and major libraries."),
  databases: z.array(z.string()).describe("Database technologies."),
  authentication: z.array(z.string()).describe("Authentication methods detected."),
  deployment: z.array(z.string()).describe("Deployment / hosting methods."),
  buildTools: z.array(z.string()).describe("Build tools and package managers."),
  testing: z.string().describe("The testing approach, or that tests appear to be missing."),
  thirdPartyLibraries: z.array(z.string()).describe("Notable third-party libraries."),
  folderStructure: z.string().describe("How the project is organized, explained simply."),
  apiStructure: z.string().describe("API design/structure, or 'not applicable'."),
  complexity: z.object({
    level: complexityLevelSchema,
    reasoning: z.string(),
  }),
  missingBestPractices: z.array(z.string()).describe("Best practices that appear to be missing."),
  suggestedImprovements: z.array(z.string()).describe("Concrete suggestions to improve the project."),
});
export type AnalysisReport = z.infer<typeof analysisReportSchema>;

export const analysisStatusSchema = z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]);
export type AnalysisStatus = z.infer<typeof analysisStatusSchema>;

/** The analysis record returned by the API (status + report when ready). */
export const repositoryAnalysisSchema = z.object({
  repositoryId: z.string(),
  status: analysisStatusSchema,
  report: analysisReportSchema.nullable(),
  model: z.string().nullable(),
  error: z.string().nullable(),
  updatedAt: z.string(),
});
export type RepositoryAnalysis = z.infer<typeof repositoryAnalysisSchema>;

/** A repository's real file tree (flat paths from the GitHub API — no LLM).
 *  The client builds the nested, expandable tree from these paths. */
export const repoTreeSchema = z.object({
  paths: z.array(z.string()),
  truncated: z.boolean().default(false),
});
export type RepoTree = z.infer<typeof repoTreeSchema>;
