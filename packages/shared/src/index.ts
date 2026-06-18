/**
 * @engineerdna/shared
 *
 * The single source of truth shared by the web app and the API.
 * Contracts live here as Zod schemas so we get TypeScript types AND runtime
 * validation from one definition (this is our "OpenAPI-first" equivalent).
 *
 * Module 1 (foundation) only plants the architectural spine — no features.
 */

export * from "./constants";
export * from "./enums";
export * from "./contracts/health";
export * from "./contracts/auth";
export * from "./contracts/profile";
export * from "./contracts/github";
export * from "./contracts/analysis";
export * from "./contracts/evidence";
export * from "./contracts/verification";
export * from "./contracts/score";
export * from "./contracts/dna";
export * from "./contracts/project-intelligence";
export * from "./contracts/career";
export * from "./contracts/interview";
export * from "./contracts/resume";
export * from "./contracts/roadmap";
export * from "./contracts/recruiter";
export * from "./contracts/job";
export * from "./contracts/ranking";
export * from "./contracts/timeline";
export * from "./contracts/oss";
export * from "./contracts/portfolio";
