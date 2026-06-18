"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { PLANS, type PlanDef, type PlanTier, type RecruiterSubscription } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { createOrder, getSubscription, verifyPayment } from "@/services/billing";

type Status =
  | { kind: "idle" }
  | { kind: "processing"; plan: PlanTier }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "cancelled" }
  | { kind: "failed"; message: string };

function PlansContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<RecruiterSubscription | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    void getSubscription().then(setSubscription).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setSdkReady(true);
      return;
    }
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
        modal: {
          ondismiss: () => setStatus((s) => (s.kind === "verifying" || s.kind === "success" ? s : { kind: "cancelled" })),
        },
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
            setTimeout(() => router.push("/recruiter"), 1600);
          } catch {
            setStatus({ kind: "failed", message: "We couldn't verify your payment. If you were charged, contact support." });
          }
        },
      });
      rzp.on("payment.failed", (r) =>
        setStatus({ kind: "failed", message: r.error?.description ?? "Payment failed. Please try again." }),
      );
      rzp.open();
    } catch {
      setStatus({ kind: "failed", message: "Couldn't start checkout. Make sure payments are configured, then retry." });
    }
  }

  const processingPlan = status.kind === "processing" ? status.plan : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Choose a recruiter plan</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Unlock the recruiter dashboard — search verified engineers, post jobs, and rank candidates on real evidence.
        </p>
      </div>

      <StatusBanner status={status} onDashboard={() => router.push("/recruiter")} />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const current = subscription?.active && subscription.plan === plan.id;
          const popular = plan.id === "professional";
          const busy = processingPlan === plan.id || status.kind === "verifying";
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                popular ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {current ? (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                    Current plan
                  </span>
                ) : popular ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    Popular
                  </span>
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
                disabled={!!current || busy || !sdkReady}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                  popular ? "bg-brand text-white hover:opacity-90" : "border border-border hover:bg-accent"
                }`}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : current ? (
                  "Active"
                ) : (
                  `Purchase ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout via Razorpay (Test Mode). Payments are verified on our
        servers.
      </p>
    </main>
  );
}

function StatusBanner({ status, onDashboard }: { status: Status; onDashboard: () => void }) {
  if (status.kind === "idle" || status.kind === "processing") return null;
  const map = {
    verifying: { cls: "border-border bg-card text-muted-foreground", text: "Verifying your payment…" },
    success: { cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200", text: "Payment successful — unlocking your dashboard…" },
    cancelled: { cls: "border-amber-500/30 bg-amber-500/10 text-amber-200", text: "Payment cancelled. You can try again anytime." },
    failed: { cls: "border-rose-500/30 bg-rose-500/10 text-rose-200", text: status.kind === "failed" ? status.message : "" },
  } as const;
  const m = map[status.kind];
  return (
    <div className={`mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-lg border px-4 py-3 text-sm ${m.cls}`}>
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

export default function PlansPage() {
  return (
    <ProtectedRoute roles={["RECRUITER", "ADMIN"]}>
      <PlansContent />
    </ProtectedRoute>
  );
}
