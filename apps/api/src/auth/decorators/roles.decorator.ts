import { SetMetadata } from "@nestjs/common";
import type { Role } from "@prisma/client";

export const ROLES_KEY = "roles";

/**
 * Restrict a route to specific roles, enforced by RolesGuard:
 *   @Roles("ADMIN", "RECRUITER")
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
