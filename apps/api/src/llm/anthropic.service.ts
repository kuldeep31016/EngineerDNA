import Anthropic from "@anthropic-ai/sdk";
import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ZodType } from "zod";
import { zodToJsonSchema as zodToJsonSchemaRaw } from "zod-to-json-schema";

// Narrow the signature: the library's return type triggers "excessively deep"
// inference on complex schemas, and we only need a plain JSON-Schema object.
const toJsonSchema = zodToJsonSchemaRaw as (schema: unknown, name?: string) => object;

/**
 * Thin wrapper around the Anthropic SDK. All LLM work in EngineerDNA goes
 * through here. `generateObject` asks the model for JSON matching a Zod schema
 * (the schema is sent as a JSON Schema in the prompt) and validates the result,
 * so callers always get validated, typed data.
 */
@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private client: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {}

  get model(): string {
    return this.config.get<string>("ANTHROPIC_MODEL") || "claude-opus-4-8";
  }

  /** A cheaper, faster model for high-frequency calls (e.g. interview turns). */
  get fastModel(): string {
    return this.config.get<string>("ANTHROPIC_FAST_MODEL") || "claude-haiku-4-5-20251001";
  }

  private getClient(): Anthropic {
    const apiKey = this.config.get<string>("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "ANTHROPIC_API_KEY is not configured — set it in .env to enable analysis.",
      );
    }
    if (!this.client) this.client = new Anthropic({ apiKey });
    return this.client;
  }

  /** Ask the model for an object matching `schema`. Validated before return. */
  async generateObject<T>(opts: {
    schema: ZodType<T>;
    system: string;
    prompt: string;
    maxTokens?: number;
    model?: string;
  }): Promise<T> {
    const jsonSchema = toJsonSchema(opts.schema, "Result");
    const prompt = `${opts.prompt}

Return ONLY a single JSON object — no markdown code fences, no commentary before or after — that conforms to this JSON Schema:
${JSON.stringify(jsonSchema)}`;

    let text: string;
    try {
      const response = await this.getClient().messages.create({
        model: opts.model ?? this.model,
        max_tokens: opts.maxTokens ?? 8000,
        system: opts.system,
        messages: [{ role: "user", content: prompt }],
      });
      text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
    } catch (err) {
      // Surface Anthropic API failures (bad key, no model access, rate limit)
      // as a clear 503 instead of an opaque 500 from the framework.
      if (err instanceof Anthropic.APIError) {
        const detail =
          err.status === 401
            ? "the ANTHROPIC_API_KEY is invalid or revoked"
            : err.status === 403
              ? "this API key cannot access the requested model"
              : err.status === 404
                ? `the model "${opts.model ?? this.model}" was not found for this key`
                : err.status === 429
                  ? "the Anthropic rate limit was hit — try again shortly"
                  : `the Anthropic API returned ${err.status ?? "an error"}`;
        this.logger.error(`Anthropic request failed: ${err.status} ${err.message}`);
        throw new ServiceUnavailableException(`AI is unavailable — ${detail}. Check ANTHROPIC_API_KEY in .env.`);
      }
      this.logger.error(`Anthropic request failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException("AI is temporarily unavailable. Please try again.");
    }

    try {
      return opts.schema.parse(JSON.parse(extractJsonObject(text)));
    } catch (err) {
      this.logger.error(`Failed to parse model response: ${(err as Error).message}`);
      throw new ServiceUnavailableException("The AI returned an unexpected response. Please try again.");
    }
  }
}

/** Pull the outermost JSON object out of a possibly chatty response. */
function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model response did not contain a JSON object.");
  }
  return text.slice(start, end + 1);
}
