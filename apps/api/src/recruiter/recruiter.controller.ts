import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  searchCandidatesRequestSchema,
  upsertRecruiterNoteRequestSchema,
  type CandidateProfile,
  type CandidateSearchResult,
  type RecruiterNote,
  type SearchCandidatesInput,
  type UpsertRecruiterNoteInput,
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

  /** GET /api/recruiter/candidates/:id/note — the recruiter's private note + rating. */
  @Get("candidates/:id/note")
  getNote(@CurrentUser() user: User, @Param("id") id: string): Promise<RecruiterNote | null> {
    return this.recruiter.getNote(user, id);
  }

  /** PUT /api/recruiter/candidates/:id/note — create or update the note + rating. */
  @Put("candidates/:id/note")
  upsertNote(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(upsertRecruiterNoteRequestSchema)) body: UpsertRecruiterNoteInput,
  ): Promise<RecruiterNote> {
    return this.recruiter.upsertNote(user, id, body);
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
