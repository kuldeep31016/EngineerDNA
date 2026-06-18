import { createHmac } from "node:crypto";
import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Razorpay from "razorpay";

/**
 * Thin wrapper over the Razorpay SDK (Test Mode). Holds the secret key on the
 * server only — the Key ID is the only thing ever exposed to the client.
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private client: Razorpay | null = null;

  constructor(private readonly config: ConfigService) {}

  get keyId(): string {
    return this.config.get<string>("RAZORPAY_KEY_ID") ?? "";
  }

  private get keySecret(): string {
    return this.config.get<string>("RAZORPAY_KEY_SECRET") ?? "";
  }

  private getClient(): Razorpay {
    if (!this.keyId || !this.keySecret) {
      throw new ServiceUnavailableException("Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }
    if (!this.client) this.client = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
    return this.client;
  }

  /** Create a Razorpay order. `amount` is in paise. */
  async createOrder(amount: number, receipt: string): Promise<{ id: string; amount: number; currency: string }> {
    const order = await this.getClient().orders.create({ amount, currency: "INR", receipt });
    return { id: order.id, amount: Number(order.amount), currency: order.currency };
  }

  /**
   * Verify the payment signature. Razorpay signs `${orderId}|${paymentId}` with
   * the key secret (HMAC-SHA256). Timing-safe-ish compare on the hex digests.
   */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!this.keySecret) return false;
    const expected = createHmac("sha256", this.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    return expected.length === signature.length && expected === signature;
  }
}
