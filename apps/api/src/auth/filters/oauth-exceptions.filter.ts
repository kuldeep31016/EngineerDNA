import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";

/**
 * Catches errors that surface during the OAuth callback (passport failures such
 * as an invalid or already-used one-time code). Instead of returning a raw JSON
 * body to the browser, we redirect back to the web app's login page with a
 * friendly `error` query param so the user sees a human-readable message.
 */
@Catch()
export class OAuthExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthExceptionsFilter.name);

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    this.logger.error(`OAuth failure for ${request.method} ${request.url}`, exception as Error);

    const webOrigin = this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";

    response.status(HttpStatus.FOUND).redirect(`${webOrigin}/login?error=provider`);
  }
}