<div align="center">

# EngineerDNA

### Evidence Over Claims.

A platform that verifies engineering capability using **evidence** instead of resume claims.

</div>

---

## Vision

Hiring is broken: students list skills on resumes, recruiters search keywords, and
nobody verifies whether a developer has actually used those technologies.

**EngineerDNA** analyzes a developer's real work — GitHub, LeetCode, Codeforces,
résumé, portfolio — to build a **verified engineering profile**: their _Engineering
DNA_. A skill is never simply trusted; it travels from a self-asserted **claim** to
**verified** only when backed by real evidence (e.g. "Docker" is verified by an
actual Dockerfile, compose setup, and CI/CD — not a resume bullet).

## Tech stack

Single-language **TypeScript** monorepo (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
for why we consolidated from the original 3-runtime design).

- **Frontend:** Next.js 15 · React 19 · TypeScript · TailwindCSS · shadcn/ui · Zustand
- **Backend:** NestJS (clean architecture, DI)
- **Data:** PostgreSQL (canonical) · Neo4j (graph projection) · Redis (cache + jobs)
- **LLM:** Anthropic SDK + Vercel AI SDK
- **Tooling:** Turborepo · pnpm · ESLint · Prettier · Docker

## Folder structure

```
EngineerDNA/
├── apps/
│   ├── web/        # Next.js frontend
│   └── api/        # NestJS backend
├── packages/
│   └── shared/     # Zod contracts, enums, constants (shared by web + api)
├── docker/         # container assets
├── docs/           # architecture & module docs
├── scripts/        # start / stop / reset
├── .github/        # CI
└── docker-compose.yml
```

## Quick start (Docker — everything in one command)

```bash
cp .env.example .env        # fill in secrets as needed
docker compose up --build   # or: ./scripts/start.sh
```

Then open:

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API health | http://localhost:4000/api/health |
| Neo4j browser | http://localhost:7474 |

The landing page calls the API's `/health` endpoint and validates the response
against the **shared contract** — proving the full stack is wired end to end.

## Local development (without Docker)

Requires Node 20+ and pnpm (via Corepack).

```bash
corepack enable
pnpm install
pnpm dev          # runs shared (watch) + api + web together via Turborepo
```

You'll still want Postgres / Redis / Neo4j running — start just those with:

```bash
docker compose up postgres redis neo4j
```

## Useful commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build shared → api → web |
| `pnpm lint` | Lint every package |
| `pnpm format` | Prettier-format the repo |
| `pnpm db:seed` | Load a full demo dataset (recruiter, company, candidates, a complete hiring funnel) |
| `./scripts/stop.sh` | Stop the Docker stack |
| `./scripts/reset.sh` | Stop **and wipe** local DB volumes |

> **Demo data:** `pnpm db:seed` is idempotent and only touches demo accounts. It seeds a recruiter
> (`demo.recruiter@engineerdna.dev` / `demo1234`), the **Northwind Labs** company with open roles, five
> verified candidates with real evidence, and applications spanning every pipeline stage — including one
> hire — so the analytics funnel, application timelines, comparison, and dashboards all render with data.

## Development workflow

EngineerDNA is built **module by module**. Each module is self-contained,
independently buildable, and adds one capability without breaking the
"downstream reads only" property of the architecture.

- **Module 1 — Foundation** ✅ _(this)_: production-grade monorepo, Docker, CI.
- **Module 2 — Authentication**: GitHub/Google OAuth, JWT, refresh tokens, roles.
- **Module 3 — Engineering Passport**: the developer's verified identity profile.
- _…and onward through GitHub import, the Evidence Engine, Skill Verification,
  Developer DNA, and the recruiter + career intelligence surfaces._

## License

[MIT](LICENSE)
