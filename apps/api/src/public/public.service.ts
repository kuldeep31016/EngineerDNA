import { Injectable, NotFoundException } from "@nestjs/common";
import type { PublicProfile } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { computeDnaScores } from "../dna/dna-scorer";

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
  ) {}

  /** The public verified profile for a username (public evidence only). */
  async getProfile(username: string): Promise<PublicProfile> {
    const profile = await this.prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
      include: { user: { select: { name: true, profileImage: true } } },
    });
    if (!profile || !profile.isPublic) throw new NotFoundException("Profile not found");

    const items = await this.evidence.getPublicEvidenceItems(profile.userId);
    const { scores, overall, topStrengths } = computeDnaScores(items);
    const used = items.filter((i) => i.strength === "USED");

    const [repos, portfolio] = await Promise.all([
      this.prisma.repository.findMany({
        where: { account: { userId: profile.userId }, isPrivate: false },
        orderBy: [{ stars: "desc" }, { pushedAt: "desc" }],
        take: 6,
        select: { name: true, description: true, language: true, stars: true, htmlUrl: true },
      }),
      this.prisma.portfolio.findUnique({
        where: { userId: profile.userId },
        select: { slug: true, published: true },
      }),
    ]);

    return {
      username: profile.username!,
      name: profile.user.name ?? "Engineer",
      profileImage: profile.user.profileImage ?? null,
      headline: profile.headline ?? null,
      location: profile.location ?? null,
      about: profile.about ?? null,
      githubUsername: profile.githubUsername ?? null,
      portfolioSlug: portfolio?.published ? (portfolio.slug ?? null) : null,
      overall,
      topStrengths,
      verifiedSkillCount: used.length,
      publicRepoCount: new Set(used.flatMap((u) => u.repositories)).size,
      scores,
      verifiedSkills: used
        .map((u) => ({ technology: u.technology, category: u.category, repositoryCount: u.repositoryCount }))
        .sort((a, b) => b.repositoryCount - a.repositoryCount)
        .slice(0, 40),
      topRepos: repos.map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stars,
        htmlUrl: r.htmlUrl,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /** A shields-style SVG badge ("EngineerDNA · Verified · DNA NN") for embedding. */
  async getBadgeSvg(username: string): Promise<string> {
    const profile = await this.prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
      select: { isPublic: true, userId: true },
    });
    let score = 0;
    if (profile?.isPublic) {
      const items = await this.evidence.getPublicEvidenceItems(profile.userId);
      score = computeDnaScores(items).overall;
    }
    return badgeSvg(score, Boolean(profile?.isPublic));
  }
}

/** Render the badge as a self-contained SVG (no external fonts/images). */
function badgeSvg(score: number, verified: boolean): string {
  const label = "EngineerDNA";
  const value = verified ? `Verified · DNA ${score}` : "Unverified";
  // Rough text widths for monospace-ish sizing.
  const labelW = 86;
  const valueW = verified ? 110 : 78;
  const total = labelW + valueW;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#111118"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="url(#brand)"/>
    <rect width="${total}" height="20" fill="url(#g)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + valueW / 2}" y="14">${value}</text>
  </g>
</svg>`;
}
