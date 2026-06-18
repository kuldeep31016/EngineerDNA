"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import type { InvoiceDetail } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getInvoice } from "@/services/billing";
import { printToPdf } from "@/lib/export";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

function InvoiceContent() {
  const router = useRouter();
  const params = useParams<{ invoiceId: string }>();
  const [inv, setInv] = useState<InvoiceDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getInvoice(params.invoiceId)
      .then(setInv)
      .catch(() => setMissing(true));
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

  const rows: [string, string][] = [
    ["Invoice number", inv.invoiceNumber],
    ["Status", inv.status],
    ["Recruiter", inv.recruiterName],
    ["Company", inv.company ?? "—"],
    ["Plan purchased", inv.plan],
    ["Razorpay Payment ID", inv.razorpayPaymentId ?? "—"],
    ["Order ID", inv.razorpayOrderId],
    ["Payment method", inv.paymentMethod],
    ["Purchase date", fmtDate(inv.purchaseDate)],
    ["Expiry date", fmtDate(inv.expiryDate)],
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.push("/recruiter/plans")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to billing
        </button>
        <button
          onClick={() => printToPdf(renderInvoiceHtml(inv))}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Download Invoice
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-lg font-bold">EngineerDNA</p>
            <p className="text-xs text-muted-foreground">Evidence over claims</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{inv.invoiceNumber}</p>
            <p className="text-xs uppercase tracking-wide text-emerald-300">{inv.status}</p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="text-right text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{rupees(inv.amount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>GST</span>
            <span className="tabular-nums">{rupees(inv.gst)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{rupees(inv.amount + inv.gst)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

/** A clean, standalone invoice document for printing/PDF (client-side, no API). */
function renderInvoiceHtml(inv: InvoiceDetail): string {
  const esc = (s: unknown) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#555">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(inv.invoiceNumber)}</title>
<style>body{font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#111;max-width:640px;margin:40px auto;padding:0 24px}
h1{font-size:20px;margin:0}.muted{color:#777;font-size:12px}table{width:100%;border-collapse:collapse;font-size:14px}
.head{display:flex;justify-content:space-between;border-bottom:1px solid #e5e5e5;padding-bottom:16px;margin-bottom:16px}
.tot{border-top:1px solid #e5e5e5;margin-top:16px;padding-top:12px}.tot div{display:flex;justify-content:space-between;padding:3px 0;font-size:14px}
.badge{color:#0a7d39;text-transform:uppercase;font-size:12px;font-weight:600}</style></head>
<body>
<div class="head"><div><h1>EngineerDNA</h1><div class="muted">Evidence over claims</div></div>
<div style="text-align:right"><div style="font-weight:700">${esc(inv.invoiceNumber)}</div><div class="badge">${esc(inv.status)}</div></div></div>
<table>
${row("Recruiter", inv.recruiterName)}
${row("Company", inv.company ?? "—")}
${row("Plan purchased", inv.plan)}
${row("Razorpay Payment ID", inv.razorpayPaymentId ?? "—")}
${row("Order ID", inv.razorpayOrderId)}
${row("Payment method", inv.paymentMethod)}
${row("Purchase date", fmtDate(inv.purchaseDate))}
${row("Expiry date", fmtDate(inv.expiryDate))}
</table>
<div class="tot">
<div><span style="color:#555">Subtotal</span><span>${rupees(inv.amount)}</span></div>
<div><span style="color:#555">GST</span><span>${rupees(inv.gst)}</span></div>
<div style="font-weight:700;font-size:16px"><span>Total</span><span>${rupees(inv.amount + inv.gst)}</span></div>
</div>
<p class="muted" style="margin-top:24px">Thank you. Paid via Razorpay (Test Mode).</p>
</body></html>`;
}

export default function InvoicePage() {
  return (
    <ProtectedRoute roles={["RECRUITER", "ADMIN"]}>
      <InvoiceContent />
    </ProtectedRoute>
  );
}
