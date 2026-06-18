import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  PLANS,
  type BillingItem,
  type InvoiceDetail,
  type PlanDef,
  type RecruiterSubscription,
} from "@engineerdna/shared";
import { SubscriptionService } from "./subscription.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/**
 * Subscription + plans endpoints. Recruiter/Admin only, but NOT subscription
 * gated — recruiters need these to view plans and check their status.
 */
@Controller("recruiter")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("RECRUITER", "ADMIN")
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  /** GET /api/recruiter/subscription — the recruiter's current subscription. */
  @Get("subscription")
  get(@CurrentUser() user: User): Promise<RecruiterSubscription> {
    return this.subscriptions.getSubscription(user);
  }

  /** GET /api/recruiter/plans — the plan catalogue. */
  @Get("plans")
  plans(): PlanDef[] {
    return PLANS;
  }

  /** GET /api/recruiter/billing — the recruiter's invoice history. */
  @Get("billing")
  billing(@CurrentUser() user: User): Promise<BillingItem[]> {
    return this.subscriptions.listBilling(user);
  }

  /** GET /api/recruiter/billing/:invoiceId — a single invoice. */
  @Get("billing/:invoiceId")
  invoice(@CurrentUser() user: User, @Param("invoiceId") invoiceId: string): Promise<InvoiceDetail> {
    return this.subscriptions.getInvoice(user, invoiceId);
  }
}
