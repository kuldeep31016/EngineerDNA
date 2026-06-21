import { Injectable, NotFoundException } from "@nestjs/common";
import type { Profile, User } from "@prisma/client";
import { proctoringReportSchema } from "@engineerdna/shared";
import type {
  CandidateProfile,
  CandidateSearchResult,
  CandidateSummary,
  DeveloperEvidenceItem,
  RecruiterNote,
  SearchCandidatesInput,
  UpsertRecruiterNoteInput,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { computeDnaScores } from "../dna/dna-scorer";

type ProfileWithUser = Profile & { user: Pick<User, "id" | "name" | "profileImage"> };

@Injectable()
export class RecruiterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
  ) {}

  /** Search public candidates by required skills (matched against USED evidence). */
  async search(recruiter: User, input: SearchCandidatesInput): Promise<CandidateSearchResult> {
    const profiles = await this.publicProfiles();
    const shortlisted = await this.shortlistedIds(recruiter.id);
    const querySkills = (input.skills ?? []).map((s) => s.trim()).filter(Boolean);

    const candidates: CandidateSummary[] = [];
    for (const profile of profiles) {
      const summary = await this.buildSummary(profile, querySkills, shortlisted);
      if (!summary) continue;
      if (querySkills.length > 0 && summary.matchedSkills.length === 0) continue;
      if (input.minOverall != null && summary.overall < input.minOverall) continue;
      candidates.push(summary);
    }

    candidates.sort(
      (a, b) =>
        b.matchedSkills.length - a.matchedSkills.length ||
        b.matchScore - a.matchScore ||
        b.overall - a.overall,
    );

    return { candidates, total: candidates.length };
  }

  /** A candidate's full VERIFIED profile — public repos and evidence only. */
  async getCandidate(recruiter: User, candidateId: string): Promise<CandidateProfile> {
    const profile = await this.prisma.profile.findFirst({
      where: { userId: candidateId },
      include: { user: { select: { id: true, name: true, profileImage: true } } },
    });
    if (!profile) throw new NotFoundException("Candidate not found");

    const items = await this.evidence.getPublicEvidenceItems(candidateId);
    const { scores, overall, topStrengths } = computeDnaScores(items);
    const used = items.filter((i) => i.strength === "USED");

    const [repos, portfolio, bestInterview] = await Promise.all([
      this.prisma.repository.findMany({
        where: { account: { userId: candidateId }, isPrivate: false },
        orderBy: [{ stars: "desc" }, { pushedAt: "desc" }],
        take: 6,
        select: { name: true, description: true, language: true, stars: true, htmlUrl: true },
      }),
      this.prisma.portfolio.findUnique({
        where: { userId: candidateId },
        select: { slug: true, published: true },
      }),
      this.prisma.interview.findFirst({
        where: { userId: candidateId, status: "EVALUATED", overallScore: { not: null } },
        orderBy: { overallScore: "desc" },
        select: { overallScore: true, proctoring: true },
      }),
    ]);

    const shortlisted = await this.shortlistedIds(recruiter.id);

    return {
      ...summaryFields(profile, overall, topStrengths, used, [], overall, shortlisted.has(candidateId)),
      about: profile.about ?? null,
      githubUsername: profile.githubUsername ?? null,
      portfolioSlug: portfolio?.published ? (portfolio.slug ?? null) : null,
      interviewScore: bestInterview?.overallScore ?? null,
      interviewIntegrity: bestInterview?.proctoring
        ? proctoringReportSchema.parse(bestInterview.proctoring)
        : null,
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
      projects: ((profile.projects as unknown as { name?: string; description?: string; url?: string }[]) ?? [])
        .filter((p) => p?.name)
        .slice(0, 12)
        .map((p) => ({ name: p.name!, description: p.description || null, url: p.url || null })),
    };
  }

  /** The recruiter's shortlisted candidates. */
  async listShortlist(recruiter: User): Promise<CandidateSearchResult> {
    const rows = await this.prisma.shortlist.findMany({
      where: { recruiterId: recruiter.id },
      orderBy: { createdAt: "desc" },
    });
    const ids = new Set(rows.map((r) => r.candidateId));
    if (ids.size === 0) return { candidates: [], total: 0 };

    const profiles = (await this.publicProfiles()).filter((p) => ids.has(p.userId));
    const candidates: CandidateSummary[] = [];
    for (const profile of profiles) {
      const summary = await this.buildSummary(profile, [], ids);
      if (summary) candidates.push(summary);
    }
    return { candidates, total: candidates.length };
  }

  async addShortlist(recruiter: User, candidateId: string): Promise<void> {
    const exists = await this.prisma.profile.findFirst({
      where: { userId: candidateId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Candidate not found");
    await this.prisma.shortlist.upsert({
      where: { recruiterId_candidateId: { recruiterId: recruiter.id, candidateId } },
      create: { recruiterId: recruiter.id, candidateId },
      update: {},
    });
  }

  async removeShortlist(recruiter: User, candidateId: string): Promise<void> {
    await this.prisma.shortlist.deleteMany({
      where: { recruiterId: recruiter.id, candidateId },
    });
  }

  /** The recruiter's private note + rating on a candidate (null if none yet). */
  async getNote(recruiter: User, candidateId: string): Promise<RecruiterNote | null> {
    const note = await this.prisma.recruiterNote.findUnique({
      where: { recruiterId_candidateId: { recruiterId: recruiter.id, candidateId } },
    });
    if (!note) return null;
    return { body: note.body, rating: note.rating, updatedAt: note.updatedAt.toISOString() };
  }

  /** Create or update the recruiter's private note + rating on a candidate. */
  async upsertNote(recruiter: User, candidateId: string, input: UpsertRecruiterNoteInput): Promise<RecruiterNote> {
    const exists = await this.prisma.profile.findFirst({
      where: { userId: candidateId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Candidate not found");

    const data: { body?: string | null; rating?: number | null } = {};
    if (input.body !== undefined) data.body = input.body.trim() || null;
    if (input.rating !== undefined) data.rating = input.rating;

    const note = await this.prisma.recruiterNote.upsert({
      where: { recruiterId_candidateId: { recruiterId: recruiter.id, candidateId } },
      create: { recruiterId: recruiter.id, candidateId, ...data },
      update: data,
    });
    return { body: note.body, rating: note.rating, updatedAt: note.updatedAt.toISOString() };
  }

  // Candidates with a passport are searchable; whether they actually appear is
  // gated by having PUBLIC-repo USED evidence (buildSummary returns null
  // otherwise). We never expose private repositories, so this only surfaces work
  // that is already public on GitHub.
  private async publicProfiles(): Promise<ProfileWithUser[]> {
    return this.prisma.profile.findMany({
      include: { user: { select: { id: true, name: true, profileImage: true } } },
    });
  }

  private async shortlistedIds(recruiterId: string): Promise<Set<string>> {
    const rows = await this.prisma.shortlist.findMany({
      where: { recruiterId },
      select: { candidateId: true },
    });
    return new Set(rows.map((r) => r.candidateId));
  }

  private async buildSummary(
    profile: ProfileWithUser,
    querySkills: string[],
    shortlisted: Set<string>,
  ): Promise<CandidateSummary | null> {
    const items = await this.evidence.getPublicEvidenceItems(profile.userId);
    const used = items.filter((i) => i.strength === "USED");
    if (used.length === 0) return null;

    const matched = matchSkills(querySkills, used);
    const { overall, topStrengths } = computeDnaScores(items);
    const matchScore = querySkills.length > 0 ? Math.round((matched.length / querySkills.length) * 100) : overall;
    return summaryFields(profile, overall, topStrengths, used, matched, matchScore, shortlisted.has(profile.userId));
  }
}

/** Shared summary fields used by both the list and the detail view. */
function summaryFields(
  profile: ProfileWithUser,
  overall: number,
  topStrengths: string[],
  used: DeveloperEvidenceItem[],
  matched: string[],
  matchScore: number,
  shortlisted: boolean,
): CandidateSummary {
  const publicRepoCount = new Set(used.flatMap((u) => u.repositories)).size;
  return {
    id: profile.userId,
    name: profile.user.name ?? "Engineer",
    headline: profile.headline ?? null,
    location: profile.location ?? null,
    profileImage: profile.user.profileImage ?? null,
    overall,
    topStrengths,
    verifiedSkillCount: used.length,
    matchedSkills: matched,
    matchScore,
    publicRepoCount,
    shortlisted,
    college: profile.college ?? null,
    experienceYears: profile.experienceYears ?? null,
    availability: profile.availability ?? null,
    expectedSalary: profile.expectedSalary ?? null,
  };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9+#]/g, "");
}

/** Which of the queried skills the candidate has real USED evidence for. */
function matchSkills(querySkills: string[], used: DeveloperEvidenceItem[]): string[] {
  if (querySkills.length === 0) return [];
  const techs = used.map((u) => norm(u.technology));
  const matched: string[] = [];
  for (const skill of querySkills) {
    const q = norm(skill);
    if (!q) continue;
    const hit = techs.some((t) => t === q || (q.length >= 3 && (t.includes(q) || q.includes(t))));
    if (hit) matched.push(skill);
  }
  return matched;
}
