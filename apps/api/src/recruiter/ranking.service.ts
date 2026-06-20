import { Injectable, NotFoundException } from "@nestjs/common";
import type { Profile, User } from "@prisma/client";
import type { DeveloperEvidenceItem, RankedCandidate, RankingFactor, RankingResult } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { computeDnaScores } from "../dna/dna-scorer";

type ProfileWithUser = Profile & { user: Pick<User, "id" | "name" | "profileImage"> };

// Weighted factors — fixed weights so ranks stay comparable across candidates.
const WEIGHTS = {
  skillMatch: 0.3,
  engineeringDna: 0.25,
  evidenceDepth: 0.2,
  projectSignal: 0.15,
  recentActivity: 0.1,
} as const;

@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
  ) {}

  /** Rank verified candidates for a recruiter's job by its required skills. */
  async rankForJob(recruiter: User, jobId: string): Promise<RankingResult> {
    const job = await this.prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job || job.recruiterId !== recruiter.id) {
      throw new NotFoundException("Job post not found");
    }
    return this.rankBySkills(recruiter, (job.skills as unknown as string[]) ?? []);
  }

  /** Rank verified candidates against a set of required skills. */
  async rankBySkills(recruiter: User, skills: string[]): Promise<RankingResult> {
    const profiles = await this.prisma.profile.findMany({
      where: { isPublic: true },
      include: { user: { select: { id: true, name: true, profileImage: true } } },
    });

    const shortlistRows = await this.prisma.shortlist.findMany({
      where: { recruiterId: recruiter.id },
      select: { candidateId: true },
    });
    const shortlisted = new Set(shortlistRows.map((r) => r.candidateId));
    const required = skills.map((s) => s.trim()).filter(Boolean);

    const ranked: RankedCandidate[] = [];
    for (const profile of profiles) {
      const candidate = await this.rankCandidate(profile, required, shortlisted.has(profile.userId));
      if (!candidate) continue;
      // When ranking for specific skills, only surface relevant candidates.
      if (required.length > 0 && candidate.matchedSkills.length === 0) continue;
      ranked.push(candidate);
    }

    ranked.sort((a, b) => b.rankScore - a.rankScore || b.overall - a.overall);
    return { candidates: ranked, total: ranked.length };
  }

  private async rankCandidate(
    profile: ProfileWithUser,
    required: string[],
    shortlisted: boolean,
  ): Promise<RankedCandidate | null> {
    const items = await this.evidence.getPublicEvidenceItems(profile.userId);
    const used = items.filter((i) => i.strength === "USED");
    if (used.length === 0) return null;

    const { overall, topStrengths } = computeDnaScores(items);
    const matched = matchSkills(required, used);
    const publicRepos = await this.prisma.repository.findMany({
      where: { account: { userId: profile.userId }, isPrivate: false },
      select: { stars: true, pushedAt: true },
    });
    const interview = await this.prisma.interview.findFirst({
      where: { userId: profile.userId, status: "EVALUATED" },
      orderBy: { overallScore: "desc" },
      select: { overallScore: true },
    });

    const repoSpread = new Set(used.flatMap((u) => u.repositories)).size;
    const totalStars = publicRepos.reduce((s, r) => s + r.stars, 0);
    const lastPush = publicRepos
      .map((r) => r.pushedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const factors: RankingFactor[] = [
      skillMatchFactor(required, matched, used.length),
      {
        key: "engineeringDna",
        label: "Engineering DNA",
        score: overall,
        weight: WEIGHTS.engineeringDna,
        detail: topStrengths.length
          ? `Developer DNA ${overall}/100 — strongest in ${topStrengths.slice(0, 3).join(", ")}.`
          : `Developer DNA ${overall}/100.`,
      },
      {
        key: "evidenceDepth",
        label: "Evidence depth",
        score: clamp(used.length * 11 + Math.min(repoSpread, 6) * 4),
        weight: WEIGHTS.evidenceDepth,
        detail: `${used.length} verified ${used.length === 1 ? "technology" : "technologies"} across ${repoSpread} ${repoSpread === 1 ? "repository" : "repositories"}.`,
      },
      {
        key: "projectSignal",
        label: "Project signal",
        score: clamp(publicRepos.length * 5 + Math.log2(totalStars + 1) * 12),
        weight: WEIGHTS.projectSignal,
        detail: `${publicRepos.length} public ${publicRepos.length === 1 ? "repo" : "repos"}, ${totalStars} total stars.`,
      },
      recentActivityFactor(lastPush),
    ];

    const rankScore = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
    const matchScore = required.length > 0 ? Math.round((matched.length / required.length) * 100) : overall;

    return {
      id: profile.userId,
      name: profile.user.name ?? "Engineer",
      headline: profile.headline ?? null,
      location: profile.location ?? null,
      profileImage: profile.user.profileImage ?? null,
      overall,
      topStrengths,
      verifiedSkillCount: used.length,
      matchedSkills: matched,
      matchScore,
      publicRepoCount: repoSpread,
      shortlisted,
      rankScore,
      factors,
      interviewScore: interview?.overallScore ?? null,
    };
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function skillMatchFactor(required: string[], matched: string[], verifiedCount: number): RankingFactor {
  if (required.length === 0) {
    return {
      key: "skillMatch",
      label: "Skill coverage",
      score: clamp(verifiedCount * 12),
      weight: WEIGHTS.skillMatch,
      detail: `${verifiedCount} verified ${verifiedCount === 1 ? "skill" : "skills"} (no specific requirements given).`,
    };
  }
  const score = Math.round((matched.length / required.length) * 100);
  return {
    key: "skillMatch",
    label: "Required skill match",
    score,
    weight: WEIGHTS.skillMatch,
    detail: matched.length
      ? `Proven ${matched.length} of ${required.length} required skills: ${matched.join(", ")}.`
      : `None of the ${required.length} required skills are evidence-backed yet.`,
  };
}

function recentActivityFactor(lastPush: Date | undefined): RankingFactor {
  let score = 0;
  let detail = "No recent public activity.";
  if (lastPush) {
    const days = Math.floor((Date.now() - lastPush.getTime()) / 86_400_000);
    score = days < 30 ? 100 : days < 90 ? 80 : days < 180 ? 60 : days < 365 ? 40 : 20;
    const when = days === 0 ? "today" : `${days} ${days === 1 ? "day" : "days"} ago`;
    detail = `Last public push ${when}.`;
  }
  return { key: "recentActivity", label: "Recent activity", score, weight: WEIGHTS.recentActivity, detail };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9+#]/g, "");
}

/** Which required skills the candidate has real USED evidence for. */
function matchSkills(required: string[], used: DeveloperEvidenceItem[]): string[] {
  if (required.length === 0) return [];
  const techs = used.map((u) => norm(u.technology));
  const matched: string[] = [];
  for (const skill of required) {
    const q = norm(skill);
    if (!q) continue;
    if (techs.some((t) => t === q || (q.length >= 3 && (t.includes(q) || q.includes(t))))) matched.push(skill);
  }
  return matched;
}
