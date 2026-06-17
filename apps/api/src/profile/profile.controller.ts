import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  addSkillSchema,
  updateProfileSchema,
  type AddSkillInput,
  type Profile,
  type UpdateProfileInput,
} from "@engineerdna/shared";
import { ProfileService } from "./profile.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Engineering Passport endpoints — all scoped to the authenticated user. */
@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /** GET /api/profile/me — the caller's passport (created on first access). */
  @Get("me")
  getMe(@CurrentUser() user: User): Promise<Profile> {
    return this.profileService.getOrCreate(user);
  }

  /** PATCH /api/profile/me — update core fields and/or content sections. */
  @Patch("me")
  update(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(updateProfileSchema)) input: UpdateProfileInput,
  ): Promise<Profile> {
    return this.profileService.update(user, input);
  }

  /** POST /api/profile/me/skills — add a self-claimed skill. */
  @Post("me/skills")
  addSkill(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(addSkillSchema)) input: AddSkillInput,
  ): Promise<Profile> {
    return this.profileService.addSkill(user, input);
  }

  /** DELETE /api/profile/me/skills/:id — remove a skill the caller owns. */
  @Delete("me/skills/:id")
  removeSkill(@CurrentUser() user: User, @Param("id") id: string): Promise<Profile> {
    return this.profileService.removeSkill(user, id);
  }
}
