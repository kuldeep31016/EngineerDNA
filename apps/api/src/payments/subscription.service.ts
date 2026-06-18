import { Injectable } from "@nestjs/common";
import type { RecruiterSubscription as SubRow, User } from "@prisma/client";
import { planById, type PlanTier, type RecruiterSubscription, type SubscriptionStatus } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";

const SUBSCRIPTION_DAYS = 30;

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /** The active subscription row, or null when none / expired. */
  async getActive(userId: string): Promise<SubRow | null> {
    const row = await this.prisma.recruiterSubscription.findUnique({ where: { userId } });
    if (!row || row.status !== "active") return null;
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      await this.prisma.recruiterSubscription.update({ where: { userId }, data: { status: "expired" } });
      return null;
    }
    return row;
  }

  /** Activate (or upgrade) a subscription after a verified payment. */
  async activate(userId: string, plan: PlanTier, orderId: string, paymentId: string, amount: number): Promise<SubRow> {
    const def = planById(plan)!;
    const data = {
      plan,
      status: "active",
      jobPostLimit: def.jobPostLimit,
      amount,
      currency: "INR",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      expiresAt: new Date(Date.now() + SUBSCRIPTION_DAYS * 86_400_000),
    };
    return this.prisma.recruiterSubscription.upsert({
      where: { userId },
      create: { userId, jobPostsUsed: 0, ...data },
      update: data,
    });
  }

  /** The subscription as exposed to the client (active jobs counted live). */
  async getSubscription(user: User): Promise<RecruiterSubscription> {
    const active = await this.getActive(user.id);
    if (!active) {
      const row = await this.prisma.recruiterSubscription.findUnique({ where: { userId: user.id } });
      return {
        active: false,
        plan: (row?.plan as PlanTier) ?? null,
        status: (row?.status as SubscriptionStatus) ?? "inactive",
        jobPostLimit: row?.jobPostLimit ?? 0,
        jobPostsUsed: await this.activeJobCount(user.id),
        expiresAt: row?.expiresAt ? row.expiresAt.toISOString() : null,
      };
    }
    return {
      active: true,
      plan: active.plan as PlanTier,
      status: "active",
      jobPostLimit: active.jobPostLimit,
      jobPostsUsed: await this.activeJobCount(user.id),
      expiresAt: active.expiresAt ? active.expiresAt.toISOString() : null,
    };
  }

  /** Whether the recruiter may create another job post under their plan. */
  async canCreateJob(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
    const active = await this.getActive(userId);
    const limit = active?.jobPostLimit ?? 0;
    const used = await this.activeJobCount(userId);
    if (!active) return { allowed: false, limit, used };
    if (limit === -1) return { allowed: true, limit, used };
    return { allowed: used < limit, limit, used };
  }

  private activeJobCount(userId: string): Promise<number> {
    return this.prisma.jobPost.count({ where: { recruiterId: userId, status: "OPEN" } });
  }
}
