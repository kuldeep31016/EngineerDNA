import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  planById,
  type CreateOrderInput,
  type CreateOrderResponse,
  type RecruiterSubscription,
  type VerifyPaymentInput,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RazorpayService } from "./razorpay.service";
import { SubscriptionService } from "./subscription.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  /** Create a Razorpay order for a plan and record a pending payment. */
  async createOrder(user: User, input: CreateOrderInput): Promise<CreateOrderResponse> {
    const plan = planById(input.plan)!;
    const amount = plan.price * 100; // paise
    const order = await this.razorpay.createOrder(amount, `edna_${input.plan}_${Date.now()}`);

    await this.prisma.payment.create({
      data: { userId: user.id, orderId: order.id, amount, status: "created", provider: "razorpay" },
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: this.razorpay.keyId, plan: input.plan };
  }

  /**
   * Verify a Razorpay payment ENTIRELY on the backend. The order must exist and
   * be unpaid, and the signature must match. Only then is the subscription
   * activated. The frontend's success callback is never trusted.
   */
  async verify(user: User, input: VerifyPaymentInput): Promise<RecruiterSubscription> {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId: input.razorpayOrderId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) throw new BadRequestException("Unknown order.");
    if (payment.status === "paid") {
      // Idempotent: a duplicate verify just returns the current subscription.
      return this.subscriptions.getSubscription(user);
    }

    const valid = this.razorpay.verifySignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature);
    if (!valid) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
      this.logger.warn(`Signature verification failed for order ${input.razorpayOrderId} (user ${user.id}).`);
      throw new BadRequestException("Payment verification failed.");
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: "paid", paymentId: input.razorpayPaymentId, signature: input.razorpaySignature },
    });
    await this.subscriptions.activate(user.id, input.plan, input.razorpayOrderId, input.razorpayPaymentId, payment.amount);

    return this.subscriptions.getSubscription(user);
  }
}
