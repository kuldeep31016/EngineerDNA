"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, Loader2, ShieldCheck } from "lucide-react";
import {
  PLAN_RANK,
  PLANS,
  planById,
  type BillingItem,
  type PlanDef,
  type PlanTier,
  type RecruiterSubscription,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { createOrder, getBilling, getSubscription, verifyPayment } from "@/services/billing";

type Status =
  | { kind: "idle" }
  | { kind: "processing"; plan: PlanTier }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "cancelled" }
  | { kind: "failed"; message: string };

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}
const rupees = (paise: number) => `₹${Math.round(paise / 100)}`;

function BillingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<RecruiterSubscription | null>(null);
  const [billing, setBilling] = useState<BillingItem[]>([]);
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const refresh = () => {
    void getSubscription().then(setSubscription).catch(() => {});
    void getBilling().then(setBilling).catch(() => {});
  };
  useEffect(refresh, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) return setSdkReady(true);
    if (document.getElementById("rzp-sdk")) return;
    const s = document.createElement("script");
    s.id = "rzp-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => setSdkReady(true);
    s.onerror = () => setStatus({ kind: "failed", message: "Couldn't load the payment SDK. Check your connection." });
    document.body.appendChild(s);
  }, []);

  async function purchase(plan: PlanDef) {
    if (!sdkReady || !window.Razorpay) {
      setStatus({ kind: "failed", message: "Payment SDK isn't ready yet — try again in a moment." });
      return;
    }
    setStatus({ kind: "processing", plan: plan.id });
    try {
      const order = await createOrder({ plan: plan.id });
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "EngineerDNA",
        description: `${plan.name} plan`,
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        theme: { color: "#6366F1" },
        modal: { ondismiss: () => setStatus((s) => (s.kind === "verifying" || s.kind === "success" ? s : { kind: "cancelled" })) },
        handler: async (resp) => {
          setStatus({ kind: "verifying" });
          try {
            const sub = await verifyPayment({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              plan: plan.id,
            });
            setSubscription(sub);
            setStatus({ kind: "success" });
            setTimeout(() => router.push("/recruiter"), 2000);
          } catch {
            setStatus({ kind: "failed", message: "We couldn't verify your payment. If you were charged, contact support." });
          }
        },
      });
      rzp.on("payment.failed", (r) => setStatus({ kind: "failed", message: r.error?.description ?? "Payment failed. Please try again." }));
      rzp.open();
    } catch {
      setStatus({ kind: "failed", message: "Couldn't start checkout. Make sure payments are configured, then retry." });
    }
  }

  const processingPlan = status.kind === "processing" ? status.plan : null;
  const sub = subscription;
  const curRank = sub?.active && sub.plan ? PLAN_RANK[sub.plan] : 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription &amp; Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your recruiter plan, payments and invoices.</p>
      </div>

      <StatusBanner status={status} onDashboard={() => router.push("/recruiter")} />

      {/* Section 1 — Current plan */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current plan</h2>
        {sub?.active ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-semibold">{planById(sub.plan!)?.name ?? sub.plan}</h3>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">Active</span>
              </div>
              <button
                onClick={() => purchase(planById(sub.plan!)!)}
                disabled={status.kind === "processing" || status.kind === "verifying"}
                className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
              >
                Renew plan
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Purchased on" value={fmtDate(sub.startedAt)} />
              <Stat label="Expires on" value={fmtDate(sub.expiresAt)} />
              <Stat label="Remaining job posts" value={sub.jobPostLimit === -1 ? "Unlimited" : String(Math.max(0, sub.jobPostLimit - sub.jobPostsUsed))} />
              <Stat label="Remaining days" value={String(daysLeft(sub.expiresAt))} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">No active subscription</h3>
            <p className="mt-1 text-sm text-muted-foreground">Purchase a plan below to unlock recruiter features.</p>
          </div>
        )}
      </section>

      {/* Section 2 — Available plans */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Available plans</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const owned = sub?.active && sub.plan === plan.id;
            const isUpgrade = sub?.active && PLAN_RANK[plan.id] > curRank;
            const busy = processingPlan === plan.id || status.kind === "verifying";
            const popular = plan.id === "professional";
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                  owned ? "border-emerald-500/40" : popular ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {owned ? (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">Current</span>
                  ) : popular ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">Popular</span>
                  ) : null}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">₹{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/ 30 days</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => purchase(plan)}
                  disabled={!!owned || busy || !sdkReady}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    popular && !owned ? "bg-brand text-white hover:opacity-90" : "border border-border hover:bg-accent"
                  }`}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                    </>
                  ) : owned ? (
                    "Current plan"
                  ) : isUpgrade ? (
                    "Upgrade"
                  ) : sub?.active ? (
                    "Switch plan"
                  ) : (
                    `Purchase ${plan.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3 — Billing history */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Billing history</h2>
        {billing.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No payments yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Purchased</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b) => (
                  <tr key={b.invoiceNumber} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium tabular-nums">{b.invoiceNumber}</td>
                    <td className="px-4 py-3">{b.plan}</td>
                    <td className="px-4 py-3 tabular-nums">{rupees(b.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium capitalize text-emerald-300">{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.purchasedOn)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.expiresOn)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <Link href={`/recruiter/billing/${b.invoiceNumber}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Download className="h-3.5 w-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout via Razorpay (Test Mode). Payments verified on our servers.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatusBanner({ status, onDashboard }: { status: Status; onDashboard: () => void }) {
  if (status.kind === "idle" || status.kind === "processing") return null;
  const map = {
    verifying: { cls: "border-border bg-card text-muted-foreground", text: "Verifying your payment…" },
    success: { cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200", text: "Payment successful — your subscription is active. Redirecting to dashboard…" },
    cancelled: { cls: "border-amber-500/30 bg-amber-500/10 text-amber-200", text: "Payment cancelled. You can try again anytime." },
    failed: { cls: "border-rose-500/30 bg-rose-500/10 text-rose-200", text: status.kind === "failed" ? status.message : "" },
  } as const;
  const m = map[status.kind];
  return (
    <div className={`mt-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${m.cls}`}>
      {status.kind === "verifying" && <Loader2 className="h-4 w-4 animate-spin" />}
      <span className="flex-1">{m.text}</span>
      {status.kind === "success" && (
        <button onClick={onDashboard} className="font-medium underline">
          Go now
        </button>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute roles={["RECRUITER", "ADMIN"]}>
      <BillingContent />
    </ProtectedRoute>
  );
}
