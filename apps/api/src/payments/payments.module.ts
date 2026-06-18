import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { SubscriptionController } from "./subscription.controller";
import { PaymentsService } from "./payments.service";
import { SubscriptionService } from "./subscription.service";
import { RazorpayService } from "./razorpay.service";
import { RecruiterSubscriptionGuard } from "./recruiter-subscription.guard";

/**
 * Recruiter billing — Razorpay orders + backend-verified payments, subscription
 * state, plan catalogue, and the subscription guard that gates recruiter
 * features. Exports what other modules need (subscription checks + the guard).
 */
@Module({
  controllers: [PaymentsController, SubscriptionController],
  providers: [PaymentsService, SubscriptionService, RazorpayService, RecruiterSubscriptionGuard],
  exports: [SubscriptionService, RecruiterSubscriptionGuard],
})
export class PaymentsModule {}
