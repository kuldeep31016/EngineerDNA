import {
  createOrderResponseSchema,
  recruiterSubscriptionSchema,
  type CreateOrderInput,
  type CreateOrderResponse,
  type RecruiterSubscription,
  type VerifyPaymentInput,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

/** POST — create a Razorpay order for a plan (returns order + public Key ID). */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  return createOrderResponseSchema.parse(
    await apiFetch<unknown>("/payments/create-order", { method: "POST", body: JSON.stringify(input) }),
  );
}

/** POST — verify a payment on the backend; returns the activated subscription. */
export async function verifyPayment(input: VerifyPaymentInput): Promise<RecruiterSubscription> {
  return recruiterSubscriptionSchema.parse(
    await apiFetch<unknown>("/payments/verify", { method: "POST", body: JSON.stringify(input) }),
  );
}

/** GET — the recruiter's current subscription. */
export async function getSubscription(): Promise<RecruiterSubscription> {
  return recruiterSubscriptionSchema.parse(await apiFetch<unknown>("/recruiter/subscription"));
}
