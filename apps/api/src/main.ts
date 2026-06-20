import "reflect-metadata";
import { mkdirSync } from "node:fs";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { validateEnv } from "./common/validate-env";
import { UPLOADS_DIR } from "./messaging/uploads";

/**
 * API bootstrap. All HTTP routes are namespaced under `/api`.
 * The browser only ever talks to this service — never to internal workers
 * or LLM providers directly.
 */
async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded chat attachments statically at /uploads (unguessable names).
  mkdirSync(UPLOADS_DIR, { recursive: true });
  app.useStaticAssets(UPLOADS_DIR, { prefix: "/uploads/" });

  app.setGlobalPrefix("api");
  // Security headers. CSP is left to the web app (which serves the HTML).
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");

  Logger.log(`EngineerDNA API ready at http://localhost:${port}/api`, "Bootstrap");
}

void bootstrap();
