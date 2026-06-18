import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  createJobRequestSchema,
  updateJobRequestSchema,
  type CandidateSearchResult,
  type CreateJobInput,
  type JobPost,
  type RankingResult,
  type UpdateJobInput,
} from "@engineerdna/shared";
import { JobService } from "./job.service";
import { RankingService } from "./ranking.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RecruiterSubscriptionGuard } from "../payments/recruiter-subscription.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Recruiter Job Posts. Requires an active recruiter subscription. */
@Controller("recruiter/jobs")
@UseGuards(JwtAuthGuard, RecruiterSubscriptionGuard)
export class JobController {
  constructor(
    private readonly jobs: JobService,
    private readonly ranking: RankingService,
  ) {}

  @Get()
  list(@CurrentUser() user: User): Promise<JobPost[]> {
    return this.jobs.list(user);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createJobRequestSchema)) body: CreateJobInput,
  ): Promise<JobPost> {
    return this.jobs.create(user, body);
  }

  @Get(":id/matches")
  matches(@CurrentUser() user: User, @Param("id") id: string): Promise<CandidateSearchResult> {
    return this.jobs.matches(user, id);
  }

  /** GET /api/recruiter/jobs/:id/ranking — candidates ranked, with reasons. */
  @Get(":id/ranking")
  getRanking(@CurrentUser() user: User, @Param("id") id: string): Promise<RankingResult> {
    return this.ranking.rankForJob(user, id);
  }

  @Get(":id")
  get(@CurrentUser() user: User, @Param("id") id: string): Promise<JobPost> {
    return this.jobs.get(user, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateJobRequestSchema)) body: UpdateJobInput,
  ): Promise<JobPost> {
    return this.jobs.update(user, id, body);
  }

  @Delete(":id")
  async remove(@CurrentUser() user: User, @Param("id") id: string): Promise<{ ok: true }> {
    await this.jobs.remove(user, id);
    return { ok: true };
  }
}
