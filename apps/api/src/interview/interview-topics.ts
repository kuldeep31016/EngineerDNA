import type { DeveloperEvidenceItem } from "@engineerdna/shared";

/**
 * An interview topic, derived deterministically from USED evidence. Carries the
 * technologies and repositories that prove it so the LLM can ground questions in
 * the candidate's real work (and never invent experience they don't have).
 */
export interface InterviewTopic {
  theme: string;
  techs: string[];
  repos: string[];
}

// Map a USED technology to the engineering theme it best demonstrates. Order
// matters: more specific rules come before broader ones.
const THEME_RULES: { match: RegExp; theme: string }[] = [
  { match: /jwt|oauth|passport|auth0|bcrypt|session|keycloak/, theme: "Authentication & session security" },
  { match: /redis|memcached/, theme: "Caching & in-memory data stores" },
  { match: /kafka|rabbitmq|\bsqs\b|nats|pubsub/, theme: "Message queues & async processing" },
  { match: /websocket|socket\.io/, theme: "Real-time systems" },
  { match: /kubernetes|k8s|helm/, theme: "Container orchestration & scaling" },
  { match: /docker/, theme: "Containerization & deployment" },
  { match: /terraform|pulumi|cloudformation|ansible/, theme: "Infrastructure as code" },
  { match: /aws|gcp|google cloud|azure|heroku|vercel|netlify/, theme: "Cloud deployment & services" },
  { match: /graphql|apollo/, theme: "API design with GraphQL" },
  { match: /postgres|mysql|sqlite|mariadb|prisma|sequelize|typeorm/, theme: "Relational data modeling" },
  { match: /mongo|dynamodb|cassandra|firestore/, theme: "NoSQL data modeling" },
  { match: /react|vue|svelte|angular|next|nuxt/, theme: "Frontend architecture & state management" },
  { match: /spring|express|nest|django|flask|fastapi|rails|laravel|\bgin\b|fiber/, theme: "Backend API design" },
  { match: /tensorflow|pytorch|scikit|keras|huggingface|transformers/, theme: "Machine learning systems" },
  { match: /jest|pytest|junit|mocha|vitest|cypress|playwright|selenium/, theme: "Testing strategy & quality" },
  { match: /github actions|gitlab ci|jenkins|circleci|travis/, theme: "CI/CD pipelines" },
];

/**
 * Pick the interview themes a candidate can be fairly questioned on, strongest
 * first (more repositories = more evidence). Only USED evidence counts — a
 * merely MENTIONED dependency is not proof they can discuss it. Capped at five.
 */
export function selectInterviewTopics(items: DeveloperEvidenceItem[]): InterviewTopic[] {
  const used = items.filter((i) => i.strength === "USED");
  const byTheme = new Map<string, InterviewTopic>();

  for (const item of used) {
    const tech = item.technology.toLowerCase();
    const rule = THEME_RULES.find((r) => r.match.test(tech));
    if (!rule) continue;

    const topic = byTheme.get(rule.theme) ?? { theme: rule.theme, techs: [], repos: [] };
    if (!topic.techs.includes(item.technology)) topic.techs.push(item.technology);
    for (const repo of item.repositories) {
      if (!topic.repos.includes(repo)) topic.repos.push(repo);
    }
    byTheme.set(rule.theme, topic);
  }

  return [...byTheme.values()]
    .sort((a, b) => b.repos.length - a.repos.length || b.techs.length - a.techs.length)
    .slice(0, 5);
}
