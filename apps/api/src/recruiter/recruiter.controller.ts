import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  searchCandidatesRequestSchema,
  type CandidateProfile,
  type CandidateSearchResult,
  type SearchCandidatesInput,
} from "@engineerdna/shared";
import { RecruiterService } from "./recruiter.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RecruiterSubscriptionGuard } from "../payments/recruiter-subscription.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Recruiter Dashboard (Module 14). Requires an active recruiter subscription. */
@Controller("recruiter")
@UseGuards(JwtAuthGuard, RecruiterSubscriptionGuard)
export class RecruiterController {
  constructor(private readonly recruiter: RecruiterService) {}

  /** POST /api/recruiter/search — search verified candidates by skills. */
  @Post("search")
  search(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(searchCandidatesRequestSchema)) body: SearchCandidatesInput,
  ): Promise<CandidateSearchResult> {
    return this.recruiter.search(user, body);
  }

  /** GET /api/recruiter/shortlist — the recruiter's shortlisted candidates. */
  @Get("shortlist")
  shortlist(@CurrentUser() user: User): Promise<CandidateSearchResult> {
    return this.recruiter.listShortlist(user);
  }

  /** GET /api/recruiter/candidates/:id — a candidate's verified profile. */
  @Get("candidates/:id")
  candidate(@CurrentUser() user: User, @Param("id") id: string): Promise<CandidateProfile> {
    return this.recruiter.getCandidate(user, id);
  }

  /** POST /api/recruiter/shortlist/:id — add a candidate to the shortlist. */
  @Post("shortlist/:id")
  async add(@CurrentUser() user: User, @Param("id") id: string): Promise<{ ok: true }> {
    await this.recruiter.addShortlist(user, id);
    return { ok: true };
  }

  /** DELETE /api/recruiter/shortlist/:id — remove a candidate from the shortlist. */
  @Delete("shortlist/:id")
  async remove(@CurrentUser() user: User, @Param("id") id: string): Promise<{ ok: true }> {
    await this.recruiter.removeShortlist(user, id);
    return { ok: true };
  }
}
