import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { validateEnv } from "./common/validate-env";

/**
 * API bootstrap. All HTTP routes are namespaced under `/api`.
 * The browser only ever talks to this service — never to internal workers
 * or LLM providers directly.
 */
async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create(AppModule);

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
