import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import type {
  DeveloperEvidenceItem,
  VerificationResult,
  VerifiedSkill,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { canonicalTech } from "./skill-matcher";

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
  ) {}

  /**
   * Verify every self-added skill against the developer's evidence.
   * A skill is VERIFIED only when there is USED evidence for it; otherwise it
   * stays CLAIMED. When `persist` is true, the verdict is written back to the
   * skill so the passport badges reflect it.
   */
  async verify(user: User, persist: boolean): Promise<VerificationResult> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: user.id },
      include: { skills: { orderBy: { createdAt: "asc" } } },
    });
    if (!profile) {
      return { skills: [], verifiedCount: 0, claimedCount: 0 };
    }

    // Index the developer's evidence by canonical technology name.
    const evidence = await this.evidence.getDeveloperEvidence(user);
    const byTech = new Map<string, DeveloperEvidenceItem>();
    for (const item of evidence.items) {
      const key = canonicalTech(item.technology);
      const existing = byTech.get(key);
      if (!existing || (item.strength === "USED" && existing.strength !== "USED")) {
        byTech.set(key, item);
      }
    }

    const results: VerifiedSkill[] = profile.skills.map((skill) => {
      const match = byTech.get(canonicalTech(skill.name));
      const isVerified = match?.strength === "USED";

      return {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        status: isVerified ? "VERIFIED" : "CLAIMED",
        confidence: isVerified ? match.confidence : 0,
        evidence: match
          ? {
              strength: match.strength,
              repositoryCount: match.repositoryCount,
              repositories: match.repositories,
              proofs: match.proofs,
            }
          : null,
      };
    });

    if (persist) {
      await this.prisma.$transaction(
        results.map((r) =>
          this.prisma.skill.update({
            where: { id: r.id },
            data: {
              status: r.status,
              confidence: r.confidence,
              verifiedAt: r.status === "VERIFIED" ? new Date() : null,
            },
          }),
        ),
      );
    }

    const verifiedCount = results.filter((r) => r.status === "VERIFIED").length;
    return { skills: results, verifiedCount, claimedCount: results.length - verifiedCount };
  }
}
