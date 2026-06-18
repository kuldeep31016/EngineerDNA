import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { askCopilotRequestSchema, type AskCopilotInput, type CopilotAnswer } from "@engineerdna/shared";
import { CopilotService } from "./copilot.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** AI Career Copilot endpoint (Module 20 — capstone). */
@Controller("copilot")
@UseGuards(JwtAuthGuard)
export class CopilotController {
  constructor(private readonly copilot: CopilotService) {}

  /** POST /api/copilot/ask — answer a career question, grounded in verified data. */
  @Post("ask")
  ask(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(askCopilotRequestSchema)) body: AskCopilotInput,
  ): Promise<CopilotAnswer> {
    return this.copilot.ask(user, body);
  }
}
