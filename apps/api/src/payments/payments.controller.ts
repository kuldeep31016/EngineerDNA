import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { User } from "@prisma/client";
import {
  createOrderRequestSchema,
  verifyPaymentRequestSchema,
  type CreateOrderInput,
  type CreateOrderResponse,
  type RecruiterSubscription,
  type VerifyPaymentInput,
} from "@engineerdna/shared";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

/** Payment endpoints (Razorpay). Recruiter/Admin only; no subscription needed. */
@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("RECRUITER", "ADMIN")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** POST /api/payments/create-order — create a Razorpay order for a plan. */
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post("create-order")
  createOrder(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createOrderRequestSchema)) body: CreateOrderInput,
  ): Promise<CreateOrderResponse> {
    return this.payments.createOrder(user, body);
  }

  /** POST /api/payments/verify — verify the payment signature on the backend. */
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post("verify")
  verify(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(verifyPaymentRequestSchema)) body: VerifyPaymentInput,
  ): Promise<RecruiterSubscription> {
    return this.payments.verify(user, body);
  }
}
