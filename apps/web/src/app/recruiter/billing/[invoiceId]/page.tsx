"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import type { InvoiceDetail } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getInvoice } from "@/services/billing";
import { printToPdf } from "@/lib/export";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}
const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

function InvoiceContent() {
  const router = useRouter();
  const params = useParams<{ invoiceId: string }>();
  const [inv, setInv] = useState<InvoiceDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getInvoice(params.invoiceId).then(setInv).catch(() => setMissing(true));
  }, [params.invoiceId]);

  if (missing) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-lg font-semibold">Invoice not found</p>
        <p className="mt-1 text-sm text-muted-foreground">This invoice doesn&apos;t exist or isn&apos;t yours.</p>
      </main>
    );
  }
  if (!inv) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const paid = inv.status === "paid";

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-md">
        <button
          onClick={() => router.push("/recruiter/plans")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to billing
        </button>

        {/* Brand */}
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">E</span>
          <span className="text-sm font-semibold">EngineerDNA</span>
        </div>

        {/* Stripe-style receipt card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="px-8 pb-7 pt-9 text-center">
            <div className="relative mx-auto h-14 w-12">
              <div className="h-full w-full rounded-md border border-border bg-secondary" />
              <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{paid ? "Invoice paid" : `Invoice ${inv.status}`}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">{money(inv.amount + inv.gst)}</p>

            <button
              onClick={() => setOpen((v) => !v)}
              className="mx-auto mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View invoice and payment details
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="mt-4 space-y-2 rounded-lg bg-secondary p-4 text-left text-sm">
                {(
                  [
                    ["Billed to", inv.recruiterName],
                    ["Company", inv.company ?? "—"],
                    ["Plan", `${inv.plan} — 30 days`],
                    ["Order ID", inv.razorpayOrderId],
                    ["Payment ID", inv.razorpayPaymentId ?? "—"],
                    ["Expires on", fmtDate(inv.expiryDate)],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="break-all text-right font-medium text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border px-8 py-5 text-sm">
            <Row k="Invoice number" v={inv.invoiceNumber} />
            <Row k="Payment date" v={fmtDate(inv.purchaseDate)} />
            <Row k="Payment method" v={inv.paymentMethod} />
          </div>

          <div className="px-8 pb-8">
            <button
              onClick={() => printToPdf(renderInvoiceHtml(inv))}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Download invoice
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by <span className="font-semibold">EngineerDNA</span> · Razorpay (Test Mode)
        </p>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="break-all text-right font-medium text-foreground">{v}</span>
    </div>
  );
}

/** A full, professional invoice document for printing/PDF — client-side, no API. */
function renderInvoiceHtml(inv: InvoiceDetail): string {
  const esc = (s: unknown) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const total = inv.amount + inv.gst;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${esc(inv.invoiceNumber)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,Segoe UI,Inter,Helvetica,Arial,sans-serif;color:#1a1a1a;margin:0;background:#fff}
  .page{max-width:720px;margin:0 auto;padding:48px 40px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
  .brand{display:flex;align-items:center;gap:10px}
  .mark{width:34px;height:34px;border-radius:8px;background:#6366F1;color:#fff;display:grid;place-items:center;font-weight:700}
  .brand b{font-size:16px}.brand .t{color:#6b7280;font-size:11px}
  .inv h2{margin:0;font-size:22px;letter-spacing:.02em}
  .inv .meta{color:#6b7280;font-size:13px;text-align:right;margin-top:4px;line-height:1.7}
  .cols{display:flex;justify-content:space-between;gap:24px;margin:8px 0 28px}
  .cols .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px}
  .cols .v{font-size:13px;line-height:1.6;color:#374151}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;color:#9ca3af;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.06em;padding:0 0 10px;border-bottom:1px solid #e5e7eb}
  td{padding:14px 0;border-bottom:1px solid #f1f1f1}
  td.r,th.r{text-align:right}
  .totals{margin-left:auto;width:260px;margin-top:18px;font-size:14px}
  .totals div{display:flex;justify-content:space-between;padding:6px 0}
  .totals .grand{border-top:2px solid #111;margin-top:6px;padding-top:12px;font-weight:700;font-size:16px}
  .paid{display:inline-block;background:#dcfce7;color:#15803d;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:999px}
  .pay{margin-top:36px;background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;font-size:13px}
  .pay h4{margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af}
  .pay div{display:flex;justify-content:space-between;padding:4px 0;color:#374151}
  .foot{margin-top:40px;color:#9ca3af;font-size:12px;text-align:center}
</style></head>
<body><div class="page">
  <div class="top">
    <div class="brand"><div class="mark">E</div><div><b>EngineerDNA</b><div class="t">Evidence over claims</div></div></div>
    <div class="inv"><h2>INVOICE</h2><div class="meta">${esc(inv.invoiceNumber)}<br/>${esc(fmtDate(inv.purchaseDate))}<br/><span class="paid">${esc(inv.status)}</span></div></div>
  </div>

  <div class="cols">
    <div><div class="lbl">Billed to</div><div class="v"><b>${esc(inv.recruiterName)}</b><br/>${esc(inv.company ?? "")}</div></div>
    <div style="text-align:right"><div class="lbl">From</div><div class="v"><b>EngineerDNA</b><br/>support@engineerdna.app</div></div>
  </div>

  <table>
    <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead>
    <tbody>
      <tr><td><b>${esc(inv.plan)} Plan</b><br/><span style="color:#9ca3af">Recruiter subscription · 30 days</span></td><td class="r">1</td><td class="r">${money(inv.amount)}</td><td class="r">${money(inv.amount)}</td></tr>
    </tbody>
  </table>

  <div class="totals">
    <div><span style="color:#6b7280">Subtotal</span><span>${money(inv.amount)}</span></div>
    <div><span style="color:#6b7280">GST (0%)</span><span>${money(inv.gst)}</span></div>
    <div class="grand"><span>Total</span><span>${money(total)}</span></div>
  </div>

  <div class="pay">
    <h4>Payment details</h4>
    <div><span style="color:#6b7280">Method</span><span>${esc(inv.paymentMethod)}</span></div>
    <div><span style="color:#6b7280">Payment ID</span><span>${esc(inv.razorpayPaymentId ?? "—")}</span></div>
    <div><span style="color:#6b7280">Order ID</span><span>${esc(inv.razorpayOrderId)}</span></div>
    <div><span style="color:#6b7280">Paid on</span><span>${esc(fmtDate(inv.purchaseDate))}</span></div>
    <div><span style="color:#6b7280">Valid until</span><span>${esc(fmtDate(inv.expiryDate))}</span></div>
  </div>

  <p class="foot">Thank you for subscribing to EngineerDNA. Paid securely via Razorpay (Test Mode).</p>
</div></body></html>`;
}

export default function InvoicePage() {
  return (
    <ProtectedRoute roles={["RECRUITER", "ADMIN"]}>
      <InvoiceContent />
    </ProtectedRoute>
  );
}
