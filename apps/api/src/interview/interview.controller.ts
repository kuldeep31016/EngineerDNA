import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  gradeInterviewRequestSchema,
  interviewTurnRequestSchema,
  startInterviewRequestSchema,
  type GradeInterviewInput,
  type Interview,
  type InterviewListItem,
  type InterviewTurnInput,
  type InterviewTurnResult,
  type StartInterviewInput,
  type StartInterviewResult,
} from "@engineerdna/shared";
import { InterviewService } from "./interview.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** AI Interview Engine endpoints (Module 11). All require authentication. */
@Controller("interview")
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interview: InterviewService) {}

  /** POST /api/interview/start — begin an interview for a role (resume-aware). */
  @Post("start")
  start(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(startInterviewRequestSchema)) body: StartInterviewInput,
  ): Promise<StartInterviewResult> {
    return this.interview.startInterview(user, body);
  }

  /** GET /api/interview — past interviews (history / improvement over time). */
  @Get()
  list(@CurrentUser() user: User): Promise<InterviewListItem[]> {
    return this.interview.listInterviews(user);
  }

  /** GET /api/interview/:id — one interview with its questions and report. */
  @Get(":id")
  get(@CurrentUser() user: User, @Param("id") id: string): Promise<Interview> {
    return this.interview.getInterview(user, id);
  }

  /** POST /api/interview/:id/turn — answer the current question, get the next. */
  @Post(":id/turn")
  turn(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(interviewTurnRequestSchema)) body: InterviewTurnInput,
  ): Promise<InterviewTurnResult> {
    return this.interview.submitTurn(user, id, body.answer);
  }

  /** POST /api/interview/:id/grade — grade the conversation and return a report. */
  @Post(":id/grade")
  grade(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(gradeInterviewRequestSchema)) body: GradeInterviewInput,
  ): Promise<Interview> {
    return this.interview.gradeInterview(user, id, body.proctoring);
  }
}
