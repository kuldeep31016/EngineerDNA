import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { EngineeringTimeline } from "@engineerdna/shared";
import { TimelineService } from "./timeline.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Engineering Timeline endpoint (Module 16). */
@Controller("timeline")
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(private readonly timeline: TimelineService) {}

  /** GET /api/timeline — the developer's growth journey. */
  @Get()
  get(@CurrentUser() user: User): Promise<EngineeringTimeline> {
    return this.timeline.getTimeline(user);
  }
}
