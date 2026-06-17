import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  updateRepoSelectionSchema,
  type AuthAck,
  type GithubStatus,
  type Repository,
  type UpdateRepoSelectionInput,
} from "@engineerdna/shared";
import { GithubService } from "./github.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Repository import/listing endpoints (all require authentication). */
@Controller("github")
@UseGuards(JwtAuthGuard)
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  /** GET /api/github/status — is GitHub connected, and how many repos. */
  @Get("status")
  status(@CurrentUser() user: User): Promise<GithubStatus> {
    return this.githubService.getStatus(user);
  }

  /** POST /api/github/sync — (re)import repositories from GitHub. */
  @Post("sync")
  sync(@CurrentUser() user: User): Promise<Repository[]> {
    return this.githubService.sync(user);
  }

  /** GET /api/github/repositories — the imported repositories. */
  @Get("repositories")
  list(@CurrentUser() user: User): Promise<Repository[]> {
    return this.githubService.listRepositories(user);
  }

  /** GET /api/github/repositories/:id — a single imported repository. */
  @Get("repositories/:id")
  getOne(@CurrentUser() user: User, @Param("id") id: string): Promise<Repository> {
    return this.githubService.getRepository(user, id);
  }

  /** PATCH /api/github/repositories/:id — select/deselect for analysis. */
  @Patch("repositories/:id")
  setSelection(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateRepoSelectionSchema)) body: UpdateRepoSelectionInput,
  ): Promise<Repository> {
    return this.githubService.setSelection(user, id, body.selected);
  }

  /** DELETE /api/github/disconnect — remove the connection and imported repos. */
  @Delete("disconnect")
  async disconnect(@CurrentUser() user: User): Promise<AuthAck> {
    await this.githubService.disconnect(user);
    return { success: true };
  }
}
