import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { reviewResumeRequestSchema, type ResumeReview, type ReviewResumeInput } from "@engineerdna/shared";
import { ResumeService } from "./resume.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Resume Intelligence endpoints (Module 12). All require authentication. */
@Controller("resume")
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly resume: ResumeService) {}

  /** GET /api/resume/review — the latest review (available:false if none). */
  @Get("review")
  get(@CurrentUser() user: User): Promise<ResumeReview> {
    return this.resume.getReview(user);
  }

  /** POST /api/resume/review — review a resume against verified evidence. */
  @Post("review")
  review(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(reviewResumeRequestSchema)) body: ReviewResumeInput,
  ): Promise<ResumeReview> {
    return this.resume.reviewResume(user, body);
  }
}
