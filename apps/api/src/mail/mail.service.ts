import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Transactional email via SMTP (nodemailer) — free with any SMTP provider
 * (Gmail, Zoho, Brevo, etc.). Configured entirely through env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional), SMTP_SECURE
 *
 * If SMTP isn't configured, the service runs in NO-OP mode: it logs what it
 * WOULD have sent and never throws. Email is always best-effort — a mail
 * failure must never break the request that triggered it (e.g. applying to a
 * job still succeeds even if the confirmation email can't be sent).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.from = process.env.SMTP_FROM ?? "EngineerDNA <no-reply@engineerdna.app>";

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured (${host}) — transactional email enabled.`);
    } else {
      this.transporter = null;
      this.logger.warn("SMTP not configured — emails will be logged, not sent. Set SMTP_HOST/USER/PASS to enable.");
    }
  }

  /** Send an email. Best-effort: swallows errors so callers never break. */
  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`[mail:noop] to=${to} subject="${subject}"`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  /** Confirmation that a student's application was received (Internshala-style). */
  async sendApplicationReceived(
    to: string,
    studentName: string | null,
    jobTitle: string,
    companyName: string | null,
  ): Promise<void> {
    const name = studentName?.split(" ")[0] || "there";
    const at = companyName ? ` at <strong>${esc(companyName)}</strong>` : "";
    const subject = `Application received — ${jobTitle}${companyName ? ` at ${companyName}` : ""}`;
    const html = layout(
      "Application submitted 🎉",
      `
        <p style="margin:0 0 14px">Hi ${esc(name)},</p>
        <p style="margin:0 0 14px">
          Your application for <strong>${esc(jobTitle)}</strong>${at} has been successfully received.
        </p>
        <p style="margin:0 0 14px">
          The recruiter can now review your verified engineering profile — your real projects,
          proven skills, and Developer DNA — alongside your resume. We'll email you whenever your
          application status changes.
        </p>
        <p style="margin:0 0 22px">Good luck! 🚀</p>
        <a href="${appUrl()}/applications" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600;font-size:14px">
          Track your application
        </a>
      `,
    );
    await this.send(to, subject, html);
  }

  /** Notify a student that a recruiter moved their application to a new stage. */
  async sendStatusUpdate(
    to: string,
    studentName: string | null,
    jobTitle: string,
    companyName: string | null,
    statusLabel: string,
  ): Promise<void> {
    const name = studentName?.split(" ")[0] || "there";
    const at = companyName ? ` at <strong>${esc(companyName)}</strong>` : "";
    const subject = `Update on your application — ${jobTitle}`;
    const html = layout(
      `You're now: ${esc(statusLabel)}`,
      `
        <p style="margin:0 0 14px">Hi ${esc(name)},</p>
        <p style="margin:0 0 14px">
          There's an update on your application for <strong>${esc(jobTitle)}</strong>${at}.
          Your status is now <strong>${esc(statusLabel)}</strong>.
        </p>
        <a href="${appUrl()}/applications" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600;font-size:14px">
          View details
        </a>
      `,
    );
    await this.send(to, subject, html);
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function appUrl(): string {
  return process.env.WEB_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000";
}

/** A clean, branded HTML email shell. */
function layout(heading: string, body: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f4f5;padding:24px;font-family:-apple-system,Segoe UI,Inter,Helvetica,Arial,sans-serif;color:#18181b">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:linear-gradient(140deg,#6366F1,#8B5CF6);padding:22px 28px">
      <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.01em">EngineerDNA</span>
      <span style="color:rgba(255,255,255,.8);font-size:12px;display:block;margin-top:2px">Evidence over claims</span>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 18px;font-size:20px;font-weight:700">${heading}</h1>
      <div style="font-size:14px;line-height:1.6;color:#3f3f46">${body}</div>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f1f1f4;color:#a1a1aa;font-size:12px;text-align:center">
      You're receiving this because you have an EngineerDNA account.
    </div>
  </div>
</body></html>`;
}
