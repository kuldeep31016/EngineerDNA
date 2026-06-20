import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  ossSearchRequestSchema,
  type OssRecommendation,
  type OssSearchInput,
  type OssSearchResult,
} from "@engineerdna/shared";
import { OssService } from "./oss.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

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

  /** POST /api/opensource/search — filter-driven repository search (cached). */
  @Post("search")
  search(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(ossSearchRequestSchema)) body: OssSearchInput,
  ): Promise<OssSearchResult> {
    return this.oss.search(user, body);
  }
}
