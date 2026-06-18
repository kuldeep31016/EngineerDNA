import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  generateRoadmapRequestSchema,
  type GenerateRoadmapInput,
  type LearningRoadmap,
} from "@engineerdna/shared";
import { RoadmapService } from "./roadmap.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Learning Roadmap endpoints (Module 13). All require authentication. */
@Controller("roadmap")
@UseGuards(JwtAuthGuard)
export class RoadmapController {
  constructor(private readonly roadmap: RoadmapService) {}

  /** GET /api/roadmap — the current roadmap (available:false if none). */
  @Get()
  get(@CurrentUser() user: User): Promise<LearningRoadmap> {
    return this.roadmap.getRoadmap(user);
  }

  /** POST /api/roadmap — generate (or reuse) a roadmap for a role. */
  @Post()
  generate(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(generateRoadmapRequestSchema)) body: GenerateRoadmapInput,
  ): Promise<LearningRoadmap> {
    return this.roadmap.generateRoadmap(user, body);
  }
}
