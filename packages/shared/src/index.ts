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
