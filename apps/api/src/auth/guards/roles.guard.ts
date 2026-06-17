import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role, User } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Role-based authorization. Use AFTER JwtAuthGuard so the user is present.
 * Routes without @Roles() are allowed for any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: User }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient role for this resource");
    }
    return true;
  }
}
