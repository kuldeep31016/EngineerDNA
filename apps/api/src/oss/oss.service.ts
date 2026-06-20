import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import type {
  OssDifficulty,
  OssIssue,
  OssRecommendation,
  OssRepo,
  OssSearchInput,
  OssSearchResult,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import {
  GithubApiService,
  type GithubSearchIssue,
  type GithubSearchRepo,
} from "../github/github-api.service";
import { TokenCipherService } from "../common/security/token-cipher.service";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_SKILLS = 4;
const MAX_REPOS = 9;
const REPOS_WITH_ISSUES = 6;
// In-memory cache for the Explore search — the SAME filter combo from any user
// reuses one GitHub call, so we stay well under GitHub's search rate limit and
// pages load instantly. (Redis is the multi-instance scale path.)
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class OssService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly github: GithubApiService,
    private readonly cipher: TokenCipherService,
  ) {}

  private readonly searchCache = new Map<string, { at: number; result: OssSearchResult }>();

  /**
   * Explore: filter-driven GitHub repository search. Builds a GitHub Search
   * query from the chosen filters and caches the result in memory by query, so
   * repeated/shared filter combos don't re-hit GitHub (rate-limit friendly).
   */
  async search(user: User, filters: OssSearchInput): Promise<OssSearchResult> {
    const account = await this.prisma.githubAccount.findUnique({ where: { userId: user.id } });
    if (!account) return { repos: [], total: 0, query: "", cached: false };

    const query = buildSearchQuery(filters);
    const key = `${query}::${filters.sort}`;

    const hit = this.searchCache.get(key);
    if (hit && Date.now() - hit.at < SEARCH_CACHE_TTL_MS) {
      return { ...hit.result, cached: true };
    }

    const token = this.cipher.decrypt(account.accessToken);
    const found = await this.github.searchRepositories(token, query, 18, filters.sort).catch(() => []);

    const repos: OssRepo[] = found
      .filter((r) => !r.archived)
      .map((r) => ({
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        topics: (r.topics ?? []).slice(0, 6),
        matchedSkill: filters.language ?? filters.topic ?? "search",
        goodFirstIssues: 0,
        contributeUrl: `${r.html_url}/contribute`,
        issues: [],
      }));

    const result: OssSearchResult = { repos, total: repos.length, query, cached: false };
    this.searchCache.set(key, { at: Date.now(), result });
    return result;
  }

  /** Recommend OSS repos/issues for the developer's verified skills (cached). */
  async getRecommendations(user: User, refresh = false): Promise<OssRecommendation> {
    const account = await this.prisma.githubAccount.findUnique({ where: { userId: user.id } });
    if (!account) {
      return unavailable("Connect your GitHub account to get open-source recommendations.");
    }

    const { items } = await this.evidence.getDeveloperEvidence(user);
    const skills = pickSkills(items.filter((i) => i.strength === "USED"));
    if (skills.length === 0) {
      return unavailable("Build evidence from your repositories first — we match OSS to your verified skills.");
    }

    const skillsHash = createHash("sha256").update(skills.map((s) => s.name.toLowerCase()).sort().join("|")).digest("hex");
    const cached = await this.prisma.ossRecommendation.findUnique({ where: { userId: user.id } });
    if (
      !refresh &&
      cached &&
      cached.skillsHash === skillsHash &&
      Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS
    ) {
      return cached.payload as unknown as OssRecommendation;
    }

    const token = this.cipher.decrypt(account.accessToken);
    const repos = await this.buildRecommendations(token, skills);

    const payload: OssRecommendation = {
      available: true,
      reason: null,
      skills: skills.map((s) => s.name),
      repos,
      generatedAt: new Date().toISOString(),
    };

    await this.prisma.ossRecommendation.upsert({
      where: { userId: user.id },
      create: { userId: user.id, skillsHash, payload: payload as unknown as Prisma.InputJsonValue },
      update: { skillsHash, payload: payload as unknown as Prisma.InputJsonValue },
    });

    return payload;
  }

  private async buildRecommendations(
    token: string,
    skills: { name: string; isLanguage: boolean }[],
  ): Promise<OssRepo[]> {
    // One repo search per skill (parallel), then dedupe and rank by stars.
    const perSkill = await Promise.all(
      skills.map(async (skill) => {
        const qualifier = skill.isLanguage ? `language:"${skill.name}"` : `topic:${slug(skill.name)}`;
        const query = `${qualifier} good-first-issues:>2 stars:>50 archived:false`;
        const results = await this.github.searchRepositories(token, query, 8).catch(() => []);
        return results.map((r) => ({ repo: r, matchedSkill: skill.name }));
      }),
    );

    const byName = new Map<string, { repo: GithubSearchRepo; matchedSkill: string }>();
    for (const { repo, matchedSkill } of perSkill.flat()) {
      if (repo.archived) continue;
      if (!byName.has(repo.full_name)) byName.set(repo.full_name, { repo, matchedSkill });
    }

    const ranked = [...byName.values()]
      .sort((a, b) => b.repo.stargazers_count - a.repo.stargazers_count)
      .slice(0, MAX_REPOS);

    // Fetch a few good-first issues for the top repos (parallel, best-effort).
    const issueLists = await Promise.all(
      ranked.map(async ({ repo }, i) => {
        if (i >= REPOS_WITH_ISSUES) return [] as GithubSearchIssue[];
        const q = `repo:${repo.full_name} is:issue is:open label:"good first issue"`;
        return this.github.searchIssues(token, q, 4).catch(() => []);
      }),
    );

    return ranked.map(({ repo, matchedSkill }, i) => ({
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      topics: (repo.topics ?? []).slice(0, 6),
      matchedSkill,
      goodFirstIssues: issueLists[i]!.length,
      contributeUrl: `${repo.html_url}/contribute`,
      issues: issueLists[i]!.map(toIssue),
    }));
  }
}

