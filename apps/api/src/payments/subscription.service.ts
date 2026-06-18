import { Injectable, NotFoundException } from "@nestjs/common";
import type { Payment as PaymentRow, RecruiterSubscription as SubRow, User } from "@prisma/client";
import {
  planByAmount,
  planById,
  type BillingItem,
  type InvoiceDetail,
  type PlanTier,
  type RecruiterSubscription,
  type SubscriptionStatus,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";

const SUBSCRIPTION_DAYS = 30;
const DAY_MS = 86_400_000;

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
    const now = new Date();
    const data = {
      plan,
      status: "active",
      jobPostLimit: def.jobPostLimit,
      amount,
      currency: "INR",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      startedAt: now,
      expiresAt: new Date(now.getTime() + SUBSCRIPTION_DAYS * DAY_MS),
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
    const row = active ?? (await this.prisma.recruiterSubscription.findUnique({ where: { userId: user.id } }));
    return {
      active: !!active,
      plan: (row?.plan as PlanTier) ?? null,
      status: active ? "active" : ((row?.status as SubscriptionStatus) ?? "inactive"),
      jobPostLimit: row?.jobPostLimit ?? 0,
      jobPostsUsed: await this.activeJobCount(user.id),
      amount: row?.amount ?? 0,
      currency: row?.currency ?? "INR",
      startedAt: row?.startedAt ? row.startedAt.toISOString() : null,
      expiresAt: row?.expiresAt ? row.expiresAt.toISOString() : null,
    };
  }

  /** Billing history (paid invoices), newest first. */
  async listBilling(user: User): Promise<BillingItem[]> {
    const rows = await this.prisma.payment.findMany({
      where: { userId: user.id, status: "paid", invoiceNumber: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toBillingItem(r));
  }

  /** A single invoice the recruiter owns. */
  async getInvoice(user: User, invoiceNumber: string): Promise<InvoiceDetail> {
    const row = await this.prisma.payment.findFirst({ where: { invoiceNumber, userId: user.id } });
    if (!row) throw new NotFoundException("Invoice not found");
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId: user.id },
      select: { companyName: true },
    });
    return {
      invoiceNumber: row.invoiceNumber!,
      recruiterName: user.name ?? "Recruiter",
      company: profile?.companyName ?? null,
      plan: planByAmount(row.amount)?.name ?? "Plan",
      razorpayPaymentId: row.paymentId,
      razorpayOrderId: row.orderId,
      amount: row.amount,
      currency: row.currency,
      gst: 0,
      purchaseDate: row.createdAt.toISOString(),
      expiryDate: new Date(row.createdAt.getTime() + SUBSCRIPTION_DAYS * DAY_MS).toISOString(),
      status: row.status,
      paymentMethod: "Razorpay",
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

function toBillingItem(row: PaymentRow): BillingItem {
  return {
    invoiceNumber: row.invoiceNumber!,
    plan: planByAmount(row.amount)?.name ?? "Plan",
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    purchasedOn: row.createdAt.toISOString(),
    expiresOn: new Date(row.createdAt.getTime() + SUBSCRIPTION_DAYS * DAY_MS).toISOString(),
    paymentMethod: "Razorpay",
  };
}
