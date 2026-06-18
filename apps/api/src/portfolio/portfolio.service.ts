import { createHash } from "node:crypto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { ZodType } from "zod";
import type { Portfolio as PortfolioRow, Prisma, User } from "@prisma/client";
import {
  portfolioDataSchema,
  type ExtractResumeInput,
  type Portfolio,
  type PortfolioData,
  type PortfolioTheme,
  type PublicPortfolio,
  type UpdatePortfolioInput,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AnthropicService } from "../llm/anthropic.service";

const SYSTEM = `You convert resume text into structured JSON. You ONLY structure information that is present in the text — you NEVER invent names, employers, dates, links, or achievements.
Output strictly matches the schema. Leave fields empty ("" or []) when the resume does not contain them. Categorize skills into languages, frameworks, databases, tools, and cloud. Return JSON only.`;

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicService,
  ) {}

  /** Extract structured portfolio JSON from resume text. ONE cached LLM call. */
  async extract(user: User, input: ExtractResumeInput): Promise<Portfolio> {
    const hash = createHash("sha256").update(input.resumeText.trim().replace(/\s+/g, " ").toLowerCase()).digest("hex");
    const existing = await this.prisma.portfolio.findUnique({ where: { userId: user.id } });

    // Cost guard: identical resume → reuse the stored extraction (no LLM).
    if (existing && existing.sourceHash === hash) {
      return toContract(existing);
    }

    const data = await this.anthropic.generateObject<PortfolioData>({
      // The schema carries defaults (input ≠ output type), so narrow it here.
      schema: portfolioDataSchema as unknown as ZodType<PortfolioData>,
      system: SYSTEM,
      model: this.anthropic.fastModel, // lightweight model — extraction only
      prompt: `Resume text:\n"""\n${input.resumeText.slice(0, 24000)}\n"""\n\nReturn the structured portfolio JSON.`,
    });

    const slug = existing?.slug ?? (await this.uniqueSlug(data.personal.name || "portfolio", user.id));
    const row = await this.prisma.portfolio.upsert({
      where: { userId: user.id },
      create: { userId: user.id, data: data as unknown as Prisma.InputJsonValue, sourceHash: hash, slug },
      update: { data: data as unknown as Prisma.InputJsonValue, sourceHash: hash },
    });
    return toContract(row);
  }

  /** The user's portfolio (available:false if none yet). */
  async get(user: User): Promise<Portfolio> {
    const row = await this.prisma.portfolio.findUnique({ where: { userId: user.id } });
    return row ? toContract(row) : emptyPortfolio();
  }

  /** Save edits / theme / publish state. No LLM. */
  async update(user: User, input: UpdatePortfolioInput): Promise<Portfolio> {
    const existing = await this.prisma.portfolio.findUnique({ where: { userId: user.id } });
    if (!existing) throw new NotFoundException("Create a portfolio first by uploading a resume.");

    if (input.slug && input.slug !== existing.slug) {
      const taken = await this.prisma.portfolio.findUnique({ where: { slug: input.slug } });
      if (taken && taken.userId !== user.id) throw new ConflictException("That portfolio URL is taken.");
    }

    const row = await this.prisma.portfolio.update({
      where: { userId: user.id },
      data: {
        data: input.data ? (input.data as unknown as Prisma.InputJsonValue) : undefined,
        theme: input.theme,
        published: input.published,
        slug: input.slug,
      },
    });
    return toContract(row);
  }

  /** Public projection for a published portfolio (no auth). */
  async getPublic(slug: string): Promise<PublicPortfolio> {
    const row = await this.prisma.portfolio.findFirst({ where: { slug, published: true } });
    if (!row) throw new NotFoundException("Portfolio not found");
    return { data: portfolioDataSchema.parse(row.data), theme: (row.theme as PortfolioTheme) ?? "modern" };
  }

  private async uniqueSlug(name: string, userId: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32) || `user-${userId.slice(0, 8)}`;
    for (let i = 0; i < 50; i += 1) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const taken = await this.prisma.portfolio.findUnique({ where: { slug: candidate } });
      if (!taken) return candidate;
    }
    return `${base}-${userId.slice(0, 6)}`;
  }
}

function toContract(row: PortfolioRow): Portfolio {
  return {
    available: true,
    data: portfolioDataSchema.parse(row.data),
    theme: (row.theme as PortfolioTheme) ?? "modern",
    published: row.published,
    slug: row.slug ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function emptyPortfolio(): Portfolio {
  return {
    available: false,
    data: portfolioDataSchema.parse({}),
    theme: "modern",
    published: false,
    slug: null,
    updatedAt: "",
  };
}
