import { Injectable, NotFoundException } from "@nestjs/common";
import type { User } from "@prisma/client";
import { analysisReportSchema, type ProjectIntelligence } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { computeProjectIntelligence } from "./project-scorer";

@Injectable()
export class ProjectIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
  ) {}

  /** Compute the report card for a repo the caller owns, from analysis + evidence. */
  async getIntelligence(user: User, repoId: string): Promise<ProjectIntelligence> {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repoId },
      include: { account: true, analysis: true },
    });
    if (!repo || repo.account.userId !== user.id) {
      throw new NotFoundException("Repository not found");
    }

    const evidence = await this.evidence.getRepoEvidence(user, repoId);
    const report =
      repo.analysis?.status === "COMPLETED" && repo.analysis.report
        ? analysisReportSchema.parse(repo.analysis.report)
        : null;

    const result = computeProjectIntelligence({ repoName: repo.name, report, evidence });

    return {
      repositoryId: repo.id,
      ...result,
      generatedAt: new Date().toISOString(),
    };
  }
}
