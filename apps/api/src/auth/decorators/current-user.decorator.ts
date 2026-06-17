import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@prisma/client";

/**
 * Injects the authenticated user (attached by JwtStrategy) into a handler:
 *   getProfile(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