function unavailable(reason: string): OssRecommendation {
  return { available: false, reason, skills: [], repos: [], generatedAt: new Date().toISOString() };
}

// GitHub's language qualifier uses lowercase slugs for a few names.
const GH_LANG: Record<string, string> = { "c++": "cpp", "c#": "csharp" };
function ghLang(lang: string): string {
  const key = lang.toLowerCase();
  return GH_LANG[key] ?? key;
}
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

/** Turn the Explore filters into a single GitHub Search query string. */
function buildSearchQuery(f: OssSearchInput): string {
  const parts = ["archived:false"];
  if (f.language) parts.push(`language:${ghLang(f.language)}`);
  if (f.topic) parts.push(`topic:${f.topic}`);
  if (f.license) parts.push(`license:${f.license}`);
  if (f.goodFirstIssue) parts.push("good-first-issues:>0");
  if (f.helpWanted) parts.push("help-wanted-issues:>0");
  if (f.recentlyUpdated) parts.push(`pushed:>${isoDaysAgo(30)}`);
  // Always include a positive star qualifier — GitHub search needs a real term.
  parts.push(`stars:>=${Math.max(f.minStars ?? 0, 1)}`);
  return parts.join(" ");
}

/** Pick the strongest verified skills to search with — languages first. */
function pickSkills(used: { technology: string; category: string; repositoryCount: number }[]): {
  name: string;
  isLanguage: boolean;
}[] {
  const languages = used
    .filter((i) => i.category === "LANGUAGE")
    .sort((a, b) => b.repositoryCount - a.repositoryCount);
  const frameworks = used
    .filter((i) => i.category === "FRAMEWORK")
    .sort((a, b) => b.repositoryCount - a.repositoryCount);

  const picks: { name: string; isLanguage: boolean }[] = [];
  for (const l of languages) picks.push({ name: l.technology, isLanguage: true });
  for (const f of frameworks) picks.push({ name: f.technology, isLanguage: false });
  return picks.slice(0, MAX_SKILLS);
}

function toIssue(issue: GithubSearchIssue): OssIssue {
  const labels = issue.labels.map((l) => l.name);
  return { title: issue.title, url: issue.html_url, difficulty: difficultyFrom(labels), labels: labels.slice(0, 4) };
}

function difficultyFrom(labels: string[]): OssDifficulty {
  const text = labels.join(" ").toLowerCase();
  if (/advanced|expert|hard|complex/.test(text)) return "advanced";
  if (/intermediate|medium|help wanted/.test(text)) return "intermediate";
  return "beginner";
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
