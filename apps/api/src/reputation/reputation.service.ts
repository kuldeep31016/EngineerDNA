import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { EngineeringReputation, ReputationFactor } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { DnaService } from "../dna/dna.service";

// Fixed weights — a fair, comparable composite. Sum = 1.0.
const WEIGHTS = {
  verifiedSkills: 0.22,
  engineeringDna: 0.22,
  projectQuality: 0.18,
  testing: 0.12,
  security: 0.1,
  deployment: 0.1,
  consistency: 0.06,
} as const;

@Injectable()
export class ReputationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly dna: DnaService,
  ) {}

  /** A fair reputation score computed live from verified signals only. */
  async getReputation(user: User): Promise<EngineeringReputation> {
    const evidence = await this.evidence.getDeveloperEvidence(user);
    const used = evidence.items.filter((i) => i.strength === "USED");

    if (used.length === 0) {
      return {
        available: false,
        score: 0,
        tier: "Unranked",
        factors: [],
        strengths: [],
        improvements: ["Build evidence from your repositories — your reputation is earned from verified work."],
        generatedAt: new Date().toISOString(),
      };
    }

    const dna = await this.dna.getDna(user);
    const repos = await this.prisma.repository.findMany({
      where: { account: { userId: user.id } },
      select: { stars: true, pushedAt: true },
    });

    const categories = new Set(used.map((i) => i.category));
    const countCat = (cats: string[]) => used.filter((i) => cats.includes(i.category)).length;
    const totalStars = repos.reduce((s, r) => s + r.stars, 0);
    const lastPush = repos
      .map((r) => r.pushedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const weakDims = dna.scores.filter((s) => s.value < 45 && s.level !== "No evidence").map((s) => s.label);

    const testingN = countCat(["TESTING"]);
    const securityN = countCat(["AUTH"]) + used.filter((i) => /security|jwt|oauth|auth/i.test(i.technology)).length;
    const deployN = countCat(["DEPLOYMENT", "CLOUD"]);

    const factors: ReputationFactor[] = [
      {
        key: "verifiedSkills",
        label: "Verified skills",
        score: clamp(used.length * 9 + categories.size * 5),
        weight: WEIGHTS.verifiedSkills,
        reasoning: `${used.length} technologies verified across ${categories.size} categories.`,
        improve: "Build evidence for more technologies — and across more categories (frontend, backend, data, cloud).",
      },
      {
        key: "engineeringDna",
        label: "Engineering DNA",
        score: dna.overall,
        weight: WEIGHTS.engineeringDna,
        reasoning: `Developer DNA ${dna.overall}/100; strongest in ${dna.topStrengths.slice(0, 2).join(", ") || "—"}.`,
        improve: weakDims.length ? `Deepen weaker areas: ${weakDims.slice(0, 3).join(", ")}.` : "Keep deepening your strongest areas with harder projects.",
      },
      {
        key: "projectQuality",
        label: "Project quality",
        score: clamp(repos.length * 4 + Math.log2(totalStars + 1) * 12),
        weight: WEIGHTS.projectQuality,
        reasoning: `${repos.length} repositories, ${totalStars} total stars.`,
        improve: "Ship more substantial, original projects — depth and reception both count.",
      },
      {
        key: "testing",
        label: "Testing discipline",
        score: testingN > 0 ? clamp(45 + testingN * 22) : 0,
        weight: WEIGHTS.testing,
        reasoning: testingN > 0 ? `Tests found in ${testingN} ${testingN === 1 ? "context" : "contexts"}.` : "No automated tests detected yet.",
        improve: "Add automated tests (Jest, PyTest, JUnit, Vitest) and wire them into CI.",
      },
      {
        key: "security",
        label: "Security awareness",
        score: securityN > 0 ? clamp(40 + securityN * 20) : 0,
        weight: WEIGHTS.security,
        reasoning: securityN > 0 ? `Auth/security practices verified in ${securityN} ${securityN === 1 ? "place" : "places"}.` : "No auth/security signals detected yet.",
        improve: "Implement authentication and input validation (JWT/OAuth, hashing, sanitization).",
      },
      {
        key: "deployment",
        label: "Deployment & cloud",
        score: deployN > 0 ? clamp(40 + deployN * 18) : 0,
        weight: WEIGHTS.deployment,
        reasoning: deployN > 0 ? `Deployment/cloud verified in ${deployN} ${deployN === 1 ? "context" : "contexts"}.` : "No deployment or cloud evidence yet.",
        improve: "Containerize and deploy a project (Docker, CI/CD, a cloud platform).",
      },
      consistencyFactor(lastPush, evidence.timeline.length),
    ];

    const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
    const strengths = [...factors].filter((f) => f.score >= 65).sort((a, b) => b.score - a.score).map((f) => f.label).slice(0, 3);
    const improvements = [...factors].filter((f) => f.score < 60).sort((a, b) => a.score - b.score).map((f) => f.improve).slice(0, 3);

    return {
      available: true,
      score,
      tier: tierFor(score),
      factors,
      strengths,
      improvements,
      generatedAt: new Date().toISOString(),
    };
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function tierFor(score: number): string {
  if (score >= 88) return "Exceptional";
  if (score >= 72) return "Strong";
  if (score >= 55) return "Proficient";
  if (score >= 38) return "Developing";
  return "Emerging";
}

function consistencyFactor(lastPush: Date | undefined, timelineSpan: number): ReputationFactor {
  let recency = 0;
  let detail = "No recent activity detected.";
  if (lastPush) {
    const days = Math.floor((Date.now() - lastPush.getTime()) / 86_400_000);
    recency = days < 30 ? 100 : days < 90 ? 80 : days < 180 ? 55 : days < 365 ? 35 : 15;
    const when = days === 0 ? "today" : `${days} ${days === 1 ? "day" : "days"} ago`;
    detail = `Last push ${when}; ${timelineSpan} skills on your timeline.`;
  }
  return {
    key: "consistency",
    label: "Consistency",
    score: clamp(recency * 0.7 + Math.min(timelineSpan, 12) * 2.5),
    weight: WEIGHTS.consistency,
    reasoning: detail,
    improve: "Keep shipping — recent, steady commits and a growing skill timeline raise this.",
  };
}
