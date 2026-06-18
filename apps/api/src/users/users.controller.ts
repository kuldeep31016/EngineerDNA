import { Body, Controller, Patch, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { switchRoleRequestSchema, type AuthUser, type SwitchRoleInput } from "@engineerdna/shared";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** User self-service routes. */
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** PATCH /api/users/me/role — switch between Student and Recruiter. */
  @Patch("me/role")
  async setRole(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(switchRoleRequestSchema)) body: SwitchRoleInput,
  ): Promise<AuthUser> {
    const updated = await this.users.updateRole(user.id, body.role);
    return UsersService.toAuthUser(updated);
  }
}
