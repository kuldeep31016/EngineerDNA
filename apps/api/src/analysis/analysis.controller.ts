import { Controller, Get, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { RepositoryAnalysis } from "@engineerdna/shared";
import { AnalysisService } from "./analysis.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Repository analysis endpoints (Module 5). All require authentication. */
@Controller("github/repositories")
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /** POST /api/github/repositories/:id/analyze — start (or re-run) analysis. */
  @Post(":id/analyze")
  start(@CurrentUser() user: User, @Param("id") id: string): Promise<RepositoryAnalysis> {
    return this.analysisService.startAnalysis(user, id);
  }

  /** GET /api/github/repositories/:id/analysis — poll status + report. */
  @Get(":id/analysis")
  async get(@CurrentUser() user: User, @Param("id") id: string): Promise<RepositoryAnalysis> {
    const analysis = await this.analysisService.getAnalysis(user, id);
    if (!analysis) {
      throw new NotFoundException("This repository has not been analyzed yet.");
    }
    return analysis;
  }
}
