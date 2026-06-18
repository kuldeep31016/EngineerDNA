import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { OssRecommendation } from "@engineerdna/shared";
import { OssService } from "./oss.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Open Source Recommendation endpoint (Module 17). */
@Controller("opensource")
@UseGuards(JwtAuthGuard)
export class OssController {
  constructor(private readonly oss: OssService) {}

  /** GET /api/opensource — recommended repos/issues (?refresh=1 to rebuild). */
  @Get()
  get(@CurrentUser() user: User, @Query("refresh") refresh?: string): Promise<OssRecommendation> {
    return this.oss.getRecommendations(user, refresh === "1" || refresh === "true");
  }
}
