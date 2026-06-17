# EngineerDNA — Project Context (for AI assistants)

> Paste this whole file into ChatGPT (or any assistant) to give it full context.

## What we're building

**EngineerDNA** — tagline **"Evidence Over Claims."** A platform that verifies a
developer's engineering ability from **real evidence** (GitHub, later LeetCode/
Codeforces/resume) instead of trusting resume claims. The output is a developer's
**"Engineering DNA"**: a verified engineering profile.

**Core philosophy:** never trust a claim. A skill moves through a lifecycle —
`CLAIMED → VERIFYING → VERIFIED → REFUTED` — and is only "verified" when backed by
real artifacts (e.g. "Docker" is verified by an actual Dockerfile + CI/CD, not a
resume bullet).

**Users:** students/developers, recruiters, college placement cells.

## Tech stack (single-language TypeScript monorepo)

- **Language/runtime:** TypeScript everywhere, Node 20
- **Frontend:** Next.js 15, React 19, Tailwind CSS, shadcn-style UI, Zustand
- **Backend:** NestJS (clean architecture: modules → controllers → services),
  Passport (OAuth), JWT
- **Databases:**
  - **PostgreSQL** = canonical store (users, profiles, etc.), via **Prisma** ORM
  - **Redis** = cache + job queue *(configured, not used yet)*
  - **Neo4j** = graph DB for the DNA relationships *(configured, not used yet)*
- **Validation:** Zod schemas in a shared package, used on **both** client & server
- **Tooling:** pnpm + Turborepo (monorepo), Docker Compose, ESLint/Prettier, Jest,
  GitHub Actions CI

## Architecture

```
Browser → Next.js (web) → NestJS (api) → Postgres / Redis / Neo4j
                               └→ LLM providers (server-side only, later)
```
The browser only talks to the API — never directly to the database or AI providers.

## Repo layout (monorepo)

```
apps/web        Next.js frontend
apps/api        NestJS backend (Prisma schema in apps/api/prisma)
packages/shared Zod contracts + enums shared by web & api
docker-compose.yml, docs/, scripts/
```

## Key design decisions

1. PostgreSQL is canonical; Neo4j will be a rebuildable projection of it.
2. Evidence is "source-typed" (github_repo, interview, learning, ...) so it's not
   just a repo scanner — later signals are first-class evidence too.
3. Skills are relational (carry the verification lifecycle); profile display
   content (experience, education, etc.) is stored as JSON.
4. Auth tokens live in HTTP-only cookies ONLY; frontend state holds the user
   object, never raw tokens.
5. Every future score will be auditable: `{ value, reasoning, evidenceRefs[] }`.

## Module roadmap (built module-by-module)

M1 Monorepo foundation · M2 Authentication · M3 Engineering Passport (profile) ·
M4 GitHub integration · M5 Repo analysis · M6 Evidence Engine (the keystone) ·
M7 Skill verification · M8 Developer DNA · M9 Project intelligence ·
M10 Career intelligence · M11 AI interviews · M12 Resume review · M13 Learning
roadmap · M14 Recruiter dashboard · M15 Candidate ranking · M16 Engineering
timeline · M17 Open-source recommendations · M18 Portfolio generator ·
M19 Reputation score · M20 AI Career Copilot.

## Progress so far

- **M1 Foundation ✅** — monorepo, Docker, CI, health endpoint.
- **M2 Authentication ✅** — GitHub + Google OAuth, JWT access (15m) + rotating
  hashed refresh tokens (7d) in HTTP-only cookies, roles (Student/Recruiter/Admin),
  guards, global exception filter. Prisma `User` + `RefreshToken`.
- **M3 Engineering Passport ✅** — editable verified-identity profile: header,
  about, skills (claimed/verified badges), experience/education/projects/
  certifications/achievements, plus locked placeholders for DNA / Verified Skills /
  Engineering Score / Career Intelligence. Prisma `Profile` + `Skill`.
- **Next: M4 GitHub Integration** (connect GitHub, import & list repos, choose
  which to analyze — import only, no analysis yet).

## How to run locally

```bash
cp .env.example .env          # set JWT_SECRET + GitHub OAuth keys
docker compose up -d postgres # database
pnpm db:migrate               # create tables
pnpm dev                      # web :3000, api :4000
```
Only Postgres + JWT_SECRET + GitHub OAuth are needed to run Modules 1–3.
Redis/Neo4j/LLM/AWS keys are for later modules.
