import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  startInterviewRequestSchema,
  submitAnswersRequestSchema,
  type Interview,
  type InterviewListItem,
  type StartInterviewInput,
  type StartInterviewResult,
  type SubmitAnswersInput,
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

  /** POST /api/interview/start — generate a personalized interview for a role. */
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

  /** POST /api/interview/:id/answers — submit answers and get a graded report. */
  @Post(":id/answers")
  submit(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(submitAnswersRequestSchema)) body: SubmitAnswersInput,
  ): Promise<Interview> {
    return this.interview.submitAnswers(user, id, body);
  }
}
