import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { VerificationResult } from "@engineerdna/shared";
import { VerificationService } from "./verification.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Skill Verification endpoints (Module 7). All require authentication. */
@Controller("skills")
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  /** POST /api/skills/verify — verify skills against evidence and persist. */
  @Post("verify")
  verify(@CurrentUser() user: User): Promise<VerificationResult> {
    return this.verification.verify(user, true);
  }

  /** GET /api/skills/verification — current verification verdicts (read-only). */
  @Get("verification")
  get(@CurrentUser() user: User): Promise<VerificationResult> {
    return this.verification.verify(user, false);
  }
}
