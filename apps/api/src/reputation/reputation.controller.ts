import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { EngineeringReputation } from "@engineerdna/shared";
import { ReputationService } from "./reputation.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Engineering Reputation Score endpoint (Module 19). */
@Controller("reputation")
@UseGuards(JwtAuthGuard)
export class ReputationController {
  constructor(private readonly reputation: ReputationService) {}

  /** GET /api/reputation — fair, evidence-based reputation score. */
  @Get()
  get(@CurrentUser() user: User): Promise<EngineeringReputation> {
    return this.reputation.getReputation(user);
  }
}
