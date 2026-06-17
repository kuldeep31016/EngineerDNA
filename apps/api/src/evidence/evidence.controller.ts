import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { DeveloperEvidence, RepoEvidenceItem } from "@engineerdna/shared";
import { EvidenceService } from "./evidence.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Evidence Engine endpoints (Module 6). All require authentication. */
@Controller()
@UseGuards(JwtAuthGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  /** POST /api/github/repositories/:id/evidence — extract evidence for a repo. */
  @Post("github/repositories/:id/evidence")
  extractForRepo(@CurrentUser() user: User, @Param("id") id: string): Promise<RepoEvidenceItem[]> {
    return this.evidenceService.extractForRepo(user, id);
  }

  /** GET /api/github/repositories/:id/evidence — stored evidence for a repo. */
  @Get("github/repositories/:id/evidence")
  getRepoEvidence(@CurrentUser() user: User, @Param("id") id: string): Promise<RepoEvidenceItem[]> {
    return this.evidenceService.getRepoEvidence(user, id);
  }

  /** POST /api/evidence/build — (re)extract evidence from all selected repos. */
  @Post("evidence/build")
  build(@CurrentUser() user: User): Promise<DeveloperEvidence> {
    return this.evidenceService.buildForSelected(user);
  }

  /** GET /api/evidence — the developer's rolled-up evidence + timeline. */
  @Get("evidence")
  getDeveloperEvidence(@CurrentUser() user: User): Promise<DeveloperEvidence> {
    return this.evidenceService.getDeveloperEvidence(user);
  }
}
