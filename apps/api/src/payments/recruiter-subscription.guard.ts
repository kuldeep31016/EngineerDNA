import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import { SubscriptionService } from "./subscription.service";

/**
 * Guards recruiter FEATURE routes. Use after JwtAuthGuard. Requires the
 * RECRUITER role AND an active subscription (Admins bypass the subscription
 * check). A missing subscription returns 403 with code SUBSCRIPTION_REQUIRED so
 * the frontend can route the recruiter to the plans page.
 */
@Injectable()
export class RecruiterSubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptions: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest<{ user?: User }>();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      throw new ForbiddenException("Recruiter access only.");
    }
    if (user.role === "ADMIN") return true;

    const active = await this.subscriptions.getActive(user.id);
    if (!active) {
      throw new ForbiddenException({ message: "An active recruiter subscription is required.", code: "SUBSCRIPTION_REQUIRED" });
    }
    return true;
  }
}
