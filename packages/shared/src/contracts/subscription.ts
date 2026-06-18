import { z } from "zod";

/**
 * Recruiter subscriptions & payments (Razorpay). A recruiter must purchase a
 * plan before accessing recruiter features. Payment verification ALWAYS happens
 * on the backend — the frontend payment result is never trusted.
 */

export const planTierSchema = z.enum(["starter", "professional", "business"]);
export type PlanTier = z.infer<typeof planTierSchema>;

export interface PlanDef {
  id: PlanTier;
  name: string;
  /** Price in INR (rupees). The order amount in paise is price × 100. */
  price: number;
  /** Max active job posts; -1 = unlimited. */
  jobPostLimit: number;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    jobPostLimit: 2,
    features: ["2 Job Posts", "Recruiter Dashboard", "Candidate Search", "Basic Analytics"],
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    jobPostLimit: 5,
    features: ["5 Job Posts", "Recruiter Dashboard", "Advanced Candidate Search", "AI Candidate Matching", "Analytics"],
  },
  {
    id: "business",
    name: "Business",
    price: 199,
    jobPostLimit: -1,
    features: ["Unlimited Job Posts", "Recruiter Dashboard", "AI Candidate Matching", "Priority Support", "Advanced Analytics"],
  },
];

export function planById(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Resolve a plan from an order amount in paise (prices are distinct). */
export function planByAmount(amountPaise: number): PlanDef | undefined {
  return PLANS.find((p) => p.price * 100 === amountPaise);
}

/** Tier order for upgrade/downgrade comparisons. */
export const PLAN_RANK: Record<PlanTier, number> = { starter: 1, professional: 2, business: 3 };

export const subscriptionStatusSchema = z.enum(["active", "inactive", "expired"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** The recruiter's current subscription state. */
export const recruiterSubscriptionSchema = z.object({
  active: z.boolean(),
  plan: planTierSchema.nullable(),
  status: subscriptionStatusSchema,
  jobPostLimit: z.number(),
  jobPostsUsed: z.number(),
  amount: z.number(),
  currency: z.string(),
  startedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
});
export type RecruiterSubscription = z.infer<typeof recruiterSubscriptionSchema>;

/** A row in the billing history table. */
export const billingItemSchema = z.object({
  invoiceNumber: z.string(),
  plan: z.string(),
  amount: z.number(), // paise
  currency: z.string(),
  status: z.string(),
  purchasedOn: z.string(),
  expiresOn: z.string(),
  paymentMethod: z.string(),
});
export type BillingItem = z.infer<typeof billingItemSchema>;

/** Full invoice detail for /recruiter/billing/:invoiceId. */
export const invoiceDetailSchema = z.object({
  invoiceNumber: z.string(),
  recruiterName: z.string(),
  company: z.string().nullable(),
  plan: z.string(),
  razorpayPaymentId: z.string().nullable(),
  razorpayOrderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  gst: z.number(),
  purchaseDate: z.string(),
  expiryDate: z.string(),
  status: z.string(),
  paymentMethod: z.string(),
});
export type InvoiceDetail = z.infer<typeof invoiceDetailSchema>;

/** Body for creating a Razorpay order. */
export const createOrderRequestSchema = z.object({ plan: planTierSchema });
export type CreateOrderInput = z.infer<typeof createOrderRequestSchema>;

/** Server response with the order to hand to Razorpay Checkout. Secret never sent. */
export const createOrderResponseSchema = z.object({
  orderId: z.string(),
  amount: z.number(), // paise
  currency: z.string(),
  keyId: z.string(), // public Key ID only
  plan: planTierSchema,
});
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;

/** Body returned by Razorpay Checkout, verified on the backend. */
export const verifyPaymentRequestSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  plan: planTierSchema,
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentRequestSchema>;
