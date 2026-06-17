# EngineerDNA — Architecture

> **Philosophy:** Evidence Over Claims. Nothing is "verified" without evidence.

## Stack decision

EngineerDNA is built as a **single-language (TypeScript) monorepo**. The original
concept used three runtimes (Next.js + Spring Boot + FastAPI); we consolidated to
TypeScript for development velocity, a first-class LLM SDK ecosystem, and a single
toolchain — while keeping the original data strategy intact.

| Layer | Technology |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, Zustand |
| Backend | NestJS (clean architecture: modules → controllers → services → repositories) |
| Relational store (canonical) | PostgreSQL (via Prisma — added in a later module) |
| Graph store (projection) | Neo4j |
| Cache + job queue | Redis (BullMQ — added when async analysis lands) |
| LLM | Anthropic SDK + Vercel AI SDK (provider-abstracted) |
| Contracts | Zod schemas in `@engineerdna/shared` (types + runtime validation) |

## Request flow

```
Browser ──► Next.js (web) ──► NestJS (api) ──► Postgres / Redis / Neo4j
                                   │
                                   └──► LLM providers (server-side only)
```

The browser **never** talks to LLM providers or background workers directly —
only to the API.

## Workspace layout

```
EngineerDNA/
├── apps/
│   ├── web/      # Next.js frontend
│   └── api/      # NestJS backend
├── packages/
│   └── shared/   # Zod contracts, enums, constants (single source of truth)
├── docker/       # DB init / container assets
├── docs/         # Architecture & module docs
├── scripts/      # start / stop / reset helpers
└── .github/      # CI
```

## Architectural decisions locked in the foundation

These are planted now so later modules are reads, not rewrites:

1. **Skill provenance lifecycle** (`CLAIMED → VERIFYING → VERIFIED → REFUTED`)
   lives in `shared` from day one.
2. **Evidence is source-typed** (`GITHUB_REPO`, `INTERVIEW`, `LEARNING`,
   `OPEN_SOURCE`, `RESUME`) — the evidence substrate is not "the repo scanner."
3. **Postgres is canonical; Neo4j is a rebuildable projection.**
4. **Visibility is first-class** on profile/evidence items so recruiter views are
   a filter, not a special case.
5. **Scores are auditable** — every score will carry `{ value, reasoning,
   evidenceRefs[] }`.

## Module roadmap

Built module by module. See the project roadmap; the foundation here is Module 1.
