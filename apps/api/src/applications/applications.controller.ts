import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  applyRequestSchema,
  updateApplicationStatusSchema,
  scheduleInterviewRequestSchema,
  respondInterviewRequestSchema,
  sendOfferRequestSchema,
  respondOfferRequestSchema,
  type ApplyRequest,
  type ApplicationLifecycle,
  type MyApplication,
  type RecruiterApplicant,
  type RecruiterDashboard,
  type StudentApplicationStats,
  type UpdateApplicationStatusInput,
  type ScheduleInterviewInput,
  type RespondInterviewInput,
  type SendOfferInput,
  type RespondOfferInput,
} from "@engineerdna/shared";
import { ApplicationsService } from "./applications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

@Controller()
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  /** POST /api/jobs/:id/apply — student submits an application. */
  @Post("jobs/:id/apply")
  apply(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(applyRequestSchema)) body: ApplyRequest,
  ): Promise<{ id: string }> {
    return this.applications.apply(user, id, body);
  }

  /** GET /api/student/applications — student's own applications. */
  @Get("student/applications")
  myApplications(@CurrentUser() user: User): Promise<MyApplication[]> {
    return this.applications.myApplications(user);
  }

  /** GET /api/student/applications/stats — student dashboard stats. */
  @Get("student/applications/stats")
  myStats(@CurrentUser() user: User): Promise<StudentApplicationStats> {
    return this.applications.myStats(user);
  }

  /** GET /api/recruiter/dashboard — headline counts for the recruiter dashboard. */
  @Get("recruiter/dashboard")
  @UseGuards(RolesGuard)
  @Roles("RECRUITER", "ADMIN")
  dashboard(@CurrentUser() user: User): Promise<RecruiterDashboard> {
    return this.applications.recruiterStats(user);
  }

  /** GET /api/recruiter/jobs/:id/applications — applicants for a recruiter's job. */
  @Get("recruiter/jobs/:id/applications")
  @UseGuards(RolesGuard)
  @Roles("RECRUITER", "ADMIN")
  listForJob(
    @CurrentUser() user: User,
    @Param("id") id: string,
  ): Promise<RecruiterApplicant[]> {
    return this.applications.listForJob(user, id);
  }

  /** PATCH /api/applications/:id/status — recruiter changes an application's status. */
  @Patch("applications/:id/status")
  @UseGuards(RolesGuard)
  @Roles("RECRUITER", "ADMIN")
  updateStatus(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateApplicationStatusSchema)) body: UpdateApplicationStatusInput,
  ): Promise<{ id: string; status: string }> {
    return this.applications.updateStatus(user, id, body);
  }

  /** GET /api/applications/:id/timeline — full lifecycle (recruiter or student party). */
  @Get("applications/:id/timeline")
  timeline(@CurrentUser() user: User, @Param("id") id: string): Promise<ApplicationLifecycle> {
    return this.applications.getLifecycle(user, id);
  }

  /** POST /api/applications/:id/interview — recruiter proposes an interview slot. */
  @Post("applications/:id/interview")
  @UseGuards(RolesGuard)
  @Roles("RECRUITER", "ADMIN")
  scheduleInterview(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(scheduleInterviewRequestSchema)) body: ScheduleInterviewInput,
  ): Promise<ApplicationLifecycle> {
    return this.applications.scheduleInterview(user, id, body);
  }

  /** POST /api/applications/:id/interview/respond — student accepts/declines. */
  @Post("applications/:id/interview/respond")
  respondInterview(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(respondInterviewRequestSchema)) body: RespondInterviewInput,
  ): Promise<ApplicationLifecycle> {
    return this.applications.respondInterview(user, id, body.action);
  }

  /** POST /api/applications/:id/offer — recruiter sends an offer. */
  @Post("applications/:id/offer")
  @UseGuards(RolesGuard)
  @Roles("RECRUITER", "ADMIN")
  sendOffer(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sendOfferRequestSchema)) body: SendOfferInput,
  ): Promise<ApplicationLifecycle> {
    return this.applications.sendOffer(user, id, body);
  }

  /** POST /api/applications/:id/offer/respond — student accepts/rejects. */
  @Post("applications/:id/offer/respond")
  respondOffer(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(respondOfferRequestSchema)) body: RespondOfferInput,
  ): Promise<ApplicationLifecycle> {
    return this.applications.respondOffer(user, id, body.action);
  }
}
