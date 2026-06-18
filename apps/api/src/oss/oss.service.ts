import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import type { OssDifficulty, OssIssue, OssRecommendation, OssRepo } from "@engineerdna/shared";
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

@Injectable()
export class OssService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly github: GithubApiService,
    private readonly cipher: TokenCipherService,
  ) {}

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
