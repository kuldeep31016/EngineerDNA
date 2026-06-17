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
  }): Promise<T> {
    const jsonSchema = toJsonSchema(opts.schema, "Result");
    const prompt = `${opts.prompt}

Return ONLY a single JSON object — no markdown code fences, no commentary before or after — that conforms to this JSON Schema:
${JSON.stringify(jsonSchema)}`;

    const response = await this.getClient().messages.create({
      model: this.model,
      max_tokens: opts.maxTokens ?? 8000,
      system: opts.system,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return opts.schema.parse(JSON.parse(extractJsonObject(text)));
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
