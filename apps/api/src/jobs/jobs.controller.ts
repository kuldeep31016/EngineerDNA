import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { PublicJob } from "@engineerdna/shared";
import { JobsService, type JobListQuery } from "./jobs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Public job feed for students. Requires a valid session. */
@Controller("jobs")
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(
    @CurrentUser() user: User,
    @Query("q") q?: string,
    @Query("type") type?: string,
    @Query("workMode") workMode?: string,
    @Query("skills") skills?: string,
  ): Promise<PublicJob[]> {
    return this.jobs.list(user.id, { q, type, workMode, skills } as JobListQuery);
  }

  @Get(":id")
  get(@CurrentUser() user: User, @Param("id") id: string): Promise<PublicJob> {
    return this.jobs.get(user.id, id);
  }
}
