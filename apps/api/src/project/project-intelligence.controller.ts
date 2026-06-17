import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { ProjectIntelligence } from "@engineerdna/shared";
import { ProjectIntelligenceService } from "./project-intelligence.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Project Intelligence endpoint (Module 9). */
@Controller("github/repositories")
@UseGuards(JwtAuthGuard)
export class ProjectIntelligenceController {
  constructor(private readonly service: ProjectIntelligenceService) {}

  /** GET /api/github/repositories/:id/intelligence — the repo's report card. */
  @Get(":id/intelligence")
  get(@CurrentUser() user: User, @Param("id") id: string): Promise<ProjectIntelligence> {
    return this.service.getIntelligence(user, id);
  }
}
