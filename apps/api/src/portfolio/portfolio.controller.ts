import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  extractResumeRequestSchema,
  updatePortfolioRequestSchema,
  type ExtractResumeInput,
  type Portfolio,
  type PublicPortfolio,
  type UpdatePortfolioInput,
} from "@engineerdna/shared";
import { PortfolioService } from "./portfolio.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Portfolio Generator endpoints (Module 18). */
@Controller("portfolio")
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  /** POST /api/portfolio/extract — resume text → structured JSON (1 LLM call). */
  @Post("extract")
  @UseGuards(JwtAuthGuard)
  extract(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(extractResumeRequestSchema)) body: ExtractResumeInput,
  ): Promise<Portfolio> {
    return this.portfolio.extract(user, body);
  }

  /** GET /api/portfolio — the current user's portfolio. */
  @Get()
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: User): Promise<Portfolio> {
    return this.portfolio.get(user);
  }

  /** PATCH /api/portfolio — save edits, theme, publish state. */
  @Patch()
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(updatePortfolioRequestSchema)) body: UpdatePortfolioInput,
  ): Promise<Portfolio> {
    return this.portfolio.update(user, body);
  }

  /** GET /api/portfolio/p/:slug — public, no auth (the shareable portfolio). */
  @Get("p/:slug")
  getPublic(@Param("slug") slug: string): Promise<PublicPortfolio> {
    return this.portfolio.getPublic(slug);
  }
}
