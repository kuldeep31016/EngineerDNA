import { Logger } from "@nestjs/common";

/**
 * Fail-fast environment validation at boot. Critical secrets are required in
 * production; in development we warn (and rely on safe fallbacks) so the app
 * still runs. LLM/GitHub keys are optional — those features degrade gracefully.
 */
export function validateEnv(): void {
  const logger = new Logger("Env");
  const isProd = process.env.NODE_ENV === "production";

  const required = ["DATABASE_URL", "JWT_SECRET"];
  const optional = ["ANTHROPIC_API_KEY", "ENCRYPTION_KEY", "GITHUB_CLIENT_ID", "GOOGLE_CLIENT_ID"];

  const missing = required.filter((k) => !process.env[k]);
  const insecureSecret = !process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-insecure-secret";

  if (isProd && (missing.length > 0 || insecureSecret)) {
    const problems = [...missing, insecureSecret ? "JWT_SECRET (insecure default)" : ""].filter(Boolean);
    logger.error(`Refusing to start in production — fix these env vars: ${problems.join(", ")}`);
    throw new Error("Invalid production environment configuration");
  }

  for (const k of missing) logger.warn(`Missing ${k} — some features may not work.`);
  if (insecureSecret && !isProd) logger.warn("JWT_SECRET is the insecure dev default — set a real secret before deploying.");

  const missingOptional = optional.filter((k) => !process.env[k]);
  if (missingOptional.length > 0) logger.warn(`Optional vars not set (feature-gated): ${missingOptional.join(", ")}`);
}
